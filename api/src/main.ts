import type { Server } from "node:http";
import { startHttpServer } from "./server";

const defaultPort = 3000;
const defaultHost = "0.0.0.0";

function parsePort(value: string | undefined): number | undefined {
  if (!value?.trim()) return defaultPort;
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : undefined;
}

function logStartup(host: string, port: number, nodeEnv: string): void {
  console.log(`[api] service=api host=${host} port=${port} runtime=mock node_env=${nodeEnv}`);
  console.log("[api] mock-backed HTTP skeleton");
}

function registerGracefulShutdown(server: Server): void {
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
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
  if (runtimeMode !== "mock") {
    console.error("[api] startup aborted: ADMIN_RUNTIME_MODE must be mock for the current runtime.");
    process.exitCode = 1;
    return;
  }

  try {
    const server = startHttpServer({ port, host, runtimeMode: "mock", serviceName: "api" });
    logStartup(host, port, nodeEnv);
    registerGracefulShutdown(server);
  } catch {
    console.error("[api] startup failed");
    process.exitCode = 1;
  }
}

startApiRuntime();
