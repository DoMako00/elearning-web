declare const process: {
  readonly env: Readonly<Record<string, string | undefined>>;
  exitCode?: number;
  on(signal: "SIGINT" | "SIGTERM", listener: () => void): void;
};
