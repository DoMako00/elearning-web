import React from "react";
import { Loader2 } from "lucide-react";

export const RouteLoadingFallback: React.FC<{ message?: string; isMobile?: boolean }> = ({
  message = "Loading...",
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex-1 w-full flex flex-col items-center justify-center p-6 min-h-[40vh] text-slate-500"
      >
        <Loader2 className="size-6 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex flex-col items-center justify-center py-20 text-slate-500 min-h-[40vh]"
    >
      <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
