import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Cpu, HardDrive, Zap, CheckCircle2, Loader2, ChevronDown, AlertTriangle, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { workerClient } from "@/lib/worker-client";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/use-network-status";

import { useModels } from "@/lib/models";
import { useAppStore, selectors } from "@/store/appStore";

interface ModelDownloadManagerProps {
  currentModelId: string;
  onModelChange: (modelId: string) => void;
  onDownloadProgress?: (progress: number) => void;
  onDownloadStateChange?: (state: "idle" | "downloading" | "complete" | "error") => void;
}

export function ModelDownloadManager({ 
  currentModelId, 
  onModelChange, 
  onDownloadProgress,
  onDownloadStateChange
}: ModelDownloadManagerProps) {
  const modelState = useAppStore(selectors.modelState);
  const modelProgress = useAppStore(selectors.modelProgress);
  const { models } = useModels("json");
  const isOnline = useNetworkStatus();
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<{ modelId: string; model: any } | null>(null);
  const [storageQuota, setStorageQuota] = useState<{ available: number; total: number } | null>(null);
  const [cachedModels, setCachedModels] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Check which models are cached on mount and when dropdown opens
  useEffect(() => {
    const checkCachedModels = async () => {
      try {
        const { isModelCached } = await import("@/lib/model-utils");
        const cached = new Set<string>();
        
        for (const model of models) {
          const isCached = await isModelCached(model.id);
          if (isCached) {
            cached.add(model.id);
          }
        }
        
        setCachedModels(cached);
      } catch (err) {
        console.warn('Could not check cached models:', err);
      }
    };

    if (dropdownOpen) {
      checkCachedModels();
    }
  }, [dropdownOpen, models]);

  const checkStorageQuota = async (modelSizeMB: number): Promise<boolean> => {
    if (!navigator.storage || !navigator.storage.estimate) {
      // Quota API not available, allow download
      return true;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const available = estimate.quota && estimate.usage 
        ? (estimate.quota - estimate.usage) / (1024 * 1024) // Convert to MB
        : Infinity;
      const total = estimate.quota ? estimate.quota / (1024 * 1024) : Infinity;

      setStorageQuota({ available, total });

      if (available < modelSizeMB * 1.1) { // Add 10% buffer
        toast({
          title: "Insufficient Storage",
          description: `Need ${(modelSizeMB / 1024).toFixed(2)} GB but only ${(available / 1024).toFixed(2)} GB available`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Storage quota check failed:", error);
      // Allow download if check fails
      return true;
    }
  };

  const initiateDownload = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    // Check if model is already downloaded (offline check)
    try {
      const { isModelCached } = await import("@/lib/model-utils");
      const isCached = await isModelCached(modelId);
      
      if (isCached) {
        toast({
          title: "Model Already Downloaded",
          description: "This model is already available offline. Loading it now...",
        });
        // Auto-load the cached model
        workerClient.sendMessage({ type: "init", modelId });
        onModelChange(modelId);
        return;
      }
    } catch (err) {
      console.warn('Could not check model cache:', err);
    }

    // Check network status for new downloads
    if (!isOnline) {
      toast({
        title: "You are offline",
        description: "Please connect to the internet to download new models.",
        variant: "destructive",
      });
      return;
    }

    setPendingDownload({ modelId, model });
    setShowConfirmDialog(true);
  };

  const handleDownloadModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    // Check storage quota first
    const hasSpace = await checkStorageQuota(model.sizeMB);
    if (!hasSpace) {
      return;
    }

    try {
      setDownloadingModel(modelId);
      onDownloadStateChange?.("downloading");
      setShowConfirmDialog(false);
      setPendingDownload(null);

      // Notify user that download will continue in background
      toast({
        title: "Download Started",
        description: "Model is downloading. You can close this menu - download continues in background.",
      });

      // Start download - worker client is persistent
      console.log(`[ModelDownloadManager] Starting download for ${modelId}`);
      workerClient.sendMessage({
        type: "init",
        modelId,
      });
      
      // Auto-close dropdown after 2 seconds so user can continue using app
      // Download continues in background via persistent listener in ChatPage
      setTimeout(() => {
        setDropdownOpen(false);
        setDownloadingModel(null); // Clear local state, download still continues
      }, 2000);
      
    } catch (error: any) {
      console.error("Model download error:", error);
      setDownloadingModel(null);
      onDownloadStateChange?.("error");
      toast({
        title: "Download Error",
        description: error.message || "Failed to download model",
        variant: "destructive",
      });
    }
  };

  const currentModel = models.find(m => m.id === currentModelId);
  const isDownloading = downloadingModel !== null;

  return (
    <>
    <DropdownMenu open={dropdownOpen} onOpenChange={(open) => {
      // Prevent closing dropdown while downloading
      if (!open && downloadingModel) {
        toast({
          title: "Download in Progress",
          description: "Model is downloading in background. You can close this now.",
        });
        setDropdownOpen(false); // Allow closing, download continues in background
        return;
      }
      setDropdownOpen(open);
    }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-2 hover:border-primary/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 dark:hover:from-indigo-900/30 dark:hover:via-purple-900/30 dark:hover:to-pink-900/30 hover:scale-105 hover:shadow-lg"
          disabled={isDownloading}
          data-testid="model-download-button"
        >
          <Cpu className="h-4 w-4" />
          <span className="font-medium">
            {currentModel ? currentModel.name : "Select Model"}
          </span>
          {modelState === "ready" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[500px] max-h-[600px] overflow-y-auto p-0" align="start">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <h3 className="font-semibold text-lg">Download AI Model</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a model based on your device capabilities and needs
          </p>
        </div>

        <div className="p-2 space-y-2">
          {models.map((model) => {
            const isActive = model.id === currentModelId;
            const isCurrentlyDownloading = downloadingModel === model.id;
            const isAlreadyCached = cachedModels.has(model.id);

            return (
              <Card
                key={model.id}
                className={`border-2 transition-colors ${
                  isActive ? "border-primary bg-primary/5" : "hover:border-primary/30"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {model.displayName}
                        {isActive && modelState === "ready" && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {!isActive && isAlreadyCached && (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Downloaded
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {model.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Model Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <HardDrive className="h-3 w-3" />
                      <span className="font-medium">{Math.round(model.sizeMB / 10) / 100} GB</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Cpu className="h-3 w-3" />
                      <span className="font-medium">{model.vramMinGB} GB minimum</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span className="font-medium">{model.speed}</span>
                    </div>
                  </div>

                  {/* Recommended For */}
                  <div className="text-xs p-2 rounded bg-muted/50">
                    <span className="font-medium">Best for:</span> {model.recommended}
                  </div>

                  {/* Download Progress */}
                  {isCurrentlyDownloading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{modelState === 'downloading' ? 'Downloading model' : 'Loading cache'}...</span>
                        <span className="font-medium">{Math.round(modelProgress)}%</span>
                      </div>
                      <Progress value={modelProgress} className="h-2" />
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => initiateDownload(model.id)}
                    disabled={isDownloading || (isActive && modelState === "ready")}
                    variant={isActive && modelState === "ready" ? "secondary" : isAlreadyCached && !isActive ? "outline" : "default"}
                  >
                    {isCurrentlyDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {modelState === 'downloading' ? 'Downloading' : 'Loading'} {Math.round(modelProgress)}%
                      </>
                    ) : isActive && modelState === "ready" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Model Ready
                      </>
                    ) : isActive && modelState === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : isAlreadyCached ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Load This Model
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {isActive ? "Download Model" : "Download & Use This Model"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Models are cached permanently after first download. You can switch between downloaded models instantly.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

      {/* Download Confirmation Dialog */}
      {pendingDownload && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Confirm Model Download
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  You're about to download <strong>{pendingDownload.model.displayName}</strong>.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Download Size:</span>
                    <span className="font-semibold">{(pendingDownload.model.sizeMB / 1024).toFixed(2)} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compressed:</span>
                    <span className="font-semibold">~{(pendingDownload.model.sizeMB * 0.7 / 1024).toFixed(2)} GB</span>
                  </div>
                  {storageQuota && (
                    <div className="flex justify-between border-t border-border pt-2 mt-2">
                      <span className="text-muted-foreground">Available Space:</span>
                      <span className="font-semibold">{(storageQuota.available / 1024).toFixed(2)} GB</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    What happens next:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-4">
                    <li>Download starts immediately in the background</li>
                    <li>Model is cached permanently on your device</li>
                    <li>You can close this dialog - download continues</li>
                    <li>Progress shown in top bar</li>
                    <li>Estimated time: 5-15 minutes (depending on connection)</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPendingDownload(null);
                setStorageQuota(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => pendingDownload && handleDownloadModel(pendingDownload.modelId)}
                className="bg-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Start Download
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
