import type { AdminCoreError } from "../errors";
import { adminCoreError } from "../errors";
import type { Result } from "../../shared";
import { fail, ok } from "../../shared";
import type { AssignInstructorToBrandCommand, AssignInstructorToCourseCommand, CreateBrandCourseCommand, CreateInstructorCommand, SetBrandCourseStatusCommand, SetBrandInstructorStatusCommand, SetCourseInstructorStatusCommand, SetInstructorStatusCommand, UpdateBrandCourseCommand, UpdateInstructorCommand } from "../../contracts/admin";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const activeInactive = new Set(["active", "inactive"]);
const instructorStatuses = new Set(["active", "inactive", "archived"]);
const courseStatuses = new Set(["draft", "published", "archived"]);
const courseScopes = new Set(["academic_module_offering", "standalone"]);

function invalid(correlationId: string, field: string): Result<void, AdminCoreError> { return fail(adminCoreError("validation_failed", `The ${field} is invalid.`, correlationId, { field })); }
function requiredUuid(correlationId: string, field: string, value: unknown): Result<void, AdminCoreError> { return typeof value === "string" && uuid.test(value) ? ok(undefined) : invalid(correlationId, field); }
function requiredText(correlationId: string, field: string, value: unknown): Result<void, AdminCoreError> { return typeof value === "string" && value.trim().length > 0 ? ok(undefined) : invalid(correlationId, field); }
function status(correlationId: string, field: string, value: unknown, allowed: ReadonlySet<string>): Result<void, AdminCoreError> { return typeof value === "string" && allowed.has(value) ? ok(undefined) : invalid(correlationId, field); }
function first(correlationId: string, ...checks: readonly Result<void, AdminCoreError>[]): Result<void, AdminCoreError> { void correlationId; return checks.find((check) => !check.ok) ?? ok(undefined); }

export function validateCreateInstructorCommand(command: CreateInstructorCommand): Result<void, AdminCoreError> { return first(command.metadata.correlationId, requiredText(command.metadata.correlationId, "code", command.code), requiredText(command.metadata.correlationId, "displayName", command.displayName)); }
export function validateUpdateInstructorCommand(command: UpdateInstructorCommand): Result<void, AdminCoreError> {
  const correlationId = command.metadata.correlationId;
  if (command.displayName === undefined && command.code === undefined) return invalid(correlationId, "update");
  return first(correlationId, requiredUuid(correlationId, "instructorId", command.instructorId), command.code === undefined ? ok(undefined) : requiredText(correlationId, "code", command.code), command.displayName === undefined ? ok(undefined) : requiredText(correlationId, "displayName", command.displayName));
}
export function validateSetInstructorStatusCommand(command: SetInstructorStatusCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "instructorId", command.instructorId), status(id, "status", command.status, instructorStatuses)); }

export function validateAssignInstructorToBrandCommand(command: AssignInstructorToBrandCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "brandId", command.brandId), requiredUuid(id, "instructorId", command.instructorId)); }
export function validateSetBrandInstructorStatusCommand(command: SetBrandInstructorStatusCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "brandId", command.brandId), requiredUuid(id, "instructorId", command.instructorId), status(id, "status", command.status, activeInactive)); }

export function validateBrandCourseDefinition(correlationId: string, courseScope: unknown, academicModuleId: unknown): Result<void, AdminCoreError> {
  const scope = status(correlationId, "courseScope", courseScope, courseScopes); if (!scope.ok) return scope;
  if (academicModuleId !== null && academicModuleId !== undefined) { const module = requiredUuid(correlationId, "academicModuleId", academicModuleId); if (!module.ok) return module; }
  return courseScope === "academic_module_offering" && !academicModuleId ? invalid(correlationId, "academicModuleId") : ok(undefined);
}
export function validateCreateBrandCourseCommand(command: CreateBrandCourseCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "brandId", command.brandId), requiredText(id, "courseCode", command.courseCode), requiredText(id, "title", command.title), validateBrandCourseDefinition(id, command.courseScope, command.academicModuleId), status(id, "status", command.status, new Set(["draft"]))); }
export function validateUpdateBrandCourseCommand(command: UpdateBrandCourseCommand): Result<void, AdminCoreError> {
  const id = command.metadata.correlationId;
  if (command.title === undefined && command.courseScope === undefined && command.academicModuleId === undefined) return invalid(id, "update");
  if (command.courseScope === "academic_module_offering" && command.academicModuleId === null) return invalid(id, "academicModuleId");
  return first(id, requiredUuid(id, "brandId", command.brandId), requiredUuid(id, "courseId", command.courseId), command.title === undefined ? ok(undefined) : requiredText(id, "title", command.title), command.courseScope === undefined ? ok(undefined) : status(id, "courseScope", command.courseScope, courseScopes), command.academicModuleId === undefined || command.academicModuleId === null ? ok(undefined) : requiredUuid(id, "academicModuleId", command.academicModuleId));
}
export function validateSetBrandCourseStatusCommand(command: SetBrandCourseStatusCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "brandId", command.brandId), requiredUuid(id, "courseId", command.courseId), status(id, "status", command.status, courseStatuses)); }

export function validateAssignInstructorToCourseCommand(command: AssignInstructorToCourseCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "brandId", command.brandId), requiredUuid(id, "courseId", command.courseId), requiredUuid(id, "instructorId", command.instructorId)); }
export function validateSetCourseInstructorStatusCommand(command: SetCourseInstructorStatusCommand): Result<void, AdminCoreError> { const id = command.metadata.correlationId; return first(id, requiredUuid(id, "brandId", command.brandId), requiredUuid(id, "courseId", command.courseId), requiredUuid(id, "instructorId", command.instructorId), status(id, "status", command.status, activeInactive)); }
