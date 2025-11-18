import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { 
  Database, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Download, 
  Lock,
  CheckCircle2,
  AlertCircle,
  Package,
  MessageSquare,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStorageEstimate,
  getCacheStorageInfo,
  clearAllCaches,
  requestPersistentStorage,
  isPersistentStorage,
  formatBytes,
  downloadPWAIcons,
  type StorageEstimate,
  type CacheInfo,
} from "@/lib/storage-utils";
import { db } from "@/lib/db";
import { getModelStorageInfo, getTotalModelStorageMB } from "@/lib/model-utils";

export function StorageManagementPanel() {
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [isPersisted, setIsPersisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [metricsCount, setMetricsCount] = useState(0);
  const [modelStorageInfo, setModelStorageInfo] = useState<{ modelId: string; name: string; sizeMB: number }[]>([]);
  const [totalModelStorageMB, setTotalModelStorageMB] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadStorageInfo();
    loadDatabaseStats();
    loadModelStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setLoading(true);
      const [estimate, caches, persisted] = await Promise.all([
        getStorageEstimate(),
        getCacheStorageInfo(),
        isPersistentStorage(),
      ]);

      setStorageEstimate(estimate);
      setCacheInfo(caches);
      setIsPersisted(persisted);
    } catch (error) {
      console.error("Failed to load storage info:", error);
      toast({
        title: "Error",
        description: "Failed to load storage information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const [chats, messages, metrics] = await Promise.all([
        db.chatSessions.count(),
        db.chatMessages.count(),
        db.metrics.count(),
      ]);

      setChatCount(chats);
      setMessageCount(messages);
      setMetricsCount(metrics);
    } catch (error) {
      console.error("Failed to load database stats:", error);
    }
  };

  const loadModelStorageInfo = async () => {
    try {
      const [models, totalMB] = await Promise.all([
        getModelStorageInfo(),
        getTotalModelStorageMB(),
      ]);

      setModelStorageInfo(models);
      setTotalModelStorageMB(totalMB);
    } catch (error) {
      console.error("Failed to load model storage info:", error);
    }
  };

  const handleClearCache = async () => {
    try {
      setClearing(true);
      const deletedCount = await clearAllCaches();

      toast({
        title: "Cache Cleared",
        description: `Successfully cleared ${deletedCount} cache${deletedCount !== 1 ? 's' : ''}`,
      });

      // Reload storage info
      await loadStorageInfo();
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  };

  const handleRequestPersistentStorage = async () => {
    try {
      const granted = await requestPersistentStorage();

      if (granted) {
        setIsPersisted(true);
        toast({
          title: "Persistent Storage Enabled",
          description: "Your data is now protected from automatic deletion",
        });
      } else {
        toast({
          title: "Request Denied",
          description: "Persistent storage was not granted by the browser",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to request persistent storage:", error);
      toast({
        title: "Error",
        description: "Failed to request persistent storage",
        variant: "destructive",
      });
    }
  };

  const handleDownloadIcons = async () => {
    try {
      await downloadPWAIcons();
      toast({
        title: "Icons Downloaded",
        description: "PWA icons have been downloaded successfully",
      });
    } catch (error) {
      console.error("Failed to download icons:", error);
      toast({
        title: "Error",
        description: "Failed to download PWA icons",
        variant: "destructive",
      });
    }
  };

  const totalCacheSize = cacheInfo.reduce((sum, cache) => sum + cache.size, 0);
  const totalCacheEntries = cacheInfo.reduce((sum, cache) => sum + cache.entries, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading storage information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Storage Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Monitor and manage app storage usage
        </p>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadStorageInfo();
            loadModelStorageInfo();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Total Storage */}
      {storageEstimate && (
        <Card className="border-2 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HardDrive className="h-5 w-5 text-blue-600" />
                Total Storage
              </CardTitle>
              <Badge variant={storageEstimate.usagePercent > 80 ? "destructive" : "secondary"}>
                {storageEstimate.usagePercent.toFixed(1)}% used
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={storageEstimate.usagePercent} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Used</p>
                <p className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {formatBytes(storageEstimate.usage)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Total</p>
                <p className="font-bold text-lg">
                  {storageEstimate.quotaGB.toFixed(2)} GB
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Free</p>
                <p className="font-bold text-lg text-green-600">
                  {storageEstimate.freeGB.toFixed(2)} GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Storage */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-purple-600" />
                Cache Storage
              </CardTitle>
              <CardDescription className="mt-1">
                App files and resources
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              disabled={clearing || cacheInfo.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Cache Size</span>
              <span className="text-xl font-bold text-purple-600">
                {formatBytes(totalCacheSize)}
              </span>
            </div>
          </div>

          {cacheInfo.length > 0 ? (
            <div className="space-y-2">
              {cacheInfo.map((cache) => (
                <div
                  key={cache.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div>
                    <p className="font-medium text-sm">{cache.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cache.entries} entries
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatBytes(cache.size)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No cache data found
            </p>
          )}
        </CardContent>
      </Card>

      {/* IndexedDB */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-green-600" />
            IndexedDB Storage
          </CardTitle>
          <CardDescription>
            AI models, chat history, and performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Models Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">AI Models Storage</p>
                  <p className="text-xs text-muted-foreground">
                    {modelStorageInfo.length} model{modelStorageInfo.length !== 1 ? 's' : ''} downloaded
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {formatBytes(totalModelStorageMB * 1024 * 1024)}
                </Badge>
              </div>
            </div>

            {/* Individual Model Breakdown */}
            {modelStorageInfo.length > 0 && (
              <div className="ml-8 space-y-2 border-l-2 border-blue-500/20 pl-4">
                {modelStorageInfo.map((model) => (
                  <div
                    key={model.modelId}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.modelId}</p>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {formatBytes(model.sizeMB * 1024 * 1024)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {modelStorageInfo.length === 0 && (
              <div className="ml-8 p-3 rounded-lg bg-muted/30 border-l-2 border-blue-500/20">
                <p className="text-sm text-muted-foreground">
                  No AI models downloaded yet. Download a model from Settings → AI section.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Chat History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">Chat History</p>
                  <p className="text-xs text-muted-foreground">
                    {chatCount} session{chatCount !== 1 ? 's' : ''} • {messageCount} message{messageCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{chatCount}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Performance Metrics</p>
                  <p className="text-xs text-muted-foreground">
                    {metricsCount} data point{metricsCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{metricsCount}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Tools */}
      <Card className="border-2 bg-gradient-to-br from-orange-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="text-lg">PWA Tools</CardTitle>
          <CardDescription>
            Progressive Web App utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Persistent Storage */}
          <div className="flex items-start justify-between p-4 rounded-lg border bg-background">
            <div className="flex items-start gap-3 flex-1">
              <Lock className={`h-5 w-5 mt-0.5 ${isPersisted ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">Persistent Storage</p>
                  {isPersisted && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPersisted
                    ? "Your data is protected from automatic deletion"
                    : "Persistent storage prevents browser from clearing data when storage is low."}
                </p>
              </div>
            </div>
            {!isPersisted && (
              <Button
                size="sm"
                onClick={handleRequestPersistentStorage}
                className="ml-4 shrink-0"
              >
                Request
              </Button>
            )}
          </div>

          {/* PWA Icons */}
          <div className="flex items-start justify-between p-4 rounded-lg border bg-background">
            <div className="flex items-start gap-3 flex-1">
              <Download className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium mb-1">Generate & Download PWA Icons</p>
                <p className="text-sm text-muted-foreground">
                  PWA icons are needed for proper app installation on mobile devices.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadIcons}
              className="ml-4 shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Cache Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Clear All Cache?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will clear all cached files and resources ({formatBytes(totalCacheSize)} - {totalCacheEntries} entries).
              </p>
              <p className="font-medium text-foreground">
                ⚠️ Your chat history, AI models, and settings will NOT be affected.
              </p>
              <p>
                The app will need to re-download resources on next use.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCache}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
