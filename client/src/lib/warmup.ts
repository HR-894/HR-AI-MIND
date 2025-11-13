// Lightweight, silent model warm-up using a temporary worker instance
// Ensures compilation artifacts are cached without touching UI state

export async function warmupModelOnce(modelId: string): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;

    // Skip in E2E test mode
    if ((window as any).__E2E_TEST_MODE__) return false;

    // Already warmed up?
    const warmFlag = localStorage.getItem(`warmupDone:${modelId}`);
    if (warmFlag === "1") return false;

    // Verify model is actually cached before warming up
    let cached = false;
    try {
      const { isModelCached } = await import("@/lib/model-utils");
      cached = await isModelCached(modelId);
    } catch (e) {
      // Fallback: check IndexedDB directly (offline-safe)
      try {
        const dbName = `webllm/model/${modelId}`;
        const databases = await (indexedDB as any).databases?.();
        cached = Array.isArray(databases) && databases.some((db: any) => db?.name === dbName);
      } catch {}
    }

    if (!cached) return false;

    // Spawn a temporary worker that is NOT wired to UI state
    const worker = new Worker(new URL("../workers/ai.worker.ts", import.meta.url), { type: "module" });

    const result = await new Promise<boolean>((resolve) => {
      let finished = false;
      const cleanup = () => {
        try { worker.terminate(); } catch {}
      };

      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          resolve(false);
        }
      }, 120000); // 2 minutes safety timeout

      worker.onmessage = (e: MessageEvent<any>) => {
        const msg = e.data;
        if (msg?.type === "initComplete" && !finished) {
          finished = true;
          clearTimeout(timeout);
          try { localStorage.setItem(`warmupDone:${modelId}`, "1"); } catch {}
          cleanup();
          resolve(true);
        }
        if (msg?.type === "error" && !finished) {
          finished = true;
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        }
      };

      // Start warm-up init (this will compile and cache artifacts)
      worker.postMessage({ type: "init", modelId });
    });

    return result;
  } catch {
    return false;
  }
}
