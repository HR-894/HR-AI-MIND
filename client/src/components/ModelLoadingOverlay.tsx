import { useState, useRef, useEffect } from "react";
import { Download, Sparkles, Minimize2, Maximize2, GripVertical, Pause, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";

interface ModelLoadingOverlayProps {
  progress: number;
  modelName: string;
  isDownloading?: boolean;
  isPaused?: boolean;
}

export function ModelLoadingOverlay({ progress, modelName, isDownloading = false, isPaused = false }: ModelLoadingOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const setModelState = useAppStore((s) => s.setModelState);
  const { toast } = useToast();

  // Initialize position to bottom-right immediately
  const getInitialPosition = () => {
    const padding = 16; // 1rem = 16px
    return {
      x: window.innerWidth - (isMinimized ? 200 : 384) - padding,
      y: window.innerHeight - (isMinimized ? 80 : 400) - padding,
    };
  };

  const [position, setPosition] = useState(getInitialPosition);

  // Update position when minimized state changes
  useEffect(() => {
    const padding = 16;
    setPosition({
      x: window.innerWidth - (isMinimized ? 200 : 384) - padding,
      y: window.innerHeight - (isMinimized ? 80 : 400) - padding,
    });
  }, [isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 200);
      const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 80);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  
  const handlePauseResume = () => {
    if (isPaused) {
      // Resume functionality - note: WebLLM doesn't support pause/resume natively
      // This is a UI placeholder for future implementation
      toast({
        title: "Resume Not Supported",
        description: "Model downloads cannot be paused/resumed yet. Download will continue in background.",
        variant: "default",
      });
    } else {
      // Pause functionality
      toast({
        title: "Pause Not Supported",
        description: "Model downloads run in background and cannot be paused. You can close this overlay and continue using the app.",
        variant: "default",
      });
    }
  };

  const getLoadingMessage = (isDownloading: boolean, isPaused: boolean) => {
    if (isPaused) return "Download paused";
    if (isDownloading) {
      if (progress < 20) return "Starting download...";
      if (progress < 40) return "Downloading model files...";
      if (progress < 60) return "Downloading weights...";
      if (progress < 80) return "Downloading embeddings...";
      return "Download almost complete...";
    } else {
      if (progress < 20) return "Initializing from cache...";
      if (progress < 40) return "Loading model weights...";
      if (progress < 60) return "Loading model layers...";
      if (progress < 80) return "Optimizing for your device...";
      return "Finalizing setup...";
    }
  };

  const getLoadingTip = (isDownloading: boolean) => {
    if (isDownloading) {
      if (progress < 30) return "💡 First download takes a few minutes. Model cached after!";
      if (progress < 60) return "💡 Model files stored permanently for offline use";
      return "💡 Download completes soon!";
    } else {
      if (progress < 30) return "💡 Loading from cache - much faster than download!";
      if (progress < 60) return "💡 Model already cached on your device";
      return "💡 Almost ready to chat!";
    }
  };

  // Minimized floating badge
  if (isMinimized) {
    return (
      <div 
        ref={dragRef}
        className="fixed z-50"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div 
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            if (!isDragging) setIsMinimized(false);
          }}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-105 transition-transform border-2 border-white/20"
        >
          <div className="relative">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeOpacity="0.3"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 - (progress / 100) * 2 * Math.PI * 14}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">{Math.round(progress)}%</div>
            <div className="text-[10px] opacity-90">
              {isPaused ? 'Paused' : isDownloading ? 'Downloading' : 'Loading Cache'}
            </div>
          </div>
          <Maximize2 className="h-4 w-4 opacity-70" />
        </div>
      </div>
    );
  }

  // Full floating card
  return (
    <div 
      ref={dragRef}
      className="fixed z-50"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
      }}
    >
      <div className="w-96 max-w-[calc(100vw-2rem)] bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border-2 border-blue-200/50 dark:border-blue-800/50 overflow-hidden">
        {/* Header with drag handle and minimize button */}
        <div 
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 opacity-70" />
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-sm">{isDownloading ? 'Downloading Model' : 'Loading from Cache'}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-7 w-7 p-0 hover:bg-white/20 text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
        {/* Model Name */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">
            {modelName.replace(/-/g, ' ')}
          </p>
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 - (progress / 100) * 2 * Math.PI * 40}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar with Pause button */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2 flex-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePauseResume}
              className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={isPaused ? "Resume Download" : "Pause Download"}
            >
              {isPaused ? (
                <Play className="h-4 w-4 text-green-600" />
              ) : (
                <Pause className="h-4 w-4 text-orange-600" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{getLoadingMessage(isDownloading, isPaused)}</span>
            {!isPaused && <Download className="h-3 w-3 text-blue-600 animate-bounce" />}
          </div>
        </div>

        {/* Loading Tip */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {getLoadingTip(isDownloading)}
          </p>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{Math.round(progress)}%</div>
            <div className="text-[9px] text-muted-foreground uppercase">Progress</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {progress < 100 ? "..." : "✓"}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase">Status</div>
          </div>
          <div>
            <div className="text-lg font-bold text-pink-600">
              {Math.max(0, Math.round((100 - progress) / 10))}s
            </div>
            <div className="text-[9px] text-muted-foreground uppercase">Est. Time</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
