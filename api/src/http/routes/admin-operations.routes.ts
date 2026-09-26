import type { IncomingMessage } from "node:http";
import type { AdminHttpRequestContextResolver, AdminRequestContext } from "../../core/context";
import { requireAdminPermission } from "../../core/permissions";
import { isPostgresUuid } from "../../core/validation/postgres-uuid";
import { parseStrictBearerToken } from "../strict-bearer";
import type { AdminModule, HttpJsonResponse, HttpRequestContext } from "../http-types";
import { badRequestResponse, conflictResponse, forbiddenResponse, jsonResponse, methodNotAllowedResponse, notFoundResponse, serviceUnavailableResponse, unauthorizedResponse } from "../middleware/json-response";

const MAX_BODY = 32 * 1024;
const IDEMPOTENCY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const validUuid = isPostgresUuid;

export function isAdminOperationsPath(path: string): boolean {
  return path === "/v1/admin/subscription-plans"
    || path === "/v1/admin/subscription-orders"
    || /^\/v1\/admin\/subscription-orders\/[^/]+\/(approve|reject)$/.test(path)
    || path === "/v1/admin/students";
}

async function readBody(request: IncomingMessage, correlationId: string): Promise<Readonly<Record<string, unknown>> | HttpJsonResponse> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for await (const chunk of request) {
      const part = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += part.byteLength;
      if (size > MAX_BODY) return badRequestResponse(correlationId, "The request body is too large.");
      chunks.push(part);
    }
  } catch {
    return badRequestResponse(correlationId, "The request body is invalid.");
  }
  if (!size) return badRequestResponse(correlationId, "A JSON object body is required.");
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Readonly<Record<string, unknown>> : badRequestResponse(correlationId, "A JSON object body is required.");
  } catch {
    return badRequestResponse(correlationId, "The request body must be valid JSON.");
  }
}

function isResponse(value: Readonly<Record<string, unknown>> | HttpJsonResponse): value is HttpJsonResponse {
  return "statusCode" in value;
}

async function resolveAdmin(raw: IncomingMessage, request: HttpRequestContext, resolver: AdminHttpRequestContextResolver | undefined, permission: "admin.platform.admin.read" | "admin.platform.admin.write"): Promise<{ readonly ok: true; readonly context: AdminRequestContext } | { readonly ok: false; readonly response: HttpJsonResponse }> {
  const bearer = parseStrictBearerToken(raw);
  if (!bearer.ok) return { ok: false, response: bearer.code === "missing" ? unauthorizedResponse(request.correlationId) : badRequestResponse(request.correlationId, "The Authorization header is invalid.") };
  if (!resolver) return { ok: false, response: serviceUnavailableResponse(request.correlationId) };
  const resolved = await resolver.resolve({ requestId: request.requestId, correlationId: request.correlationId as never, bearerToken: bearer.token });
  if (!resolved.ok) return { ok: false, response: ["authentication_required", "authentication_invalid"].includes(resolved.error.code) ? unauthorizedResponse(request.correlationId) : resolved.error.code === "permission_denied" ? forbiddenResponse(request.correlationId) : serviceUnavailableResponse(request.correlationId) };
  const allowed = requireAdminPermission(resolved.value, permission);
  return allowed.ok ? { ok: true, context: resolved.value } : { ok: false, response: forbiddenResponse(request.correlationId) };
}

function mapFailure(correlationId: string, failure: { readonly status: number; readonly code: string; readonly message: string }): HttpJsonResponse {
  if (failure.status === 404) return notFoundResponse(correlationId);
  if (failure.status === 409) return conflictResponse(correlationId);
  if (failure.status === 503) return serviceUnavailableResponse(correlationId);
  return badRequestResponse(correlationId, failure.message, { code: failure.code });
}

function requireKey(request: HttpRequestContext): HttpJsonResponse | undefined {
  const key = request.headers["idempotency-key"];
  return typeof key === "string" && IDEMPOTENCY.test(key) ? undefined : badRequestResponse(request.correlationId, "A valid Idempotency-Key header is required.");
}

const str = (data: Readonly<Record<string, unknown>>, key: string): string | undefined => typeof data[key] === "string" ? data[key] as string : undefined;
const num = (data: Readonly<Record<string, unknown>>, key: string): number | undefined => typeof data[key] === "number" ? data[key] as number : undefined;
const arr = (data: Readonly<Record<string, unknown>>, key: string): readonly string[] | undefined => Array.isArray(data[key]) && (data[key] as unknown[]).every((item) => typeof item === "string") ? data[key] as readonly string[] : undefined;

export async function handleAdminOperations(raw: IncomingMessage, request: HttpRequestContext, admin: AdminModule, resolver: AdminHttpRequestContextResolver | undefined): Promise<HttpJsonResponse | undefined> {
  const url = new URL(request.url, "http://localhost");
  const path = url.pathname;
  const operations = admin.commands.operations;
  if (!isAdminOperationsPath(path)) return undefined;
  if (!operations) return serviceUnavailableResponse(request.correlationId);

  if (path === "/v1/admin/subscription-plans") {
    if (request.method !== "GET") return methodNotAllowedResponse(request.correlationId, ["GET"]);
    const auth = await resolveAdmin(raw, request, resolver, "admin.platform.admin.read");
    if (!auth.ok) return auth.response;
    return jsonResponse(200, { ok: true, correlationId: request.correlationId, data: { items: operations.listPlans() } }, { "x-correlation-id": request.correlationId });
  }

  if (path === "/v1/admin/subscription-orders" && request.method === "GET") {
    const auth = await resolveAdmin(raw, request, resolver, "admin.platform.admin.read");
    if (!auth.ok) return auth.response;
    const status = url.searchParams.get("status") ?? undefined;
    if ([...url.searchParams.keys()].some((key) => key !== "status")) return badRequestResponse(request.correlationId, "Unsupported query parameter.");
    const result = await operations.listManualOrders(status as never);
    return result.ok ? jsonResponse(200, { ok: true, correlationId: request.correlationId, data: result.value }, { "x-correlation-id": request.correlationId }) : mapFailure(request.correlationId, result);
  }

  if (request.method !== "POST") return methodNotAllowedResponse(request.correlationId, ["POST"]);
  const auth = await resolveAdmin(raw, request, resolver, "admin.platform.admin.write");
  if (!auth.ok) return auth.response;
  const keyError = requireKey(request);
  if (keyError) return keyError;
  if ([...url.searchParams.keys()].length) return badRequestResponse(request.correlationId, "Query parameters are not supported for this operation.");
  const data = await readBody(raw, request.correlationId);
  if (isResponse(data)) return data;

  if (path === "/v1/admin/students") {
    const result = await operations.createStudent({ adminProfileId: auth.context.adminUser.adminProfileId, correlationId: request.correlationId }, {
      email: str(data, "email") ?? "",
      password: str(data, "password") ?? "",
      fullName: str(data, "fullName") ?? "",
      brandCode: (str(data, "brandCode") ?? "elite") as never,
      academicInstitutionCode: (str(data, "academicInstitutionCode") ?? "buc") as never,
      academicLevelNumber: num(data, "academicLevelNumber") ?? 1,
      academicSemesterNumber: num(data, "academicSemesterNumber") ?? 1,
      ...(str(data, "studentCode") ? { studentCode: str(data, "studentCode") } : {}),
      ...(str(data, "programLabel") ? { programLabel: str(data, "programLabel") } : {}),
      ...(str(data, "expectedGraduationDate") ? { expectedGraduationDate: str(data, "expectedGraduationDate") } : {}),
    });
    return result.ok ? jsonResponse(201, { ok: true, correlationId: request.correlationId, data: result.value }, { "x-correlation-id": request.correlationId }) : mapFailure(request.correlationId, result);
  }

  if (path === "/v1/admin/subscription-orders") {
    const courseIds = arr(data, "courseIds") ?? [];
    if (!courseIds.every(validUuid) || (str(data, "studentProfileId") && !validUuid(str(data, "studentProfileId")))) return badRequestResponse(request.correlationId, "A valid UUID is required.");
    const result = await operations.createManualOrder({ adminProfileId: auth.context.adminUser.adminProfileId, correlationId: request.correlationId }, {
      studentProfileId: str(data, "studentProfileId") ?? "",
      brandCode: (str(data, "brandCode") ?? "elite") as never,
      planCode: (str(data, "planCode") ?? "single_course_manual") as never,
      courseIds,
      ...(num(data, "pricePerStudent") !== undefined ? { pricePerStudent: num(data, "pricePerStudent") } : {}),
      paymentMethod: (str(data, "paymentMethod") ?? "bank_transfer") as never,
      ...(str(data, "paymentReference") ? { paymentReference: str(data, "paymentReference") } : {}),
      ...(str(data, "paymentEvidenceNote") ? { paymentEvidenceNote: str(data, "paymentEvidenceNote") } : {}),
    });
    return result.ok ? jsonResponse(201, { ok: true, correlationId: request.correlationId, data: result.value }, { "x-correlation-id": request.correlationId }) : mapFailure(request.correlationId, result);
  }

  const review = path.match(/^\/v1\/admin\/subscription-orders\/([^/]+)\/(approve|reject)$/);
  if (review) {
    if (!validUuid(review[1])) return badRequestResponse(request.correlationId, "A valid UUID is required.");
    const input = { orderId: review[1], reason: str(data, "reason") ?? "" };
    const result = review[2] === "approve" ? await operations.approveManualOrder({ adminProfileId: auth.context.adminUser.adminProfileId, correlationId: request.correlationId }, input) : await operations.rejectManualOrder({ adminProfileId: auth.context.adminUser.adminProfileId, correlationId: request.correlationId }, input);
    return result.ok ? jsonResponse(200, { ok: true, correlationId: request.correlationId, data: result.value }, { "x-correlation-id": request.correlationId }) : mapFailure(request.correlationId, result);
  }

  return undefined;
}
