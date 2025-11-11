export interface ModelMeta {
  id: string;
  name: string;
  displayName: string;
  sizeMB: number;
  quantization: string;
  vramMinGB: number;
  speed: string;
  description: string;
  recommended: string;
}

const LOCAL_KEY = "hrai-models-cache-v1";

export async function fetchModelsJSON(): Promise<ModelMeta[]> {
  try {
    const res = await fetch("/models.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to fetch models.json");
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ ts: Date.now(), data }));
      return data as ModelMeta[];
    }
    throw new Error("Invalid models.json format");
  } catch (err) {
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.data as ModelMeta[];
      } catch {}
    }
    // Final fallback: hardcoded minimal list
    return [
      {
        id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        name: "Llama 3.2 1B",
        displayName: "Llama 3.2 1B Instruct",
        sizeMB: 630,
        quantization: "q4f32_1",
        vramMinGB: 1.5,
        speed: "Fast",
        description: "Fallback entry.",
        recommended: "General"
      }
    ];
  }
}

export async function fetchModelsAPI(): Promise<ModelMeta[]> {
  try {
    const res = await fetch("/api/models", { cache: "no-cache" });
    if (!res.ok) throw new Error("API fetch failed");
    const data = await res.json();
    if (Array.isArray(data)) return data as ModelMeta[];
    throw new Error("Invalid API response format");
  } catch (e) {
    // fallback to JSON method
    return fetchModelsJSON();
  }
}

import { useEffect, useState } from "react";

export function useModels(source: "json" | "api" = "json") {
  const [models, setModels] = useState<ModelMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = source === "api" ? await fetchModelsAPI() : await fetchModelsJSON();
        if (active) setModels(data);
      } catch (e: any) {
        if (active) setError(e.message || "Failed to load models");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [source]);

  return { models: models ?? [], loading, error };
}
