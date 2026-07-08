import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}.`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-destructive w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-display font-bold tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isFirestoreError ? "We encountered a database permission issue." : "The application encountered an unexpected error."}
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-2xl text-left overflow-hidden">
              <p className="text-xs font-mono text-destructive break-words line-clamp-4">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={this.handleReset}
                className="flex-1 gap-2 rounded-xl"
              >
                <RefreshCcw size={18} />
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1 gap-2 rounded-xl"
              >
                <Home size={18} />
                Go Home
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground pt-4">
              If the problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
