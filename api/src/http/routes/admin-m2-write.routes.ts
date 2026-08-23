import type { IncomingMessage } from "node:http";
import type { AdminPermissionCode, AdminSensitiveCommandMetadata } from "../../contracts/admin";
import type { AdminHttpRequestContextResolver, AdminRequestContext } from "../../core/context";
import type { AdminCoreError } from "../../core/errors";
import { requireAdminPermission } from "../../core/permissions";
import type { AdminM2CommandExecutor } from "../../modules/admin/commands";
import type { AdminModule } from "../http-types";
import type { HttpJsonResponse, HttpRequestContext } from "../http-types";
import { badRequestResponse, conflictResponse, forbiddenResponse, internalErrorResponse, jsonResponse, methodNotAllowedResponse, notFoundResponse, serviceUnavailableResponse, unauthorizedResponse } from "../middleware/json-response";

const MAX_BODY_BYTES = 32 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/;

type WriteRoute =
  | { readonly method: "POST"; readonly name: "createInstructor"; readonly permission: "admin.instructors.create"; readonly fields: readonly string[]; readonly create: true }
  | { readonly method: "PATCH"; readonly name: "updateInstructor"; readonly permission: "admin.instructors.update"; readonly fields: readonly string[] }
  | { readonly method: "PATCH"; readonly name: "setInstructorStatus"; readonly permission: "admin.instructors.update"; readonly fields: readonly string[] }
  | { readonly method: "POST"; readonly name: "assignInstructorToBrand"; readonly permission: "admin.brand_instructors.assign"; readonly fields: readonly string[] }
  | { readonly method: "PATCH"; readonly name: "setBrandInstructorStatus"; readonly permission: "admin.brand_instructors.update"; readonly fields: readonly string[] }
  | { readonly method: "POST"; readonly name: "createBrandCourse"; readonly permission: "admin.brand_courses.create"; readonly fields: readonly string[]; readonly create: true }
  | { readonly method: "PATCH"; readonly name: "updateBrandCourse"; readonly permission: "admin.brand_courses.update"; readonly fields: readonly string[] }
  | { readonly method: "PATCH"; readonly name: "setBrandCourseStatus"; readonly permission: "admin.brand_courses.update"; readonly fields: readonly string[] }
  | { readonly method: "POST"; readonly name: "assignInstructorToCourse"; readonly permission: "admin.course_instructors.assign"; readonly fields: readonly string[] }
  | { readonly method: "PATCH"; readonly name: "setCourseInstructorStatus"; readonly permission: "admin.course_instructors.update"; readonly fields: readonly string[] };

interface Match { readonly route: WriteRoute; readonly brandId: string; readonly instructorId?: string; readonly courseId?: string; }
const routes: readonly [RegExp, WriteRoute][] = [
  [/^\/v1\/admin\/brands\/([^/]+)\/instructors\/global$/, { method: "POST", name: "createInstructor", permission: "admin.instructors.create", fields: ["displayName", "professionalTitle", "reason"], create: true }],
  [/^\/v1\/admin\/brands\/([^/]+)\/instructors\/global\/([^/]+)$/, { method: "PATCH", name: "updateInstructor", permission: "admin.instructors.update", fields: ["displayName", "professionalTitle", "reason", "expectedVersion"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/instructors\/global\/([^/]+)\/status$/, { method: "PATCH", name: "setInstructorStatus", permission: "admin.instructors.update", fields: ["status", "reason", "expectedVersion"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/instructors$/, { method: "POST", name: "assignInstructorToBrand", permission: "admin.brand_instructors.assign", fields: ["instructorId", "reason"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/instructors\/([^/]+)\/status$/, { method: "PATCH", name: "setBrandInstructorStatus", permission: "admin.brand_instructors.update", fields: ["status", "reason", "expectedVersion"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/courses$/, { method: "POST", name: "createBrandCourse", permission: "admin.brand_courses.create", fields: ["courseCode", "title", "scope", "academicModuleId", "reason"], create: true }],
  [/^\/v1\/admin\/brands\/([^/]+)\/courses\/([^/]+)$/, { method: "PATCH", name: "updateBrandCourse", permission: "admin.brand_courses.update", fields: ["title", "scope", "academicModuleId", "reason", "expectedVersion"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/courses\/([^/]+)\/status$/, { method: "PATCH", name: "setBrandCourseStatus", permission: "admin.brand_courses.update", fields: ["status", "reason", "expectedVersion"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/courses\/([^/]+)\/instructors$/, { method: "POST", name: "assignInstructorToCourse", permission: "admin.course_instructors.assign", fields: ["instructorId", "reason"] }],
  [/^\/v1\/admin\/brands\/([^/]+)\/courses\/([^/]+)\/instructors\/([^/]+)\/status$/, { method: "PATCH", name: "setCourseInstructorStatus", permission: "admin.course_instructors.update", fields: ["status", "reason", "expectedVersion"] }],
];

function match(path: string): Match | undefined {
  for (const [pattern, route] of routes) {
    const values = pattern.exec(path);
    if (!values) continue;
    if (route.name === "assignInstructorToCourse" || route.name === "setCourseInstructorStatus") return { route, brandId: values[1]!, courseId: values[2]!, ...(values[3] ? { instructorId: values[3] } : {}) };
    if (route.name === "updateInstructor" || route.name === "setInstructorStatus" || route.name === "setBrandInstructorStatus") return { route, brandId: values[1]!, instructorId: values[2]! };
    if (route.name === "updateBrandCourse" || route.name === "setBrandCourseStatus") return { route, brandId: values[1]!, courseId: values[2]! };
    return { route, brandId: values[1]! };
  }
  return undefined;
}

export function isAdminM2WritePath(path: string): boolean { return Boolean(match(path)); }

async function readObjectBody(request: IncomingMessage, correlationId: string): Promise<Readonly<Record<string, unknown>> | HttpJsonResponse> {
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for await (const chunk of request) {
      const value = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) return badRequestResponse(correlationId, "The request body is too large.");
      chunks.push(value);
    }
  } catch { return badRequestResponse(correlationId, "The request body is invalid."); }
  if (size === 0) return badRequestResponse(correlationId, "A JSON object body is required.");
  let value: unknown;
  try { value = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return badRequestResponse(correlationId, "The request body must be valid JSON."); }
  if (!value || Array.isArray(value) || typeof value !== "object") return badRequestResponse(correlationId, "A JSON object body is required.");
  return value as Readonly<Record<string, unknown>>;
}

function bearer(headers: HttpRequestContext["headers"]): string | undefined {
  const value = headers.authorization;
  const match = typeof value === "string" ? /^Bearer ([A-Za-z0-9._~+\/=:-]+)$/.exec(value) : undefined;
  return match?.[1];
}
function idempotency(headers: HttpRequestContext["headers"]): string | undefined {
  const value = headers["idempotency-key"];
  return typeof value === "string" && IDEMPOTENCY.test(value) ? value : undefined;
}
function badBody(body: Readonly<Record<string, unknown>>, allowed: readonly string[], correlationId: string): HttpJsonResponse | undefined {
  if (Object.keys(body).some((key) => !allowed.includes(key))) return badRequestResponse(correlationId, "The request body contains an unsupported field.");
  if (typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 500) return badRequestResponse(correlationId, "A valid reason is required.");
  if (body.expectedVersion !== undefined && (typeof body.expectedVersion !== "string" || !body.expectedVersion.trim())) return badRequestResponse(correlationId, "The expected version is invalid.");
  return undefined;
}
function validId(value: string | undefined): boolean { return typeof value === "string" && UUID.test(value); }
function isHttpResponse(value: Readonly<Record<string, unknown>> | HttpJsonResponse): value is HttpJsonResponse { return "statusCode" in value && typeof value.statusCode === "number"; }
function metadata(context: AdminRequestContext, reason: string, idempotencyKey: string, expectedVersion: unknown): AdminSensitiveCommandMetadata {
  return { platform: context.platform, correlationId: context.correlationId, reason, idempotencyKey, ...(typeof expectedVersion === "string" ? { expectedVersion } : {}) };
}
function mapError(error: AdminCoreError): HttpJsonResponse {
  const correlationId = error.correlationId;
  if (error.code === "unauthenticated") return unauthorizedResponse(correlationId);
  if (["permission_denied", "admin_user_missing_or_inactive", "platform_required", "platform_mismatch", "brand_mismatch", "target_brand_mismatch", "target_platform_mismatch"].includes(error.code)) return forbiddenResponse(correlationId);
  if (error.code === "target_not_found") return notFoundResponse(correlationId);
  if (["conflict", "idempotency_key_reused"].includes(error.code)) return conflictResponse(correlationId);
  if (error.code === "persistence_failed") return serviceUnavailableResponse(correlationId);
  if (["validation_failed", "reason_required", "idempotency_key_required", "policy_validation_failed", "lifecycle_transition_denied", "unsupported_scope"].includes(error.code)) return badRequestResponse(correlationId, "The administrative command is invalid.");
  return internalErrorResponse(correlationId);
}
function success(result: { readonly data: object; readonly correlationId: string; readonly mutated: boolean; readonly replayed: boolean; readonly adminActionId?: string; readonly auditLogId?: string }, created: boolean): HttpJsonResponse {
  return jsonResponse(created && result.mutated && !result.replayed ? 201 : 200, { ok: true, correlationId: result.correlationId, data: result.data as Record<string, unknown>, mutated: result.mutated, replayed: result.replayed, ...(result.adminActionId ? { adminActionId: result.adminActionId } : {}), ...(result.auditLogId ? { auditLogId: result.auditLogId } : {}) }, { "x-correlation-id": result.correlationId });
}

function invoke(executor: AdminM2CommandExecutor, route: WriteRoute, context: AdminRequestContext, input: Match, body: Readonly<Record<string, unknown>>, data: AdminSensitiveCommandMetadata): ReturnType<AdminM2CommandExecutor[keyof AdminM2CommandExecutor]> {
  const brandId = context.brand.brandId;
  switch (route.name) {
    case "createInstructor": return executor.createInstructor(context, { metadata: data, displayName: body.displayName as string, ...(body.professionalTitle !== undefined ? { professionalTitle: body.professionalTitle as string | null } : {}) });
    case "updateInstructor": return executor.updateInstructor(context, { metadata: data, instructorId: input.instructorId!, ...(body.displayName !== undefined ? { displayName: body.displayName as string } : {}), ...(body.professionalTitle !== undefined ? { professionalTitle: body.professionalTitle as string | null } : {}) });
    case "setInstructorStatus": return executor.setInstructorStatus(context, { metadata: data, instructorId: input.instructorId!, status: body.status as "active" | "inactive" });
    case "assignInstructorToBrand": return executor.assignInstructorToBrand(context, { metadata: data, brandId, instructorId: body.instructorId as string });
    case "setBrandInstructorStatus": return executor.setBrandInstructorStatus(context, { metadata: data, brandId, instructorId: input.instructorId!, status: body.status as "active" | "inactive" });
    case "createBrandCourse": return executor.createBrandCourse(context, { metadata: data, brandId, courseCode: body.courseCode as string, title: body.title as string, courseScope: body.scope as "curriculum" | "standalone", academicModuleId: body.academicModuleId as string | null, status: "draft" });
    case "updateBrandCourse": return executor.updateBrandCourse(context, { metadata: data, brandId, courseId: input.courseId!, ...(body.title !== undefined ? { title: body.title as string } : {}), ...(body.scope !== undefined ? { courseScope: body.scope as "curriculum" | "standalone" } : {}), ...(body.academicModuleId !== undefined ? { academicModuleId: body.academicModuleId as string | null } : {}) });
    case "setBrandCourseStatus": return executor.setBrandCourseStatus(context, { metadata: data, brandId, courseId: input.courseId!, status: body.status as "draft" | "published" | "archived" });
    case "assignInstructorToCourse": return executor.assignInstructorToCourse(context, { metadata: data, brandId, courseId: input.courseId!, instructorId: body.instructorId as string });
    case "setCourseInstructorStatus": return executor.setCourseInstructorStatus(context, { metadata: data, brandId, courseId: input.courseId!, instructorId: input.instructorId!, status: body.status as "active" | "inactive" });
  }
}

/** Thin transport adapter only. Executor owns state, SQL, transactions and evidence. */
export async function handleAdminM2Write(request: IncomingMessage, context: HttpRequestContext, admin: AdminModule, resolver: AdminHttpRequestContextResolver | undefined): Promise<HttpJsonResponse | undefined> {
  const parsed = new URL(context.url, "http://localhost"); const input = match(parsed.pathname);
  if (!input) return undefined;
  if (context.method !== input.route.method) return methodNotAllowedResponse(context.correlationId, [input.route.method]);
  if ([...parsed.searchParams.keys()].length > 0) return badRequestResponse(context.correlationId, "Query parameters are not supported for this operation.");
  if (!validId(input.brandId) || (input.instructorId !== undefined && !validId(input.instructorId)) || (input.courseId !== undefined && !validId(input.courseId))) return badRequestResponse(context.correlationId, "A route identifier is invalid.");
  if (Array.isArray(request.headers.authorization) || Array.isArray(request.headers["idempotency-key"])) return badRequestResponse(context.correlationId, "Duplicate security headers are not supported.");
  const token = bearer(context.headers); if (!token) return unauthorizedResponse(context.correlationId);
  const parsedBody = await readObjectBody(request, context.correlationId); if (isHttpResponse(parsedBody)) return parsedBody;
  const invalid = badBody(parsedBody, input.route.fields, context.correlationId); if (invalid) return invalid;
  const key = idempotency(context.headers); if (!key) return badRequestResponse(context.correlationId, "A valid Idempotency-Key header is required.");
  if (!resolver) return serviceUnavailableResponse(context.correlationId);
  const resolved = await resolver.resolve({ requestId: context.requestId, correlationId: context.correlationId as never, bearerToken: token, requestedBrandId: input.brandId });
  if (!resolved.ok) {
    if (["authentication_required", "authentication_invalid"].includes(resolved.error.code)) return unauthorizedResponse(context.correlationId);
    if (resolved.error.code === "invalid_input") return badRequestResponse(context.correlationId, "The requested administrative scope is invalid.");
    if (resolved.error.code === "brand_not_found" || resolved.error.code === "not_found") return notFoundResponse(context.correlationId);
    if (resolved.error.code === "permission_denied") return forbiddenResponse(context.correlationId);
    if (["provider_unavailable", "query_failed", "timeout"].includes(resolved.error.code)) return serviceUnavailableResponse(context.correlationId);
    return internalErrorResponse(context.correlationId);
  }
  const trusted = resolved.value;
  if (trusted.brand.brandId !== input.brandId) return forbiddenResponse(context.correlationId);
  const permission = requireAdminPermission(trusted, input.route.permission as AdminPermissionCode); if (!permission.ok) return forbiddenResponse(context.correlationId);
  const executor = admin.commands.m2; if (!executor) return serviceUnavailableResponse(context.correlationId);
  const result = await invoke(executor, input.route, trusted, input, parsedBody, metadata(trusted, parsedBody.reason as string, key, parsedBody.expectedVersion));
  return result.ok ? success(result.value as unknown as { readonly data: object; readonly correlationId: string; readonly mutated: boolean; readonly replayed: boolean; readonly adminActionId?: string; readonly auditLogId?: string }, "create" in input.route) : mapError(result.error);
}
