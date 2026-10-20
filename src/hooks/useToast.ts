import { useState, useCallback, useEffect, useRef } from "react";

export type ToastTone = "success" | "error" | "info";

/**
 * Unified toast notification hook — consistent with Assignments & Messages style.
 * Returns `toastMessage`/`toastTone` state and a `showToast(msg, tone)` function.
 * Success and info toasts auto-dismiss after `duration` ms (default 3000);
 * error toasts stay at least 6 seconds so they can be read.
 */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback(
    (msg: string, tone: ToastTone = "success") => {
      window.clearTimeout(timerRef.current);
      setToast({ message: msg, tone });
      timerRef.current = window.setTimeout(() => setToast(null), tone === "error" ? Math.max(duration, 6000) : duration);
    },
    [duration]
  );

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { toastMessage: toast?.message ?? null, toastTone: toast?.tone ?? "success", showToast };
}
