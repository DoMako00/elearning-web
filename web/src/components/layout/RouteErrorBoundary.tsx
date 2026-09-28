import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isMobile?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[RouteErrorBoundary] Uncaught route load error:", error, errorInfo);
  }

  private handleRetry = () => {
    // If chunk failed to load, reloading or clearing state is standard
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = "Failed to load page",
        fallbackMessage = "A network error or updated deployment prevented this section from loading. Please retry.",
        isMobile = false,
      } = this.props;

      if (isMobile) {
        return (
          <div
            role="alert"
            className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 min-h-[50vh]"
          >
            <div className="size-14 rounded-2xl bg-rose-100/80 text-rose-700 flex items-center justify-center mb-3">
              <AlertCircle className="size-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">{fallbackTitle}</h2>
            <p className="text-xs text-slate-500 max-w-xs mb-5">{fallbackMessage}</p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 shadow-2xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry</span>
            </button>
          </div>
        );
      }

      return (
        <div
          role="alert"
          className="w-full max-w-xl mx-auto my-12 p-8 rounded-2xl border border-rose-200/80 bg-rose-50/50 text-center shadow-xs"
        >
          <div className="size-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">{fallbackTitle}</h2>
          <p className="text-sm text-slate-600 mb-6">{fallbackMessage}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <RefreshCw className="size-4" />
            <span>Reload Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
