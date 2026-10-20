import { useEffect, useState } from "react";

/**
 * Mobile shell query.
 *
 * - Narrow viewports (max-width: 767px) use the mobile shell.
 * - A touch-first device with a short viewport (a phone rotated to
 *   landscape) also stays in the mobile shell. Without this, rotating a
 *   phone crossed the 767px breakpoint, swapped shells and remounted the
 *   current page, discarding unsaved work.
 */
export const MOBILE_SHELL_QUERY = "(max-width: 767px), (pointer: coarse) and (max-height: 500px)";

function matchesMobileShell(): boolean | undefined {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
  return window.matchMedia(MOBILE_SHELL_QUERY).matches;
}

/**
 * Hook to detect whether the student shell should render the mobile layout.
 *
 * Uses matchMedia rather than window resize listeners. The value is measured
 * synchronously on first render (this is a client-only SPA), so the first
 * paint already uses the right shell; it is `undefined` only when matchMedia
 * is unavailable.
 */
export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(matchesMobileShell);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_SHELL_QUERY);

    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Initial check
    setIsMobile(mql.matches);

    // Subscribe to breakpoint transitions
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    } else {
      // Fallback for older browsers
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, []);

  return isMobile;
}
