import type { IncomingMessage } from "node:http";
import type { AdminPermissionCode } from "../contracts/admin";
import type { AdminHttpRequestContextResolver, AdminRequestContext } from "../core/context";
import { requireAdminPermission } from "../core/permissions";
import { forbiddenResponse, internalErrorResponse, serviceUnavailableResponse, unauthorizedResponse } from "./middleware/json-response";
import { parseStrictBearerToken } from "./strict-bearer";
import type { HttpJsonResponse, HttpRequestContext } from "./http-types";

type BrandTarget = { readonly id: string } | { readonly code: "medway" | "elite" } | undefined;
export type AdminReadAuthorization = { readonly ok: true; readonly context: AdminRequestContext } | { readonly ok: false; readonly response: HttpJsonResponse };

function failure(context: HttpRequestContext, code: string): HttpJsonResponse {
  if (code === "authentication_required" || code === "authentication_invalid") return unauthorizedResponse(context.correlationId);
  if (["provider_unavailable", "query_failed", "query_timeout"].includes(code)) return serviceUnavailableResponse(context.correlationId);
  if (code === "persistence_data_invalid") return internalErrorResponse(context.correlationId);
  return forbiddenResponse(context.correlationId);
}

export async function authorizeAdminRead(input: {
  readonly request: IncomingMessage;
  readonly context: HttpRequestContext;
  readonly resolver: AdminHttpRequestContextResolver | undefined;
  readonly permission: AdminPermissionCode;
  readonly target?: BrandTarget;
}): Promise<AdminReadAuthorization> {
  const bearer = parseStrictBearerToken(input.request);
  if (!bearer.ok) return { ok: false, response: unauthorizedResponse(input.context.correlationId) };
  if (!input.resolver) return { ok: false, response: serviceUnavailableResponse(input.context.correlationId) };
  const trusted = await input.resolver.resolve({ requestId: input.context.requestId, correlationId: input.context.correlationId, bearerToken: bearer.token, ...(input.target && "id" in input.target ? { requestedBrandId: input.target.id } : {}), ...(input.target && "code" in input.target ? { requestedBrandCode: input.target.code } : {}) });
  if (!trusted.ok) return { ok: false, response: failure(input.context, trusted.error.code) };
  if (input.target && "id" in input.target && trusted.value.brand.brandId !== input.target.id) return { ok: false, response: forbiddenResponse(input.context.correlationId) };
  const permission = requireAdminPermission(trusted.value, input.permission);
  if (!permission.ok) return { ok: false, response: forbiddenResponse(input.context.correlationId) };
  return { ok: true, context: trusted.value };
}
