import type { AdminModule } from "../http-types";
import type { HttpJsonResponse, HttpRequestContext } from "../http-types";
import { jsonResponse } from "../middleware/json-response";
export function handleHealth(_request: HttpRequestContext): HttpJsonResponse { return jsonResponse(200, { status: "ok", service: "api", runtime: "http-skeleton", mode: "mock", timestamp: new Date().toISOString() }); }
export function handleReady(_request: HttpRequestContext, _admin: AdminModule): HttpJsonResponse { return jsonResponse(200, { status: "ready", service: "api", checks: { adminModule: "ok", providers: "not_configured", database: "not_configured", auth: "not_configured" }, timestamp: new Date().toISOString() }); }
