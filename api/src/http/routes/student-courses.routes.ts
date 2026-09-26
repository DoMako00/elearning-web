import type { IncomingMessage } from "node:http";
import type { StudentCommercialBrand } from "../../contracts/student/courses";
import type { RepositoryResult } from "../../core/persistence";
import type { StudentCourses } from "../../modules/student/student-courses";
import type { HttpJsonResponse, HttpRequestContext } from "../http-types";
import { parseStrictBearerToken } from "../strict-bearer";
import { badRequestResponse, jsonResponse, methodNotAllowedResponse, notFoundResponse, serviceUnavailableResponse, unauthorizedResponse } from "../middleware/json-response";

const pathPattern = /^\/v1\/student\/courses(?:\/([^/]+)(\/lessons)?)?$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isStudentCoursesPath(path: string): boolean { return pathPattern.test(path); }

function response<T>(result: RepositoryResult<T>, correlationId: string): HttpJsonResponse {
  if (result.ok) return jsonResponse(200, { ok: true, correlationId, data: result.value });
  if (["authentication_required", "authentication_invalid"].includes(result.error.code)) return unauthorizedResponse(correlationId);
  if (result.error.code === "permission_denied") return jsonResponse(403, { ok: false, error: { code: "forbidden", message: "An active student academic placement is required.", correlationId } });
  if (result.error.code === "invalid_input") return badRequestResponse(correlationId, "Select a commercial brand for this student membership.");
  if (result.error.code === "not_found") return notFoundResponse(correlationId);
  return serviceUnavailableResponse(correlationId);
}

async function read(raw: IncomingMessage, context: HttpRequestContext, student: StudentCourses | undefined): Promise<HttpJsonResponse> {
  const correlationId = context.correlationId;
  if (context.method !== "GET") return methodNotAllowedResponse(correlationId);
  const bearer = parseStrictBearerToken(raw);
  if (!bearer.ok) return unauthorizedResponse(correlationId);
  if (!student) return serviceUnavailableResponse(correlationId);
  const parsed = new URL(context.url, "http://localhost");
  const match = parsed.pathname.match(pathPattern);
  if (!match) return notFoundResponse(correlationId);
  const courseId = match[1];
  if (courseId && !uuid.test(courseId)) return badRequestResponse(correlationId, "A valid course identifier is required.");
  const allowed = courseId ? ["brand"] : ["brand", "page", "pageSize"];
  for (const key of parsed.searchParams.keys()) {
    if (!allowed.includes(key) || parsed.searchParams.getAll(key).length !== 1) return badRequestResponse(correlationId, "Unsupported or repeated query parameter.");
  }
  const brand = parsed.searchParams.get("brand") ?? undefined;
  if (brand !== undefined && !["medway", "elite", "nexus"].includes(brand)) return badRequestResponse(correlationId, "brand must be medway, elite, or nexus.");
  const pageText = parsed.searchParams.get("page") ?? "1";
  const sizeText = parsed.searchParams.get("pageSize") ?? "25";
  if (!/^[1-9][0-9]*$/.test(pageText) || !/^[1-9][0-9]*$/.test(sizeText)) return badRequestResponse(correlationId, "Invalid pagination.");
  const page = Number(pageText), pageSize = Number(sizeText);
  if (!Number.isSafeInteger(page) || page > 1000000 || !Number.isSafeInteger(pageSize) || pageSize > 100) return badRequestResponse(correlationId, "Invalid pagination.");
  const identity = await student.auth.verifyRequestAuth({ bearerToken: bearer.token, correlationId });
  if (!identity.ok) return response(identity, correlationId);
  // The factory only wires the real verifier; this also rejects accidental mock injection.
  if (identity.value.provider !== "supabase") return unauthorizedResponse(correlationId);
  const input = { subject: identity.value.subject, brand: brand as StudentCommercialBrand | undefined, correlationId };
  if (!courseId) return response(await student.readModel.list({ ...input, page, pageSize }), correlationId);
  const detail = await student.readModel.find({ ...input, courseId });
  if (!detail.ok || !match[2]) return response(detail, correlationId);
  return jsonResponse(200, { ok: true, correlationId, data: {
    courseId: detail.value.courseId,
    cataloguePresentation: detail.value.cataloguePresentation,
    unitLabel: detail.value.unitLabel,
    lessons: detail.value.chapters.flatMap(chapter => chapter.lessons),
  } });
}

export async function handleStudentCourses(raw: IncomingMessage, context: HttpRequestContext, student: StudentCourses | undefined): Promise<HttpJsonResponse> {
  let result: HttpJsonResponse;
  try { result = await read(raw, context, student); }
  catch { result = serviceUnavailableResponse(context.correlationId); }
  return { ...result, headers: { ...result.headers, "cache-control": "private, no-store", "x-correlation-id": context.correlationId } };
}
