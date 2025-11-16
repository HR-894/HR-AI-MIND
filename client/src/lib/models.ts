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
const CUSTOM_MODELS_KEY = "hrai-custom-models";

// Helper to get custom models from localStorage
function getCustomModels(): ModelMeta[] {
  try {
    const stored = localStorage.getItem(CUSTOM_MODELS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function fetchModelsJSON(): Promise<ModelMeta[]> {
  try {
    const res = await fetch("/models.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to fetch models.json");
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ ts: Date.now(), data }));
      // Merge with custom models
      const customModels = getCustomModels();
      return [...data as ModelMeta[], ...customModels];
    }
    throw new Error("Invalid models.json format");
  } catch (err) {
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cachedModels = parsed.data as ModelMeta[];
        const customModels = getCustomModels();
        return [...cachedModels, ...customModels];
      } catch {}
    }
    // Final fallback: complete hardcoded list (in case models.json fails to load)
    console.warn("Using hardcoded model fallback - models.json fetch failed");
    const customModels = getCustomModels();
    return [
      {
        id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        name: "Llama 3.2 1B",
        displayName: "Llama 3.2 1B Instruct",
        sizeMB: 630,
        quantization: "q4f32_1",
        vramMinGB: 1.5,
        speed: "Fast",
        description: "Smallest and fastest model. Perfect for quick responses and general conversations.",
        recommended: "Quick responses • Low-end devices • Real-time chat"
      },
      {
        id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
        name: "Llama 3.2 3B",
        displayName: "Llama 3.2 3B Instruct",
        sizeMB: 1900,
        quantization: "q4f32_1",
        vramMinGB: 3,
        speed: "Balanced",
        description: "Balanced model with better quality responses. Good for most use cases.",
        recommended: "Balanced usage • General tasks • Mid-range devices"
      },
      {
        id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
        name: "Phi 3.5 Mini",
        displayName: "Phi 3.5 Mini Instruct",
        sizeMB: 2300,
        quantization: "q4f16_1",
        vramMinGB: 3,
        speed: "Balanced",
        description: "Microsoft's Phi model. Great for coding and technical tasks.",
        recommended: "Coding • Technical queries • Advanced reasoning"
      },
      {
        id: "Llama-3-8B-Instruct-q4f16_1-MLC",
        name: "Llama 3 8B",
        displayName: "Llama 3 8B Instruct",
        sizeMB: 4900,
        quantization: "q4f16_1",
        vramMinGB: 6,
        speed: "Pro Quality",
        description: "The most powerful model. Excellent for complex reasoning, coding, and creative tasks.",
        recommended: "High-end devices • Best quality • Complex tasks"
      },
      ...customModels
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
