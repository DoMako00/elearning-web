import type { IncomingMessage, ServerResponse } from "node:http";
import { createTestAdminRequestContext } from "../../core/context";
import { repositoryOk } from "../../core/persistence";
import { ok } from "../../shared";
import type { AdminM2CommandExecutor } from "../../modules/admin/commands";
import { createHttpApp } from "../http-app";
import type { AdminModule } from "../http-types";

const brandId = "10000000-0000-4000-8000-000000000001";
const instructorId = "10000000-0000-4000-8000-000000000002";
const courseId = "10000000-0000-4000-8000-000000000003";
const moduleId = "10000000-0000-4000-8000-000000000004";
const adminProfileId = "10000000-0000-4000-8000-000000000005";
const permissions = ["admin.platform.admin.write"] as const;
const response = (data: Record<string, string>) => ok({ data, correlationId: "write-route-selftest", mutated: true, replayed: false, receiptId: "10000000-0000-4000-8000-000000000006", auditEventId: "10000000-0000-4000-8000-000000000007" });
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

export async function runAdminM2WriteRouteSelfTest(): Promise<void> {
  const calls: { name: string; command: Record<string, unknown> }[] = [];
  const record = (name: string, data: Record<string, string>) => (_context: unknown, command: Record<string, unknown>) => { calls.push({ name, command }); return Promise.resolve(response(data)); };
  const executor: AdminM2CommandExecutor = {
    createInstructor: record("createInstructor", { instructorId }), updateInstructor: record("updateInstructor", { instructorId }), setInstructorStatus: record("setInstructorStatus", { instructorId }),
    assignInstructorToBrand: record("assignInstructorToBrand", { brandId, instructorId }), setBrandInstructorStatus: record("setBrandInstructorStatus", { brandId, instructorId }),
    createBrandCourse: record("createBrandCourse", { brandId, courseId }), updateBrandCourse: record("updateBrandCourse", { brandId, courseId }), setBrandCourseStatus: record("setBrandCourseStatus", { brandId, courseId }),
    assignInstructorToCourse: record("assignInstructorToCourse", { brandId, courseId, instructorId }), setCourseInstructorStatus: record("setCourseInstructorStatus", { brandId, courseId, instructorId }),
  } as unknown as AdminM2CommandExecutor;
  const context = createTestAdminRequestContext({ brandId, brandCode: "medway", adminProfileId, correlationId: "write-route-selftest", permissions });
  const handler = createHttpApp({ admin: { commands: { m2: executor } } as unknown as AdminModule, adminHttpContextResolver: { async resolve() { return repositoryOk(context); } } });
  const invoke = async (method: string, path: string, payload: object, headers: Record<string, string> = {}) => {
    let output = "";
    const reply = { statusCode: 200, setHeader() {}, end(value?: string) { output = value ?? ""; } } as unknown as ServerResponse;
    const request = { method, url: path, headers: { authorization: "Bearer mock-auth-write-route-001", "idempotency-key": "write-route-selftest-key", ...headers }, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(payload)); } } as unknown as IncomingMessage;
    await handler(request, reply);
    return { status: reply.statusCode, body: JSON.parse(output) as Record<string, unknown> };
  };
  const cases: readonly [string, string, object, string][] = [
    ["POST", "/v1/admin/instructors", { code: "INS-TEST", displayName: "Test Instructor", reason: "Create." }, "createInstructor"],
    ["PATCH", `/v1/admin/instructors/${instructorId}`, { displayName: "Updated Instructor", reason: "Update.", expectedVersion: 1 }, "updateInstructor"],
    ["PATCH", `/v1/admin/instructors/${instructorId}/status`, { status: "inactive", reason: "Status.", expectedVersion: 1 }, "setInstructorStatus"],
    ["POST", `/v1/admin/brands/${brandId}/instructors`, { instructorId, reason: "Assign." }, "assignInstructorToBrand"],
    ["PATCH", `/v1/admin/brands/${brandId}/instructors/${instructorId}/status`, { status: "inactive", reason: "Status.", expectedVersion: 1 }, "setBrandInstructorStatus"],
    ["POST", `/v1/admin/brands/${brandId}/courses`, { code: "TEST101", title: "Test", classification: "academic_module_offering", academicModuleId: moduleId, reason: "Create." }, "createBrandCourse"],
    ["PATCH", `/v1/admin/brands/${brandId}/courses/${courseId}`, { title: "Updated", reason: "Update.", expectedVersion: 1 }, "updateBrandCourse"],
    ["PATCH", `/v1/admin/brands/${brandId}/courses/${courseId}/status`, { status: "published", reason: "Publish.", expectedVersion: 1 }, "setBrandCourseStatus"],
    ["POST", `/v1/admin/brands/${brandId}/courses/${courseId}/instructors`, { instructorId, reason: "Assign." }, "assignInstructorToCourse"],
    ["PATCH", `/v1/admin/brands/${brandId}/courses/${courseId}/instructors/${instructorId}/status`, { status: "inactive", reason: "Status.", expectedVersion: 1 }, "setCourseInstructorStatus"],
  ];
  for (const [method, path, payload, name] of cases) {
    const result = await invoke(method, path, payload);
    assert(result.status === (["createInstructor", "assignInstructorToBrand", "createBrandCourse", "assignInstructorToCourse"].includes(name) ? 201 : 200), `${name} status`);
    assert(calls.at(-1)?.name === name, `${name} mapping`);
    assert((calls.at(-1)?.command.metadata as { idempotencyKey: string }).idempotencyKey === "write-route-selftest-key", `${name} idempotency`);
    assert(result.body.receiptId && result.body.auditEventId, `${name} M4A identifiers`);
  }
  assert((await invoke("POST", "/v1/admin/instructors", { code: "INS-X", displayName: "X", reason: "Reject.", adminProfileId })).status === 400, "authority injection must be rejected");
  assert((await invoke("POST", "/v1/admin/instructors", { code: "INS-X", displayName: "X", reason: "Reject." }, { authorization: "" })).status === 401, "bearer is required");
  assert((await invoke("POST", "/v1/admin/instructors?x=1", { code: "INS-X", displayName: "X", reason: "Reject." })).status === 400, "write queries are rejected");
}

if (process.argv[1]?.endsWith("admin-m2-write.routes.selftest.js")) runAdminM2WriteRouteSelfTest().then(() => console.log("admin M2 write routes selftest passed"));
