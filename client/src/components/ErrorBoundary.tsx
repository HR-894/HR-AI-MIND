import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { resetSettings } from "@/lib/settings";
import { clearAllData } from "@/lib/db";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error. Please reload the page to continue.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.errorInfo}
                </pre>
              </details>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
                data-testid="button-reload"
              >
                Reload Application
              </Button>
              <Button
                onClick={async () => {
                  try {
                    resetSettings();
                    await clearAllData();
                    this.setState({
                      ...this.state,
                      errorInfo: (this.state.errorInfo || "") + "\nApp state cleared.",
                    });
                  } catch (e: any) {
                    this.setState({
                      ...this.state,
                      errorInfo: (this.state.errorInfo || "") + "\nReset failed: " + (e?.message || e?.toString?.() || "unknown"),
                    });
                  }
                }}
                className="w-full"
                data-testid="button-reset-app-state"
              >
                Reset App State
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">After reset, you can reload the page.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
