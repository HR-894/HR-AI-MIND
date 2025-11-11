import { Circle, Loader2, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export type ModelState = "idle" | "loading" | "ready" | "error" | "generating" | "downloading";

interface ModelStatusProps {
  state: ModelState;
  progress?: number;
  className?: string;
}

// Circular progress component
function CircularProgress({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 16; // radius = 16
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-10 h-10 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="url(#gradient)"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export function ModelStatus({ state, progress = 0, className }: ModelStatusProps) {
  const statusConfig: Record<ModelState, {
    icon: any;
    label: string;
    color: string;
    bgColor: string;
    animate?: boolean;
    pulse?: boolean;
  }> = {
    idle: {
      icon: Circle,
      label: "Not loaded",
      color: "text-gray-500",
      bgColor: "bg-gray-400",
    },
    downloading: {
      icon: Download,
      label: progress ? `Downloading ${Math.round(progress)}%` : "Downloading...",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-500",
      animate: true,
    },
    loading: {
      icon: Loader2,
      label: progress ? `Loading ${Math.round(progress)}%` : "Loading model...",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-500",
      animate: true,
    },
    ready: {
      icon: Circle,
      label: "Ready",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500 shadow-lg shadow-emerald-500/50",
    },
    generating: {
      icon: Circle,
      label: "Generating...",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
      pulse: true,
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500",
    },
  };

  const config = statusConfig[state];
  const Icon = config.icon;

  // Show detailed progress during loading/downloading
  if ((state === "loading" || state === "downloading") && progress > 0) {
    return (
      <div className={cn("flex items-center gap-3", className)} data-testid={`status-model-${state}`}>
        <CircularProgress progress={progress} />
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2">
            <Download className="h-3 w-3 text-blue-600 animate-bounce" />
            <span className={cn("text-xs font-semibold", config.color)}>
              {state === "downloading" ? "Downloading Model" : "Loading Model"}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">
            {progress < 30 ? "Downloading..." : progress < 70 ? "Processing..." : "Almost ready..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={`status-model-${state}`}>
      <div className={cn("h-2 w-2 rounded-full", config.bgColor, config.pulse && "animate-pulse")} />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
      {config.animate && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  );
}
