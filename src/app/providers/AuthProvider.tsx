import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  beginStudentAccountClaim,
  beginStudentGoogleLogin,
  clearSupabaseSession,
  completeStudentGoogleCallback,
  cancelPendingSupabaseLogin,
  isSupabaseAuthConfigured,
  resendSupabaseEmailOtp,
  requestSupabaseEmailOtp,
  restoreSupabaseSession,
  verifySupabaseEmailOtp,
  type AuthBrand,
  type SupabaseAuthenticatedUser,
} from "../../features/auth/api/supabaseAuth";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  configured: boolean;
  requestEmailOtp(
    email: string,
    brand: AuthBrand,
  ): Promise<{ success: true } | { success: false; message: string }>;
  resendEmailOtp(
    email: string,
    brand: AuthBrand,
  ): Promise<{ success: true } | { success: false; message: string }>;
  cancelPendingLogin(): void;
  verifyEmailOtp(
    input: Readonly<{
      email: string;
      token: string;
      brand: AuthBrand;
      remember: boolean;
    }>,
  ): Promise<{ success: true } | { success: false; message: string }>;
  beginStudentGoogleLogin(brand: AuthBrand, remember?: boolean): Promise<void>;
  beginStudentAccountClaim(input: Readonly<{ brand: AuthBrand; accountIdentifier: string; setupCode: string; remember?: boolean }>): Promise<void>;
  completeStudentGoogleCallback(): Promise<{ success: true } | { success: false; message: string }>;
  signOut(): void;
}

function toAuthUser(user: SupabaseAuthenticatedUser): AuthUser {
  return {
    id: user.id,
    name: user.email ?? "Authenticated user",
    role: "authenticated",
  };
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
      return () => {
        active = false;
      };
    }
    void restoreSupabaseSession().then((session) => {
      if (!active) return;
      setUser(session ? toAuthUser(session.user) : null);
      setStatus(session ? "authenticated" : "unauthenticated");
    });
    return () => {
      active = false;
    };
  }, [configured]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      configured,
      async requestEmailOtp(email, brand) {
        try {
          await requestSupabaseEmailOtp(email, brand);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "A sign-in code could not be sent.",
          };
        }
      },
      async resendEmailOtp(email, brand) {
        try {
          await resendSupabaseEmailOtp(email, brand);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "A new sign-in code could not be sent.",
          };
        }
      },
      cancelPendingLogin() {
        cancelPendingSupabaseLogin();
      },
      async verifyEmailOtp(input) {
        try {
          const authenticated = await verifySupabaseEmailOtp(input);
          setUser(toAuthUser(authenticated));
          setStatus("authenticated");
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Sign in could not be completed.",
          };
        }
      },
      beginStudentGoogleLogin,
      beginStudentAccountClaim,
      async completeStudentGoogleCallback() {
        try {
          const authenticated = await completeStudentGoogleCallback();
          setUser(toAuthUser(authenticated));
          setStatus("authenticated");
          return { success: true };
        } catch (error) {
          return { success: false, message: error instanceof Error ? error.message : "Google sign-in could not be completed." };
        }
      },
      signOut() {
        clearSupabaseSession();
        setUser(null);
        setStatus("unauthenticated");
      },
    }),
    [configured, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
