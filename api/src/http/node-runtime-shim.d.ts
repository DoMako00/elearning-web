declare const process: {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly argv: readonly string[];
  exitCode?: number;
  on(signal: "SIGINT" | "SIGTERM", listener: () => void): void;
};
