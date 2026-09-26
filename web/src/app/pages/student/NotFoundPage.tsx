import { useIsMobile } from "../../../hooks/useIsMobile";
import { NotFound } from "../../../components/NotFound";
import { MobileNotFoundScreen } from "../../../components/mobile/screens/MobileNotFoundScreen";

/**
 * Wildcard 404 — branches on viewport exactly like every other route.
 * Mobile → MobileNotFoundScreen (BottomNav included, no TopAppBar)
 * Desktop/iPad → NotFound (full-viewport centered, Framer Motion float)
 */
export function NotFoundPage() {
  const isMobile = useIsMobile();

  // Prevent flash while measuring initial viewport
  if (isMobile === undefined) return null;

  return isMobile ? <MobileNotFoundScreen /> : <NotFound />;
}
