import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { RouteLoadingFallback } from "../../components/layout/RouteLoadingFallback";
import { useIsMobile } from "../../hooks/useIsMobile";

/** Student workspace routes render only for an authenticated session, so no
 * student query is issued (desktop or mobile) without a valid token. */
export function RequireStudentAuth({ children }: PropsWithChildren) {
  const auth = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (auth.status === "loading") {
    return <RouteLoadingFallback isMobile={isMobile} message="Checking your session…" />;
  }
  if (auth.status !== "authenticated") {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/auth/sign-in" replace state={{ from }} />;
  }
  return <>{children}</>;
}
