import type { PropsWithChildren } from "react";
import { AuthProvider } from "./AuthProvider";
import { BrandProvider } from "./BrandProvider";
import { GamificationProvider } from "./GamificationProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { MessagesProvider } from "./MessagesProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <BrandProvider>
          <AuthProvider>
            <GamificationProvider>
              <MessagesProvider>
                {children}
              </MessagesProvider>
            </GamificationProvider>
          </AuthProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

