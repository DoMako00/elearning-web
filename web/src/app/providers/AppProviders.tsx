import type { PropsWithChildren } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./AuthProvider";
import { BrandProvider } from "./BrandProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { MessagesProvider } from "./MessagesProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <BrandProvider>
          <AuthProvider>
            <MessagesProvider>
              {children}
              <Toaster
                position="top-right"
                gutter={10}
                toastOptions={{
                  duration: 3500,
                  style: {
                    borderRadius: "12px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontSize: "13.5px",
                    fontWeight: 500,
                    padding: "12px 16px",
                    boxShadow: "0 8px 30px rgba(15,23,42,0.22)",
                    maxWidth: "360px",
                  },
                  success: {
                    iconTheme: { primary: "#20a862", secondary: "#fff" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#fff" },
                  },
                }}
              />
            </MessagesProvider>
          </AuthProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

