import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface MobileToastProps {
  message: string | null;
}

/**
 * Mobile-specific Toast Notification:
 * - Anchored at the bottom center of the screen (above bottom nav, safe-area aware)
 * - Uses the theme background (#15803d) and emerald glow consistent with brand
 * - Smooth entrance and exit with polite accessibility announcement
 */
export const MobileToast: React.FC<MobileToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-800/95 text-white text-xs font-bold shadow-xl border border-emerald-600/40 backdrop-blur-md max-w-[90vw] animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <CheckCircle2 className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
      <span className="truncate">{message}</span>
    </div>
  );
};
