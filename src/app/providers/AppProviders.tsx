import type { PropsWithChildren } from "react";
import { AuthProvider } from "./AuthProvider";
import { BrandProvider } from "./BrandProvider";
import { GamificationProvider } from "./GamificationProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <BrandProvider>
          <AuthProvider>
            <GamificationProvider>
              {children}
            </GamificationProvider>
          </AuthProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

