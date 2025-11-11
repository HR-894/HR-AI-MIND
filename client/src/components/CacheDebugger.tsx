import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { isModelCached, unmarkModelAsCached, getAvailableModels } from "@/lib/model-utils";

export function CacheDebugger() {
  const [cacheStatus, setCacheStatus] = useState<Record<string, boolean>>({});
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [localStorageData, setLocalStorageData] = useState<string>("");

  const checkCache = async () => {
    // Check localStorage
    const stored = localStorage.getItem('webllm_downloaded_models');
    setLocalStorageData(stored || "null");

    // Check each model
    const models = getAvailableModels();
    const status: Record<string, boolean> = {};
    
    for (const model of models) {
      status[model.id] = await isModelCached(model.id);
    }
    setCacheStatus(status);

    // Check cache API
    const names = await caches.keys();
    setCacheNames(names);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('webllm_downloaded_models');
    console.log('Cleared webllm_downloaded_models from localStorage');
    checkCache();
  };

  const clearAllCaches = async () => {
    const names = await caches.keys();
    for (const name of names) {
      await caches.delete(name);
      console.log(`Deleted cache: ${name}`);
    }
    localStorage.removeItem('webllm_downloaded_models');
    console.log('Cleared all caches and localStorage');
    checkCache();
  };

  return (
    <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
          <AlertCircle className="h-5 w-5" />
          Cache Debugger (Dev Tool)
        </CardTitle>
        <CardDescription>
          Debug and inspect model cache status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={checkCache} size="sm" variant="outline" className="flex-shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          <Button onClick={clearLocalStorage} size="sm" variant="outline" className="text-orange-600 flex-shrink-0">
            Clear localStorage
          </Button>
          <Button onClick={clearAllCaches} size="sm" variant="destructive" className="flex-shrink-0">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        {localStorageData && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">localStorage:</h4>
            <pre className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded overflow-auto">
              {localStorageData}
            </pre>
          </div>
        )}

        {Object.keys(cacheStatus).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Model Cache Status:</h4>
            {Object.entries(cacheStatus).map(([modelId, cached]) => (
              <div key={modelId} className="text-xs flex items-center justify-between">
                <span className="font-mono">{modelId}</span>
                <span className={cached ? "text-green-600" : "text-red-600"}>
                  {cached ? "✓ CACHED" : "✗ NOT CACHED"}
                </span>
              </div>
            ))}
          </div>
        )}

        {cacheNames.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Cache API ({cacheNames.length}):</h4>
            <div className="text-xs space-y-1 max-h-40 overflow-auto">
              {cacheNames.map(name => (
                <div key={name} className="font-mono text-xs bg-black/5 dark:bg-white/5 p-1 rounded">
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
