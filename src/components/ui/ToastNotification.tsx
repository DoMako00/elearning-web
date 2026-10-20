import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ToastTone } from "../../hooks/useToast";

interface ToastNotificationProps {
  message: string | null;
  /** Visual and semantic tone; errors are announced assertively. */
  tone?: ToastTone;
  /** Position variant: 'fixed' (default) renders at top-right of viewport; 'absolute' renders relative to closest positioned ancestor */
  position?: "fixed" | "absolute";
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "bg-[#15803d] border-[#20a862]/30 shadow-[0_10px_25px_-5px_rgba(21,128,61,0.4)]",
  error: "bg-rose-700 border-rose-500/40 shadow-[0_10px_25px_-5px_rgba(190,18,60,0.35)]",
  info: "bg-slate-800 border-slate-600/40 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.35)]",
};

/**
 * Unified toast notification component — matches the Assignments & Messages design:
 *  - Tone-specific background (green success, rose error, slate info)
 *  - White bold text with a tone icon
 *  - Slide-in animation from top-right
 *
 * Usage:
 *   const { toastMessage, toastTone, showToast } = useToast();
 *   ...
 *   <ToastNotification message={toastMessage} tone={toastTone} />
 */
export function ToastNotification({
  message,
  tone = "success",
  position = "fixed",
}: ToastNotificationProps) {
  if (!message) return null;

  const positionClass =
    position === "absolute"
      ? "absolute top-4 right-6"
      : "fixed top-6 right-6";
  const Icon = tone === "error" ? AlertCircle : tone === "info" ? Info : CheckCircle2;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`${positionClass} z-10000 flex max-w-[min(28rem,calc(100vw-3rem))] items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-bold border ${TONE_CLASSES[tone]}`}
      style={{
        animation: "toastPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Icon size={16} className="shrink-0" aria-hidden="true" />
      <span>{message}</span>
      <style>{`
        @keyframes toastPop {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
