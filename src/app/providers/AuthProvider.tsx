import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_STORAGE_KEYS,
  clearSupabaseSession,
  isSupabaseAuthConfigured,
  readStoredAuthUserId,
  restoreSupabaseSession,
  type SupabaseAuthenticatedUser,
} from "../../features/auth/api/supabaseAuth";
import { requireApiClient } from "../api/client";
import { resetQueryCache, setQueryCacheScope } from "./QueryProvider";
import { clearAllAssessmentDrafts } from "../../features/student/api/assessmentDrafts";
import { assignLocation, reloadPage } from "../../shared/utils/hardNavigation";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface SignOutOptions {
  /** Best-effort revoke of the backend session before local sign-out. */
  revokeServerSession?: boolean;
  /** Where to send the browser afterwards. Defaults to the sign-in page. */
  redirectTo?: string;
}

export interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  configured: boolean;
  /** Always ends the local session, even offline or when the server session
   * has already expired, then clears all cached data and hard-navigates. */
  signOut(options?: SignOutOptions): Promise<void>;
}

const serverLogoutTimeoutMs = 4_000;
const signInPath = "/auth/sign-in";

function toAuthUser(user: SupabaseAuthenticatedUser): AuthUser {
  return { id: user.id, name: user.email ?? "Authenticated user", role: "authenticated" };
}

async function revokeServerSession(): Promise<void> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), serverLogoutTimeoutMs);
  try {
    const api = await requireApiClient();
    await api.writeJson("POST", "/v1/sessions/logout", {}, { signal: controller.signal });
  } catch {
    // Offline, expired or already revoked: local sign-out still proceeds.
  } finally {
    window.clearTimeout(timeout);
  }
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const configured = isSupabaseAuthConfigured();
  const userIdRef = useRef<string | null>(null);
  const signingOutRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!configured) {
      setStatus("unauthenticated");
      return () => { active = false; };
    }
    void restoreSupabaseSession().then((session) => {
      if (!active) return;
      userIdRef.current = session?.user.id ?? null;
      setQueryCacheScope(userIdRef.current);
      setUser(session ? toAuthUser(session.user) : null);
      setStatus(session ? "authenticated" : "unauthenticated");
    });
    return () => { active = false; };
  }, [configured]);

  // The stored session can change underneath this tab: another tab signs in
  // as a different account, or a refresh token is rejected. Never keep
  // showing the previous account's cached records in either case.
  useEffect(() => {
    if (!configured) return undefined;
    const reconcile = () => {
      if (signingOutRef.current) return;
      const storedUserId = readStoredAuthUserId();
      if (storedUserId === userIdRef.current) return;
      const hadUser = userIdRef.current !== null;
      userIdRef.current = storedUserId;
      setQueryCacheScope(storedUserId);
      void resetQueryCache();
      if (storedUserId === null) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      // Another account took over this browser: reload so no in-memory
      // state from the previous student survives. On the auth pages the
      // sign-in flow itself is writing the new session and will perform its
      // own full navigation, so reloading there would interrupt it.
      if (hadUser && !window.location.pathname.startsWith("/auth/")) {
        reloadPage();
        return;
      }
      void restoreSupabaseSession().then((session) => {
        if (!session || session.user.id !== userIdRef.current) return;
        setUser(toAuthUser(session.user));
        setStatus("authenticated");
      });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || AUTH_SESSION_STORAGE_KEYS.includes(event.key)) reconcile();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, reconcile);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, reconcile);
    };
  }, [configured]);

  const signOut = useCallback(async (options?: SignOutOptions) => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    try {
      if (options?.revokeServerSession) await revokeServerSession();
    } finally {
      clearSupabaseSession();
      clearAllAssessmentDrafts();
      userIdRef.current = null;
      setQueryCacheScope(null);
      await resetQueryCache().catch(() => undefined);
      setUser(null);
      setStatus("unauthenticated");
      assignLocation(options?.redirectTo ?? signInPath);
    }
  }, []);

  const value = useMemo<AuthState>(() => ({
    status,
    user,
    configured,
    signOut,
  }), [configured, signOut, status, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
