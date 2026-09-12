import { createServer, type Server } from "node:http";
import { createApplication } from "../app";
import type { BackendApplication } from "../app";
import { createHttpApp } from "./http-app";
import type { HttpAppDependencies, HttpRuntimeConfig } from "./http-types";
export const defaultHttpRuntimeConfig: HttpRuntimeConfig = { port: 3000, host: "127.0.0.1", runtimeMode: "mock", serviceName: "api" };
export interface StartedHttpServer { readonly server: Server; readonly application?: BackendApplication; }
export function startHttpServerWithApplication(config: HttpRuntimeConfig = defaultHttpRuntimeConfig, dependencies?: HttpAppDependencies): StartedHttpServer {
  const ownedApplication = dependencies ? undefined : createApplication();
  const application = dependencies ?? {
    admin: ownedApplication!.admin,
    adminHttpContextResolver: ownedApplication!.adminHttpContextResolver,
    config,
    runtimeStatus: {
      mode: config.runtimeMode,
      persistence: ownedApplication!.persistence.provider,
      auth: process.env.AUTH_PROVIDER?.trim() === "supabase" ? "supabase" : "mock",
      adminOverviewSource: ownedApplication!.adminOverviewSource,
      adminM2Source: ownedApplication!.adminM2Source,
      adminCommandSource: ownedApplication!.adminCommandSource,
    },
    ...(ownedApplication!.persistence.readTransport ? {
      databaseReadinessProbe: async () => {
        await ownedApplication!.persistence.readTransport!.query({ label: "database_readiness", text: "SELECT 1 AS ready", values: [] });
      },
    } : {}),
  };
  const server = createServer(createHttpApp(application));
  if (ownedApplication) server.once("close", () => { void ownedApplication.close(); });
  server.listen(config.port, config.host);
  return { server, application: ownedApplication };
}
export function startHttpServer(config: HttpRuntimeConfig = defaultHttpRuntimeConfig, dependencies?: HttpAppDependencies): Server { return startHttpServerWithApplication(config, dependencies).server; }
