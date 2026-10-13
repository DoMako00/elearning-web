import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { clearSupabaseSession, isSupabaseAuthConfigured, restoreSupabaseSession, type SupabaseAuthenticatedUser } from "../../features/auth/api/supabaseAuth";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  configured: boolean;
  signOut(): void;
}

function toAuthUser(user: SupabaseAuthenticatedUser): AuthUser {
  return { id: user.id, name: user.email ?? "Authenticated user", role: "authenticated" };
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const configured = isSupabaseAuthConfigured();

  useEffect(() => {
    let active = true;
    if (!configured) {
      setStatus("unauthenticated");
      return () => { active = false; };
    }
    void restoreSupabaseSession().then((session) => {
      if (!active) return;
      setUser(session ? toAuthUser(session.user) : null);
      setStatus(session ? "authenticated" : "unauthenticated");
    });
    return () => { active = false; };
  }, [configured]);

  const value = useMemo<AuthState>(() => ({
    status,
    user,
    configured,
    signOut() {
      clearSupabaseSession();
      setUser(null);
      setStatus("unauthenticated");
    },
  }), [configured, status, user]);

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
