import type { AdminModule } from "../http-types";
import type { HttpJsonResponse, HttpRequestContext, HttpRuntimeStatus } from "../http-types";
import { jsonResponse } from "../middleware/json-response";
export function handleHealth(_request: HttpRequestContext, runtimeStatus?: HttpRuntimeStatus): HttpJsonResponse {
  return jsonResponse(200, {
    status: "ok",
    service: "api",
    runtime: "http-api",
    mode: runtimeStatus?.mode ?? "mock",
    providers: runtimeStatus ? {
      persistence: runtimeStatus.persistence,
      auth: runtimeStatus.auth,
      adminOverviewSource: runtimeStatus.adminOverviewSource,
      adminM2Source: runtimeStatus.adminM2Source,
      adminCommandSource: runtimeStatus.adminCommandSource,
    } : undefined,
    timestamp: new Date().toISOString(),
  });
}
export function handleReady(_request: HttpRequestContext, _admin: AdminModule, runtimeStatus?: HttpRuntimeStatus): HttpJsonResponse {
  return jsonResponse(200, {
    status: "ready",
    service: "api",
    checks: {
      adminModule: "ok",
      providers: runtimeStatus ? "configured" : "not_configured",
      database: runtimeStatus?.persistence === "supabase" ? "configured_not_probed" : "not_configured",
      auth: runtimeStatus?.auth ?? "not_configured",
    },
    timestamp: new Date().toISOString(),
  });
}
