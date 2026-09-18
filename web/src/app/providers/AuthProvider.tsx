import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { clearSupabaseSession, isSupabaseAuthConfigured, restoreSupabaseSession, signInWithSupabasePassword, type SupabaseAuthenticatedUser } from "../../features/auth/api/supabaseAuth";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  configured: boolean;
  signInWithPassword(input: Readonly<{ email: string; password: string; remember: boolean }>): Promise<{ success: true } | { success: false; message: string }>;
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
    async signInWithPassword(input) {
      try {
        const authenticated = await signInWithSupabasePassword(input);
        setUser(toAuthUser(authenticated));
        setStatus("authenticated");
        return { success: true };
      } catch (error) {
        setUser(null);
        setStatus("unauthenticated");
        return { success: false, message: error instanceof Error ? error.message : "Sign in could not be completed." };
      }
    },
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
