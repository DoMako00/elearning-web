import type { Server } from "node:http";
import { installAdminReadVerifierDiagnosticsIpc } from "./modules/admin";
import { startHttpServerWithApplication } from "./server";

const defaultPort = 3000;
const defaultHost = "0.0.0.0";

function parsePort(value: string | undefined): number | undefined {
  if (!value?.trim()) return defaultPort;
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : undefined;
}

function hasProductionSupabaseRuntime(environment: NodeJS.ProcessEnv): boolean {
  return environment.ADMIN_RUNTIME_MODE?.trim() === "supabase"
    && environment.PERSISTENCE_PROVIDER?.trim() === "supabase"
    && environment.AUTH_PROVIDER?.trim() === "supabase"
    && environment.ADMIN_READ_MODEL_SOURCE?.trim() === "postgres"
    && environment.ADMIN_M2_READ_MODEL_SOURCE?.trim() === "postgres"
    && environment.ADMIN_COMMAND_SOURCE?.trim() === "postgres";
}

function logStartup(host: string, port: number, nodeEnv: string, runtimeMode: "mock" | "supabase"): void {
  console.log(`[api] service=api host=${host} port=${port} runtime=${runtimeMode} node_env=${nodeEnv}`);
  console.log(runtimeMode === "mock" ? "[api] mock-backed HTTP skeleton" : "[api] private Postgres-backed administrative API");
}

function registerGracefulShutdown(server: Server, disposeDiagnostics?: () => void): void {
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    disposeDiagnostics?.();
    console.log("[api] shutdown requested");
    server.close((error) => {
      if (error) {
        console.error("[api] shutdown failed");
        process.exitCode = 1;
        return;
      }
      console.log("[api] shutdown complete");
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/** Explicit runtime entrypoint. It does not run self-tests, providers, or real authentication. */
export function startApiRuntime(): void {
  const port = parsePort(process.env.API_PORT);
  const host = process.env.API_HOST?.trim() || defaultHost;
  const nodeEnv = process.env.NODE_ENV?.trim() || "development";
  const runtimeMode = process.env.ADMIN_RUNTIME_MODE?.trim() || "mock";

  if (port === undefined) {
    console.error("[api] startup aborted: API_PORT must be an integer between 1 and 65535.");
    process.exitCode = 1;
    return;
  }
  if (runtimeMode !== "mock" && runtimeMode !== "supabase") {
    console.error("[api] startup aborted: ADMIN_RUNTIME_MODE must be mock or supabase.");
    process.exitCode = 1;
    return;
  }
  if (nodeEnv === "production" && !hasProductionSupabaseRuntime(process.env)) {
    console.error("[api] startup aborted: production requires the Supabase/Postgres runtime providers.");
    process.exitCode = 1;
    return;
  }

  try {
    const started = startHttpServerWithApplication({ port, host, runtimeMode, serviceName: "api" });
    const diagnostics = started.application?.adminReadVerifierDiagnostics;
    const disposeDiagnostics = diagnostics ? installAdminReadVerifierDiagnosticsIpc(process, diagnostics) : undefined;
    logStartup(host, port, nodeEnv, runtimeMode);
    registerGracefulShutdown(started.server, disposeDiagnostics);
  } catch {
    console.error("[api] startup failed");
    process.exitCode = 1;
  }
}

startApiRuntime();
