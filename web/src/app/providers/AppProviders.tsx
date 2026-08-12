import type { PropsWithChildren } from "react";
import { AuthProvider } from "./AuthProvider";
import { BrandProvider } from "./BrandProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <BrandProvider>
          <AuthProvider>{children}</AuthProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
