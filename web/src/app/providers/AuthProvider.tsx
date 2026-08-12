import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
}

const initialAuthState: AuthState = {
  status: "unauthenticated",
  user: null,
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  return (
    <AuthContext.Provider value={initialAuthState}>
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
