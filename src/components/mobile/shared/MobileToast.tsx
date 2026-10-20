import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ToastTone } from "../../../hooks/useToast";

export interface MobileToastProps {
  message: string | null;
  /** Visual and semantic tone; errors are announced assertively. */
  tone?: ToastTone;
}

const TONE_CLASSES: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: "bg-emerald-800/95 border-emerald-600/40", icon: "text-emerald-300" },
  error: { box: "bg-rose-700/95 border-rose-500/40", icon: "text-rose-200" },
  info: { box: "bg-slate-800/95 border-slate-600/40", icon: "text-slate-300" },
};

/**
 * Mobile-specific Toast Notification:
 * - Anchored at the bottom center of the screen (above bottom nav, safe-area aware)
 * - Tone-specific styling: success (emerald), error (rose), info (slate)
 * - Errors use role="alert"; success/info use a polite status announcement
 */
export const MobileToast: React.FC<MobileToastProps> = ({ message, tone = "success" }) => {
  if (!message) return null;
  const Icon = tone === "error" ? AlertCircle : tone === "info" ? Info : CheckCircle2;
  const classes = TONE_CLASSES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-bold shadow-xl border backdrop-blur-md max-w-[90vw] animate-in fade-in slide-in-from-bottom-3 duration-200 ${classes.box}`}
    >
      <Icon className={`size-4 shrink-0 ${classes.icon}`} aria-hidden="true" />
      <span className="line-clamp-3">{message}</span>
    </div>
  );
};
