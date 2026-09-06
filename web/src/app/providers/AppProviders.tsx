import type { PropsWithChildren } from "react";
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
            </MessagesProvider>
          </AuthProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

