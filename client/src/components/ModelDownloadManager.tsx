import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Cpu, HardDrive, Zap, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { workerClient } from "@/lib/worker-client";
import { useToast } from "@/hooks/use-toast";

import { useModels } from "@/lib/models";

interface ModelDownloadManagerProps {
  currentModelId: string;
  onModelChange: (modelId: string) => void;
  modelState: string;
  onDownloadProgress?: (progress: number) => void;
  onDownloadStateChange?: (state: "idle" | "downloading" | "complete" | "error") => void;
}

export function ModelDownloadManager({ 
  currentModelId, 
  onModelChange, 
  modelState,
  onDownloadProgress,
  onDownloadStateChange
}: ModelDownloadManagerProps) {
  const { models } = useModels("json");
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { toast } = useToast();

  const handleDownloadModel = async (modelId: string) => {
    try {
      setDownloadingModel(modelId);
      setDownloadProgress(0);
      onDownloadStateChange?.("downloading");

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
          className="gap-2 border-2 hover:border-primary/50"
          disabled={isDownloading}
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
                        <span className="text-muted-foreground">Downloading...</span>
                        <span className="font-medium">{Math.round(downloadProgress)}%</span>
                      </div>
                      <Progress value={downloadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownloadModel(model.id)}
                    disabled={isDownloading || (isActive && modelState === "ready")}
                    variant={isActive && modelState === "ready" ? "secondary" : "default"}
                  >
                    {isCurrentlyDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading {Math.round(downloadProgress)}%
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
                    ) : isActive ? (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Model
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download & Use This Model
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
  );
}
