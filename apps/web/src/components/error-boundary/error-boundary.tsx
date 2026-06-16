"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

import { Button } from "@/components/ui";

import { createLogger } from "@repo/logger";

const logger = createLogger("error-boundary");

interface ErrorBoundaryFallbackProps {
  error: Error;
  retry: () => void;
  name?: string;
}

export function DefaultErrorFallback({ error, retry, name }: ErrorBoundaryFallbackProps): React.ReactElement {
  if (process.env.NODE_ENV === "development") {
    logger.error({ error: error.message, component: name }, "ErrorBoundary caught error");
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-6" role="alert">
      <p className="text-sm font-medium text-destructive">Something went wrong</p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">{error.message}</p>
      )}
      <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  name?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error({ error: error.message, component: this.props.name, stack: info.componentStack }, "Error boundary caught error");
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return (this.props.fallback as (error: Error, retry: () => void) => ReactNode)(this.state.error, this.handleRetry);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} name={this.props.name} />;
    }
    return this.props.children;
  }
}

export function withErrorBoundary<P extends Record<string, unknown>>(
  Component_: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component_ {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component_.displayName ?? (Component_.name || "Unknown")})`;
  return Wrapped;
}
