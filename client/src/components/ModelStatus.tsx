import { Circle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModelState = "idle" | "loading" | "ready" | "error" | "generating";

interface ModelStatusProps {
  state: ModelState;
  progress?: number;
  className?: string;
}

export function ModelStatus({ state, progress, className }: ModelStatusProps) {
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
      color: "text-muted-foreground",
      bgColor: "bg-muted-foreground",
    },
    loading: {
      icon: Loader2,
      label: progress ? `Loading ${Math.round(progress)}%` : "Loading model...",
      color: "text-primary",
      bgColor: "bg-primary",
      animate: true,
    },
    ready: {
      icon: Circle,
      label: "Ready",
      color: "text-status-online",
      bgColor: "bg-status-online",
    },
    generating: {
      icon: Circle,
      label: "Generating...",
      color: "text-primary",
      bgColor: "bg-primary",
      pulse: true,
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      color: "text-destructive",
      bgColor: "bg-destructive",
    },
  };

  const config = statusConfig[state];
  const Icon = config.icon;

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
