import * as webllm from "@mlc-ai/web-llm";

/**
 * Check if a model is already cached/downloaded
 * Simplified to use localStorage as the single source of truth
 * The useAIWorker hook calls markModelAsCached() after successful init
 */
export async function isModelCached(modelId: string): Promise<boolean> {
  try {
    const downloadedModels = localStorage.getItem('webllm_downloaded_models');
    const isTrackedInStorage = downloadedModels ? JSON.parse(downloadedModels).includes(modelId) : false;
    
    console.log(`Model ${modelId} - localStorage tracking:`, isTrackedInStorage);
    
    return isTrackedInStorage;
  } catch (error) {
    console.error('Error checking model cache:', error);
    return false;
  }
}

/**
 * Mark a model as successfully downloaded/cached
 */
export function markModelAsCached(modelId: string): void {
  try {
    const downloadedModels = localStorage.getItem('webllm_downloaded_models');
    const models = downloadedModels ? JSON.parse(downloadedModels) : [];
    
    if (!models.includes(modelId)) {
      models.push(modelId);
      localStorage.setItem('webllm_downloaded_models', JSON.stringify(models));
      console.log(`Marked model ${modelId} as cached`);
    }
  } catch (error) {
    console.error('Error marking model as cached:', error);
  }
}

/**
 * Remove a model from cached list
 */
export function unmarkModelAsCached(modelId: string): void {
  try {
    const downloadedModels = localStorage.getItem('webllm_downloaded_models');
    if (downloadedModels) {
      const models = JSON.parse(downloadedModels);
      const filtered = models.filter((m: string) => m !== modelId);
      localStorage.setItem('webllm_downloaded_models', JSON.stringify(filtered));
      console.log(`Unmarked model ${modelId} from cache`);
    }
  } catch (error) {
    console.error('Error unmarking model:', error);
  }
}

/**
 * Get list of all downloaded/cached models
 */
export async function getDownloadedModels(): Promise<string[]> {
  try {
    const cacheNames = await caches.keys();
    const modelCaches = cacheNames.filter(name => name.includes('webllm/model/'));
    
    const downloadedModels: string[] = [];
    
    for (const cacheName of modelCaches) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      if (keys.length > 0) {
        // Extract model ID from cache name
        const modelId = cacheName.replace('webllm/model/', '');
        downloadedModels.push(modelId);
      }
    }
    
    return downloadedModels;
  } catch (error) {
    console.error('Error getting downloaded models:', error);
    return [];
  }
}

/**
 * Get available model configurations
 */
export function getAvailableModels() {
  return [
    {
      id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
      name: "Llama 3.2 1B",
      displayName: "Llama 3.2 1B (Fast)",
    },
    {
      id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
      name: "Llama 3.2 3B",
      displayName: "Llama 3.2 3B (Balanced)",
    },
    {
      id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
      name: "Phi 3.5 Mini",
      displayName: "Phi 3.5 Mini (Technical)",
    },
  ];
}
