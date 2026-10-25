import "@mantine/core/styles.css";
import { createTheme, MantineProvider, type MantineProviderProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

const green = [
  "#eff7f1",
  "#dceee1",
  "#c3e1cc",
  "#a2cfb0",
  "#79b98f",
  "#4a9f68",
  "#18834b",
  "#126f3c",
  "#0e5d32",
  "#0b4928",
] as const;

const theme = createTheme({
  primaryColor: "green",
  colors: { green },
  fontFamily: "var(--font-body, Montserrat, sans-serif)",
  headings: { fontFamily: "var(--font-body, Montserrat, sans-serif)" },
  defaultRadius: "md",
  components: {
    Button: { defaultProps: { size: "sm", radius: "md" } },
    Card: { defaultProps: { radius: "lg" } },
    Paper: { defaultProps: { radius: "lg" } },
  },
});

type ScopedProviderProps = PropsWithChildren<Pick<MantineProviderProps, "env">>;

export function AdminV2UiProvider({ children, env }: ScopedProviderProps) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesSelector=".admin-v2"
      defaultColorScheme="light"
      forceColorScheme="light"
      withGlobalClasses={false}
      env={env}
    >
      {children}
    </MantineProvider>
  );
}
