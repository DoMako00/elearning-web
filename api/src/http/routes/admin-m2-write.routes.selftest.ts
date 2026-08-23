import type { IncomingMessage, ServerResponse } from "node:http";
import { createTestAdminRequestContext } from "../../core/context";
import { repositoryOk } from "../../core/persistence";
import { ok } from "../../shared";
import { createHttpApp } from "../http-app";
import type { AdminModule } from "../http-types";
import type { AdminM2CommandExecutor } from "../../modules/admin/commands";

const brandId = "10000000-0000-4000-8000-000000000001";
const instructorId = "10000000-0000-4000-8000-000000000002";
const courseId = "10000000-0000-4000-8000-000000000003";
const moduleId = "10000000-0000-4000-8000-000000000004";
const adminProfileId = "10000000-0000-4000-8000-000000000005";
const permissions = ["admin.instructors.create", "admin.instructors.update", "admin.brand_instructors.assign", "admin.brand_instructors.update", "admin.brand_courses.create", "admin.brand_courses.update", "admin.course_instructors.assign", "admin.course_instructors.update"] as const;

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function result(data: Record<string, string>) { return ok({ data, correlationId: "write-route-selftest", mutated: true, replayed: false, adminActionId: "10000000-0000-4000-8000-000000000006", auditLogId: "10000000-0000-4000-8000-000000000007" }); }

export async function runAdminM2WriteRouteSelfTest(): Promise<void> {
  const calls: { name: string; command: Record<string, unknown> }[] = [];
  const record = (name: string, data: Record<string, string>) => (_context: unknown, command: Record<string, unknown>) => { calls.push({ name, command }); return Promise.resolve(result(data)); };
  const executor: AdminM2CommandExecutor = {
    createInstructor: record("createInstructor", { instructorId }), updateInstructor: record("updateInstructor", { instructorId }), setInstructorStatus: record("setInstructorStatus", { instructorId }),
    assignInstructorToBrand: record("assignInstructorToBrand", { brandId, instructorId }), setBrandInstructorStatus: record("setBrandInstructorStatus", { brandId, instructorId }),
    createBrandCourse: record("createBrandCourse", { brandId, courseId }), updateBrandCourse: record("updateBrandCourse", { brandId, courseId }), setBrandCourseStatus: record("setBrandCourseStatus", { brandId, courseId }),
    assignInstructorToCourse: record("assignInstructorToCourse", { brandId, courseId, instructorId }), setCourseInstructorStatus: record("setCourseInstructorStatus", { brandId, courseId, instructorId }),
  } as unknown as AdminM2CommandExecutor;
  const context = createTestAdminRequestContext({ brandId, brandCode: "medway", adminProfileId, correlationId: "write-route-selftest", permissions });
  const resolver = { async resolve() { return repositoryOk(context); } };
  const admin = { commands: { m2: executor } } as unknown as AdminModule;
  const handler = createHttpApp({ admin, adminHttpContextResolver: resolver });
  const invoke = async (method: string, path: string, body: object, headers: Record<string, string> = {}) => {
    let output = ""; const response = { statusCode: 200, setHeader() {}, end(value?: string) { output = value ?? ""; } } as unknown as ServerResponse;
    const request = { method, url: path, headers: { authorization: "Bearer test-token", "idempotency-key": "write-route-selftest-key", ...headers }, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)); } } as unknown as IncomingMessage;
    await handler(request, response); return { status: response.statusCode, body: JSON.parse(output) as Record<string, unknown> };
  };
  const cases: readonly [string, string, object, string][] = [
    ["POST", `/v1/admin/brands/${brandId}/instructors/global`, { displayName: "Dr Test", reason: "Create." }, "createInstructor"],
    ["PATCH", `/v1/admin/brands/${brandId}/instructors/global/${instructorId}`, { displayName: "Dr Update", reason: "Update.", expectedVersion: "2026-01-01T00:00:00.000Z" }, "updateInstructor"],
    ["PATCH", `/v1/admin/brands/${brandId}/instructors/global/${instructorId}/status`, { status: "inactive", reason: "Status." }, "setInstructorStatus"],
    ["POST", `/v1/admin/brands/${brandId}/instructors`, { instructorId, reason: "Assign." }, "assignInstructorToBrand"],
    ["PATCH", `/v1/admin/brands/${brandId}/instructors/${instructorId}/status`, { status: "inactive", reason: "Status." }, "setBrandInstructorStatus"],
    ["POST", `/v1/admin/brands/${brandId}/courses`, { courseCode: "TEST101", title: "Test", scope: "curriculum", academicModuleId: moduleId, reason: "Create." }, "createBrandCourse"],
    ["PATCH", `/v1/admin/brands/${brandId}/courses/${courseId}`, { title: "Updated", reason: "Update." }, "updateBrandCourse"],
    ["PATCH", `/v1/admin/brands/${brandId}/courses/${courseId}/status`, { status: "published", reason: "Publish." }, "setBrandCourseStatus"],
    ["POST", `/v1/admin/brands/${brandId}/courses/${courseId}/instructors`, { instructorId, reason: "Assign." }, "assignInstructorToCourse"],
    ["PATCH", `/v1/admin/brands/${brandId}/courses/${courseId}/instructors/${instructorId}/status`, { status: "inactive", reason: "Status." }, "setCourseInstructorStatus"],
  ];
  for (const [method, path, body, name] of cases) { const response = await invoke(method, path, body); assert(response.status === (name === "createInstructor" || name === "createBrandCourse" ? 201 : 200), `${name} status`); assert(calls.at(-1)?.name === name, `${name} mapping`); const command = calls.at(-1)!.command; assert((command.metadata as { idempotencyKey: string }).idempotencyKey === "write-route-selftest-key", `${name} idempotency`); }
  const injection = await invoke("POST", `/v1/admin/brands/${brandId}/instructors/global`, { displayName: "No", reason: "Reject.", adminProfileId });
  assert(injection.status === 400, "Authority injection must be rejected");
  const missingAuth = await invoke("POST", `/v1/admin/brands/${brandId}/instructors/global`, { displayName: "No", reason: "Reject." }, { authorization: "" });
  assert(missingAuth.status === 401, "Bearer credential must be required");
  const query = await invoke("POST", `/v1/admin/brands/${brandId}/instructors/global?x=1`, { displayName: "No", reason: "Reject." });
  assert(query.status === 400, "Write queries must be rejected");
}

if (process.argv[1]?.endsWith("admin-m2-write.routes.selftest.js")) runAdminM2WriteRouteSelfTest().then(() => console.log("admin M2 write routes selftest passed"));
