import { useEffect, type PropsWithChildren } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = "light";
    root.style.colorScheme = "light";
  }, []);

  return children;
}
