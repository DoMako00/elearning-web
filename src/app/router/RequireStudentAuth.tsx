import { useEffect, useState, type PropsWithChildren } from "react";
import { getAdminWorkspace } from "../../features/admin-v2/api/adminRolesApi";
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
    return <RouteLoadingFallback isMobile={isMobile} withShell message="Checking your session…" />;
  }
  if (auth.status !== "authenticated") {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/auth/sign-in" replace state={{ from }} />;
  }
  if (location.pathname === "/") return <RootWorkspaceRedirect key={auth.user?.id} isMobile={Boolean(isMobile)}>{children}</RootWorkspaceRedirect>;
  return <>{children}</>;
}

function RootWorkspaceRedirect({ children, isMobile }: PropsWithChildren<{ isMobile: boolean }>) {
  const [destination, setDestination] = useState<"loading" | "student" | "instructor" | "admin" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setDestination("loading");
    void getAdminWorkspace(controller.signal).then(workspace => {
      if (!controller.signal.aborted) setDestination(workspace.workspace === "instructor" ? "instructor" : "admin");
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = (error as { status?: number })?.status;
      setDestination(status === 403 || status === 404 ? "student" : "error");
    });
    return () => controller.abort();
  }, [attempt]);
  if (destination === "loading") return <RouteLoadingFallback isMobile={isMobile} withShell message="Opening your workspace..." />;
  if (destination === "instructor") return <Navigate to="/admin/instructor" replace />;
  if (destination === "admin") return <Navigate to="/admin" replace />;
  if (destination === "error") return <main role="alert"><p>We couldn't determine your workspace. Please try again.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></main>;
  return <>{children}</>;
}
