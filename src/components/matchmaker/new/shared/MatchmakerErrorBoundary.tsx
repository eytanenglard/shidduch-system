"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MatchmakerErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface MatchmakerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class MatchmakerErrorBoundary extends Component<
  MatchmakerErrorBoundaryProps,
  MatchmakerErrorBoundaryState
> {
  constructor(props: MatchmakerErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MatchmakerErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[MatchmakerErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === "development";

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              אירעה שגיאה
            </h3>
            <p className="text-sm text-muted-foreground">
              משהו השתבש בטעינת הרכיב. נסה לרענן את הדף.
            </p>
          </div>

          <Button variant="outline" onClick={this.handleRetry}>
            נסה שנית
          </Button>

          {isDev && this.state.error && (
            <div className="w-full max-w-lg">
              <button
                type="button"
                onClick={this.toggleDetails}
                className={cn(
                  "flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                )}
              >
                פרטי שגיאה
                {this.state.showDetails ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {this.state.showDetails && (
                <pre
                  className={cn(
                    "mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-start text-xs text-muted-foreground"
                  )}
                  dir="ltr"
                >
                  <strong>{this.state.error.name}:</strong>{" "}
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {"\n\n"}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default MatchmakerErrorBoundary;
