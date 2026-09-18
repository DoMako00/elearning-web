import { useState, useCallback } from "react";

/**
 * Unified toast notification hook — consistent with Assignments & Messages style.
 * Returns `toastMessage` state and a `showToast(msg)` function.
 * The toast auto-dismisses after `duration` ms (default 3000).
 */
export function useToast(duration = 3000) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), duration);
    },
    [duration]
  );

  return { toastMessage, showToast };
}
