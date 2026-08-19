import type { HttpJsonResponse, HttpRequestContext, AdminModule } from "../http-types";

import { badRequestResponse, jsonResponse } from "../middleware/json-response";
import { safeErrorResponse } from "../middleware/error-response";
import { resolveBrandFromRequestUrl } from "../runtime/brand-resolver";
import { createMockAdminHttpContext } from "../runtime/mock-admin-context";
export async function handleAdminOverview(request: HttpRequestContext, admin: AdminModule): Promise<HttpJsonResponse> { const brand = resolveBrandFromRequestUrl(request.url, request.correlationId); if (!brand.ok) return badRequestResponse(request.correlationId, brand.error.message, { code: brand.error.code }); try { const context = createMockAdminHttpContext({ brandCode: brand.value, correlationId: request.correlationId }); const result = await admin.queries.getAdminOverview(context); if (!result.ok) return badRequestResponse(request.correlationId, result.error.message, { code: result.error.code }); return jsonResponse(200, { ok: true, correlationId: request.correlationId, brand: result.value.brand, data: result.value }, { "x-correlation-id": request.correlationId }); } catch (error) { return safeErrorResponse(request.correlationId, error); } }
