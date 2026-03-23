'use client';

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-6 rounded-lg border border-red-200 bg-red-50 text-center"
        >
          <svg
            className="w-10 h-10 text-red-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-700 font-medium mb-2">
            משהו השתבש
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs text-red-600 underline hover:text-red-800 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A lighter error boundary for card-level components.
 * Shows a minimal placeholder instead of crashing the entire page.
 */
export function CardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-4 rounded-lg border border-gray-200 bg-gray-50 min-h-[100px]">
          <p className="text-sm text-gray-500">לא ניתן להציג את הכרטיס</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
