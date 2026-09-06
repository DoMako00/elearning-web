import { CheckCircle2 } from "lucide-react";

interface ToastNotificationProps {
  message: string | null;
  /** Position variant: 'fixed' (default) renders at top-right of viewport; 'absolute' renders relative to closest positioned ancestor */
  position?: "fixed" | "absolute";
}

/**
 * Unified toast notification component — matches the Assignments & Messages design:
 *  - Dark green background (#15803d)
 *  - White bold text with CheckCircle2 icon
 *  - Slide-in animation from top-right
 *
 * Usage:
 *   const { toastMessage, showToast } = useToast();
 *   ...
 *   <ToastNotification message={toastMessage} />
 */
export function ToastNotification({
  message,
  position = "fixed",
}: ToastNotificationProps) {
  if (!message) return null;

  const positionClass =
    position === "absolute"
      ? "absolute top-4 right-6"
      : "fixed top-6 right-6";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${positionClass} z-[10000] flex items-center gap-2 px-4 py-3 rounded-xl bg-[#15803d] text-white text-sm font-bold shadow-[0_10px_25px_-5px_rgba(21,128,61,0.4)] border border-[#20a862]/30`}
      style={{
        animation: "toastPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <CheckCircle2 size={16} aria-hidden="true" />
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
