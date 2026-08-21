import { createServer, type Server } from "node:http";
import { createApplication } from "../app";
import { createHttpApp } from "./http-app";
import type { HttpAppDependencies, HttpRuntimeConfig } from "./http-types";
export const defaultHttpRuntimeConfig: HttpRuntimeConfig = { port: 3000, host: "127.0.0.1", runtimeMode: "mock", serviceName: "api" };
export function startHttpServer(config: HttpRuntimeConfig = defaultHttpRuntimeConfig, dependencies?: HttpAppDependencies): Server {
  const ownedApplication = dependencies ? undefined : createApplication();
  const application = dependencies ?? { admin: ownedApplication!.admin, config };
  const server = createServer(createHttpApp(application));
  if (ownedApplication) server.once("close", () => { void ownedApplication.close(); });
  server.listen(config.port, config.host);
  return server;
}
