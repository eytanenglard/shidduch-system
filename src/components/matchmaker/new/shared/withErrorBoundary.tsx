"use client";

import React, { type ComponentType, type ErrorInfo } from "react";
import MatchmakerErrorBoundary from "./MatchmakerErrorBoundary";

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: WithErrorBoundaryOptions
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary = (props: P) => (
    <MatchmakerErrorBoundary
      fallback={options?.fallback}
      onError={options?.onError}
    >
      <WrappedComponent {...props} />
    </MatchmakerErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default withErrorBoundary;
