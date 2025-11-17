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

// Sanitize string to prevent XSS attacks
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  // Remove HTML tags and script content
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validate and sanitize model metadata to prevent XSS
function sanitizeModel(model: any): ModelMeta | null {
  try {
    // Validate required fields
    if (!model.id || !model.name || !model.displayName) return null;
    
    // Validate model ID format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(model.id)) {
      console.warn(`Invalid model ID format: ${model.id}`);
      return null;
    }
    
    return {
      id: sanitizeString(model.id),
      name: sanitizeString(model.name),
      displayName: sanitizeString(model.displayName),
      sizeMB: Math.max(0, Number(model.sizeMB) || 0),
      quantization: sanitizeString(model.quantization || 'unknown'),
      vramMinGB: Math.max(0, Number(model.vramMinGB) || 0),
      speed: sanitizeString(model.speed || 'Unknown'),
      description: sanitizeString(model.description || ''),
      recommended: sanitizeString(model.recommended || ''),
    };
  } catch {
    return null;
  }
}

// Helper to get custom models from localStorage with XSS protection
function getCustomModels(): ModelMeta[] {
  try {
    const stored = localStorage.getItem(CUSTOM_MODELS_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Sanitize each model and filter out invalid ones
    return parsed
      .map(sanitizeModel)
      .filter((model): model is ModelMeta => model !== null);
  } catch {
    // Silently fail in production, return empty array
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
      // Merge with custom models (sanitized for XSS protection)
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
        id: "Gemma-2B-it-q4f16_1-MLC",
        name: "Gemma 2B",
        displayName: "Google Gemma 2B (Balanced)",
        sizeMB: 1500,
        quantization: "q4f16_1",
        vramMinGB: 2.5,
        speed: "Balanced",
        description: "A lightweight and fast model from Google. Great balance of speed and intelligence.",
        recommended: "Mid-range devices • Good quality • Balanced usage"
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
      {
        id: "gemma-2-9b-it-q4f16_1-MLC",
        name: "Gemma 2 9B",
        displayName: "Google Gemma 2 9B (Pro)",
        sizeMB: 5500,
        quantization: "q4f16_1",
        vramMinGB: 7,
        speed: "Pro Quality",
        description: "Google's latest generation model. Outperforms Llama 3 8B on many benchmarks.",
        recommended: "Best-in-class quality • High-end devices"
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
