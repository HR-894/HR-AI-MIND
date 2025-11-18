import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;
let currentModelId: string | null = null;

self.onmessage = async (e: MessageEvent) => {
  const message = e.data;

  try {
    switch (message.type) {
      case "init":
        await handleInit(message.modelId);
        break;
      
      case "generate":
        await handleGenerate(message.messages, message.options);
        break;
      
      case "abort":
        await handleAbort();
        break;
    }
  } catch (error: any) {
    console.error("Worker error:", error);
    self.postMessage({
      type: "error",
      error: error?.message || error?.toString() || "Unknown error occurred",
    });
  }
};

async function handleInit(modelId: string) {
  try {
    if (engine && currentModelId === modelId) {
      self.postMessage({ type: "initComplete" });
      return;
    }

    if (engine) {
      await engine.unload();
      engine = null;
    }

    const initProgressCallback = (progress: webllm.InitProgressReport) => {
      const percentage = progress.progress * 100;
      // Detect if downloading or loading from cache based on progress text
      const isDownloading = progress.text?.toLowerCase().includes('download') || 
                           progress.text?.toLowerCase().includes('fetch');
      self.postMessage({
        type: "initProgress",
        progress: percentage,
        phase: isDownloading ? 'downloading' : 'loading',
        text: progress.text || ''
      });
    };

    // Create engine with optimized configuration for faster loading
    // Use prebuilt app config with proper model list
    const selectedConfig = webllm.prebuiltAppConfig;
    
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback,
      logLevel: "ERROR", // Reduce console noise
      appConfig: {
        ...selectedConfig,
        // Use IndexedDB caching for faster subsequent loads
        useIndexedDBCache: true,
      },
    });

    currentModelId = modelId;
    
    self.postMessage({ type: "initComplete" });
  } catch (error: any) {
    console.error("Model initialization error:", error);
    throw new Error(`Failed to initialize model: ${error.message}`);
  }
}

async function handleGenerate(messages: any[], options: any) {
  if (!engine) {
    throw new Error("Engine not initialized. Please load a model first.");
  }

  const startTime = performance.now();
  let tokenCount = 0;

  try {
    // Worker is now 'dumber' - messages array comes pre-formatted from the hook
    // with system prompt already constructed and injected
    const cleanMessages = messages.map(msg => ({
      role: msg.role,
      content: String(msg.content || ""),
    }));

    // Use user's maxTokens directly - response length guidance is in system prompt
    const finalMaxTokens = Math.max(1, Math.min(4096, options.maxTokens ?? 2048));

    const chunks = await engine.chat.completions.create({
      messages: cleanMessages,
      temperature: Math.max(0, Math.min(2, options.temperature ?? 0.7)),
      max_tokens: finalMaxTokens,
      stream: true,
      top_p: options.top_p ?? 0.95,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
    });

    for await (const chunk of chunks) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        tokenCount++;
        self.postMessage({
          type: "token",
          content,
        });
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const tokensPerSecond = tokenCount / (duration / 1000);

    self.postMessage({ 
      type: "complete",
      metrics: {
        tokenCount,
        duration,
        tokensPerSecond: tokensPerSecond.toFixed(2),
      }
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    if (error.message?.includes("abort") || error.message?.includes("interrupt")) {
      self.postMessage({ type: "aborted" });
    } else {
      throw new Error(`Generation failed: ${error.message}`);
    }
  }
}

async function handleAbort() {
  if (engine) {
    await engine.interruptGenerate();
    self.postMessage({ type: "aborted" });
  }
}
