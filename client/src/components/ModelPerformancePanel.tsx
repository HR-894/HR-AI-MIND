import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Activity, Clock, Zap, TrendingUp, Database, ThumbsUp } from "lucide-react";
import { db } from "@/lib/db";
import type { Metrics } from "@shared/schema";

interface ModelStats {
  modelId: string;
  modelName: string;
  inferenceCount: number;
  avgSpeed: number;
  avgTimeSeconds: number;
  minTimeSeconds: number;
  maxTimeSeconds: number;
  totalTokens: number;
  lastUsed: number;
  modelSize: string;
  vramMin: string;
}

export function ModelPerformancePanel() {
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const allMetrics = await db.metrics.toArray();
      
      // Group metrics by modelId
      const grouped = allMetrics.reduce((acc, metric) => {
        if (!metric.modelId) return acc;
        
        if (!acc[metric.modelId]) {
          acc[metric.modelId] = [];
        }
        acc[metric.modelId]!.push(metric);
        return acc;
      }, {} as Record<string, Metrics[]>);

      // Calculate stats for each model
      const stats: ModelStats[] = Object.entries(grouped).map(([modelId, metrics]) => {
        const responseTimes = metrics
          .filter(m => m.responseTimeMs)
          .map(m => m.responseTimeMs!);
        
        const tokens = metrics
          .filter(m => m.tokensGenerated)
          .map(m => m.tokensGenerated!);
        
        const avgTimeMs = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;
        
        const totalTokens = tokens.reduce((a, b) => a + b, 0);
        const avgSpeed = avgTimeMs > 0 && totalTokens > 0
          ? (totalTokens / (avgTimeMs / 1000)) / metrics.length
          : 0;

        const minTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
        const maxTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
        
        const lastUsed = Math.max(...metrics.map(m => m.timestamp));

        // Extract model name and determine size/vram
        const modelName = modelId.includes("1B") ? "Llama 3.2 1B" :
                         modelId.includes("3B") ? "Llama 3.2 3B" :
                         modelId.includes("3.1-8B") ? "Llama 3.1 8B" :
                         modelId;
        
        const modelSize = modelId.includes("1B") ? "630 MB" :
                         modelId.includes("3B") ? "1.9 GB" :
                         modelId.includes("3.1-8B") ? "4.8 GB" :
                         "Unknown";
        
        const vramMin = modelId.includes("1B") ? "1.5GB" :
                       modelId.includes("3B") ? "3GB" :
                       modelId.includes("3.1-8B") ? "6GB" :
                       "Unknown";

        return {
          modelId,
          modelName,
          inferenceCount: metrics.length,
          avgSpeed,
          avgTimeSeconds: avgTimeMs / 1000,
          minTimeSeconds: minTime / 1000,
          maxTimeSeconds: maxTime / 1000,
          totalTokens,
          lastUsed,
          modelSize,
          vramMin,
        };
      });

      // Sort by last used (most recent first)
      stats.sort((a, b) => b.lastUsed - a.lastUsed);
      
      setModelStats(stats);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSpeedBadge = (avgSpeed: number) => {
    if (avgSpeed >= 20) return { label: "Very Fast", variant: "default" as const };
    if (avgSpeed >= 10) return { label: "Fast", variant: "secondary" as const };
    if (avgSpeed >= 5) return { label: "Moderate", variant: "outline" as const };
    return { label: "Slow", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-5 w-5 animate-pulse" />
          <span>Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (modelStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Performance Data Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Start chatting with AI models to see performance metrics and comparisons here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Model Performance Comparison
        </h3>
        <p className="text-sm text-muted-foreground">
          Track and compare AI model performance metrics across your usage
        </p>
      </div>

      <div className="grid gap-4">
        {modelStats.map((stats) => {
          const speedBadge = getSpeedBadge(stats.avgSpeed);
          
          return (
            <Card 
              key={stats.modelId}
              className="overflow-hidden border-2 hover:border-primary/50 transition-colors bg-gradient-to-br from-background to-muted/20"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {stats.modelName}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      {stats.modelId}
                    </CardDescription>
                  </div>
                  <Badge variant={speedBadge.variant} className="shrink-0">
                    {speedBadge.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">Size</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{stats.modelSize}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-muted-foreground">Inferences</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600">{stats.inferenceCount}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">Avg Speed</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {stats.avgSpeed.toFixed(1)}
                      <span className="text-xs font-normal ml-1">tok/s</span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg p-3 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-muted-foreground">Avg Time</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      {stats.avgTimeSeconds.toFixed(1)}s
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Response Time Range</span>
                    </div>
                    <p className="font-medium">
                      {stats.minTimeSeconds.toFixed(1)}s - {stats.maxTimeSeconds.toFixed(1)}s
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span>Last Used</span>
                    </div>
                    <p className="font-medium text-xs">
                      {formatDate(stats.lastUsed)}
                    </p>
                  </div>
                </div>

                {/* Performance Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Relative Performance</span>
                    <span>{Math.min(100, (stats.avgSpeed / 20) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (stats.avgSpeed / 20) * 100)} 
                    className="h-2"
                  />
                </div>

                {/* Recommendation */}
                <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Recommended for:</span>{" "}
                    {stats.avgSpeed >= 15 ? "Quick responses • Real-time chat" :
                     stats.avgSpeed >= 8 ? "Balanced usage • General tasks" :
                     "Detailed responses • Complex queries"}
                    {" • "}
                    <span className="font-medium text-foreground">VRAM:</span> {stats.vramMin} minimum
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-2">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Total Models</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {modelStats.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Total Inferences</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {modelStats.reduce((sum, s) => sum + s.inferenceCount, 0)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Fastest Model</p>
            <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {modelStats[0]?.modelName.split(" ").slice(0, 3).join(" ")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Best Speed</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {Math.max(...modelStats.map(s => s.avgSpeed)).toFixed(1)}
              <span className="text-sm ml-1">tok/s</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
