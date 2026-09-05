import type { AdminModule } from "../http-types";
import type { DatabaseReadinessProbe, HttpJsonResponse, HttpRequestContext, HttpRuntimeStatus } from "../http-types";
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
export async function handleReady(_request: HttpRequestContext, _admin: AdminModule, runtimeStatus?: HttpRuntimeStatus, databaseReadinessProbe?: DatabaseReadinessProbe): Promise<HttpJsonResponse> {
  if (databaseReadinessProbe) {
    try {
      await databaseReadinessProbe();
    } catch {
      return jsonResponse(503, { status: "not_ready", service: "api", checks: { adminModule: "ok", providers: "configured", database: "unreachable", auth: runtimeStatus?.auth ?? "not_configured" }, timestamp: new Date().toISOString() });
    }
  }
  return jsonResponse(200, {
    status: "ready",
    service: "api",
    checks: {
      adminModule: "ok",
      providers: runtimeStatus ? "configured" : "not_configured",
      database: runtimeStatus?.persistence === "supabase" ? (databaseReadinessProbe ? "reachable" : "configured_not_probed") : "not_configured",
      auth: runtimeStatus?.auth ?? "not_configured",
    },
    timestamp: new Date().toISOString(),
  });
}
