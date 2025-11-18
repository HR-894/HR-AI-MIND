import * as webllm from "@mlc-ai/web-llm";

/**
 * Check if a model is already cached/downloaded
 * Checks BOTH localStorage tracking AND actual cache storage for offline reliability
 */
export async function isModelCached(modelId: string): Promise<boolean> {
  try {
    // First check localStorage (fast)
    const downloadedModels = localStorage.getItem('webllm_downloaded_models');
    const isTrackedInStorage = downloadedModels ? JSON.parse(downloadedModels).includes(modelId) : false;
    
    if (isTrackedInStorage) {
      console.log(`Model ${modelId} - found in localStorage tracking`);
      return true;
    }
    
    // If not in localStorage, check actual cache storage (for offline reliability)
    // This catches models that were downloaded but localStorage wasn't updated
    const hasActualCache = await checkActualModelCache(modelId);
    
    if (hasActualCache) {
      console.log(`Model ${modelId} - found in actual cache storage (updating localStorage)`);
      // Update localStorage to track it
      markModelAsCached(modelId);
      return true;
    }
    
    console.log(`Model ${modelId} - not found in cache`);
    return false;
  } catch (error) {
    console.error('Error checking model cache:', error);
    return false;
  }
}

/**
 * Check if model actually exists in cache storage (IndexedDB + Cache API)
 * This is the real source of truth for offline availability
 */
async function checkActualModelCache(modelId: string): Promise<boolean> {
  try {
    // Check IndexedDB first (WebLLM uses this for model weights)
    // This is the ONLY reliable source - must match exact database name
    const dbName = `webllm/model/${modelId}`;
    const databases = await indexedDB.databases();
    const hasIndexedDB = databases.some(db => db.name === dbName);
    
    if (hasIndexedDB) {
      console.log(`Model ${modelId} found in IndexedDB`);
      // Verify the database actually has data (not just created)
      try {
        const request = indexedDB.open(dbName);
        const hasData = await new Promise<boolean>((resolve) => {
          request.onsuccess = () => {
            const db = request.result;
            const hasObjectStores = db.objectStoreNames.length > 0;
            db.close();
            resolve(hasObjectStores);
          };
          request.onerror = () => resolve(false);
        });
        
        if (hasData) {
          return true;
        }
      } catch {
        // If verification fails, assume not cached
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking actual model cache:', error);
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
 * Delete a model from cache storage
 * Removes from IndexedDB and localStorage tracking
 */
export async function deleteModelFromCache(modelId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Deleting model ${modelId} from cache...`);
    
    // Remove from IndexedDB (where model weights are stored)
    const dbName = `webllm/model/${modelId}`;
    
    // Check if database exists first
    const databases = await indexedDB.databases();
    const dbExists = databases.some(db => db.name === dbName);
    
    if (dbExists) {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        
        request.onsuccess = () => {
          console.log(`Successfully deleted IndexedDB: ${dbName}`);
          resolve();
        };
        
        request.onerror = () => {
          console.error(`Failed to delete IndexedDB: ${dbName}`);
          reject(new Error(`Failed to delete database: ${request.error}`));
        };
        
        request.onblocked = () => {
          console.warn(`Delete blocked for ${dbName}. Close all tabs using this model.`);
          // Continue anyway - may succeed after timeout
          setTimeout(() => resolve(), 1000);
        };
      });
    }
    
    // Remove from localStorage tracking
    unmarkModelAsCached(modelId);
    
    console.log(`Model ${modelId} deleted successfully`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting model ${modelId}:`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
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
    {
      id: "Phi-3.5-vision-instruct-q4f16_1-MLC",
      name: "Phi 3.5 Vision",
      displayName: "Phi 3.5 Vision (Multimodal)",
    },
    {
      id: "Llama-3-8B-Instruct-q4f16_1-MLC",
      name: "Llama 3 8B",
      displayName: "Llama 3 8B (Pro Quality)",
    },
  ];
}
