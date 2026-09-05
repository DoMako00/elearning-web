import { createHash } from "node:crypto";
import type {
  AssignInstructorToBrandCommand, AssignInstructorToCourseCommand, BrandInstructorCommandResult,
  CreateBrandCourseCommand, CreateBrandCourseCommandResult, CreateInstructorCommand, CreateInstructorCommandResult,
  CourseInstructorCommandResult, SetBrandCourseStatusCommand, SetBrandInstructorStatusCommand,
  SetCourseInstructorStatusCommand, SetInstructorStatusCommand, UpdateBrandCourseCommand, UpdateInstructorCommand,
  AdminPermissionCode,
} from "../../../contracts/admin";
import type { AdminRequestContext } from "../../../core/context";
import { adminCoreError, type AdminCoreError } from "../../../core/errors";
import { requireAdminPermission, type AdminPermissionResolver } from "../../../core/permissions";
import {
  validateAssignInstructorToBrandPolicy, validateAssignInstructorToCoursePolicy,
  validateBrandCourseStatusTransition, validateM2BrandCourseDefinitionPolicy,
} from "../../../core/policies";
import type {
  AdminM2ActionEvidence, AdminM2BrandCourseState, AdminM2BrandInstructorState,
  AdminM2CourseInstructorState, AdminM2IdempotencyIdentity, AdminM2InstructorState,
  AdminM2Receipt, AdminM2WriteTransaction, AdminM2WriteTransactionRunner,
} from "../../../core/repositories";
import {
  validateAssignInstructorToBrandCommand, validateAssignInstructorToCourseCommand,
  validateCommandBrand, validateCreateBrandCourseCommand, validateCreateInstructorCommand,
  validateSensitiveCommandMetadata, validateSetBrandCourseStatusCommand,
  validateSetBrandInstructorStatusCommand, validateSetCourseInstructorStatusCommand,
  validateSetInstructorStatusCommand, validateUpdateBrandCourseCommand, validateUpdateInstructorCommand,
} from "../../../core/validation";
import { fail, ok, type Result } from "../../../shared";

export interface AdminM2CommandSuccess<T> {
  readonly data: T;
  readonly correlationId: string;
  readonly mutated: boolean;
  readonly replayed: boolean;
  readonly receiptId?: string;
  readonly auditEventId?: string;
}
export type AdminM2CommandResult<T> = Result<AdminM2CommandSuccess<T>, AdminCoreError>;

export interface AdminM2CommandExecutor {
  createInstructor(context: AdminRequestContext, command: CreateInstructorCommand): Promise<AdminM2CommandResult<CreateInstructorCommandResult>>;
  updateInstructor(context: AdminRequestContext, command: UpdateInstructorCommand): Promise<AdminM2CommandResult<CreateInstructorCommandResult>>;
  setInstructorStatus(context: AdminRequestContext, command: SetInstructorStatusCommand): Promise<AdminM2CommandResult<CreateInstructorCommandResult>>;
  assignInstructorToBrand(context: AdminRequestContext, command: AssignInstructorToBrandCommand): Promise<AdminM2CommandResult<BrandInstructorCommandResult>>;
  setBrandInstructorStatus(context: AdminRequestContext, command: SetBrandInstructorStatusCommand): Promise<AdminM2CommandResult<BrandInstructorCommandResult>>;
  createBrandCourse(context: AdminRequestContext, command: CreateBrandCourseCommand): Promise<AdminM2CommandResult<CreateBrandCourseCommandResult>>;
  updateBrandCourse(context: AdminRequestContext, command: UpdateBrandCourseCommand): Promise<AdminM2CommandResult<CreateBrandCourseCommandResult>>;
  setBrandCourseStatus(context: AdminRequestContext, command: SetBrandCourseStatusCommand): Promise<AdminM2CommandResult<CreateBrandCourseCommandResult>>;
  assignInstructorToCourse(context: AdminRequestContext, command: AssignInstructorToCourseCommand): Promise<AdminM2CommandResult<CourseInstructorCommandResult>>;
  setCourseInstructorStatus(context: AdminRequestContext, command: SetCourseInstructorStatusCommand): Promise<AdminM2CommandResult<CourseInstructorCommandResult>>;
}

type TargetType = AdminM2ActionEvidence["targetType"];
type Mutation<T> = { readonly data: T; readonly targetId: string; readonly before: Readonly<Record<string, unknown>> | null; readonly after: Readonly<Record<string, unknown>>; readonly mutated: boolean };
type CommandEnvelope = { readonly metadata: CreateInstructorCommand["metadata"] };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SAFE_JSON_BYTES = 16 * 1024;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]));
  return value;
}
export function createAdminM2CommandFingerprint(value: Readonly<Record<string, unknown>>): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}
function trim(value: string): string { return value.trim(); }
function safeJson(value: Readonly<Record<string, unknown>>, correlationId: string): Result<void, AdminCoreError> {
  return Buffer.byteLength(JSON.stringify(value), "utf8") <= MAX_SAFE_JSON_BYTES
    ? ok(undefined)
    : fail(adminCoreError("validation_failed", "The administrative evidence summary is too large.", correlationId));
}
function targetNotFound(correlationId: string): AdminCoreError { return adminCoreError("target_not_found", "The requested target was not found.", correlationId); }
function conflict(correlationId: string, reason: string): AdminCoreError { return adminCoreError("conflict", "The requested change conflicts with the current state.", correlationId, { reason }); }
function expectedVersion(command: CommandEnvelope): number | undefined { return command.metadata.expectedVersion; }
function versionMatches(command: CommandEnvelope, version: number): boolean { const expected=expectedVersion(command); return expected===undefined||expected===version; }
function instructorSummary(value: AdminM2InstructorState): Readonly<Record<string, unknown>> { return { id:value.id,code:value.code,displayName:value.displayName,status:value.status,version:value.version }; }
function brandInstructorSummary(value: AdminM2BrandInstructorState): Readonly<Record<string, unknown>> { return { id:value.id,brandId:value.brandId,instructorId:value.instructorId,status:value.status,version:value.version }; }
function courseSummary(value: AdminM2BrandCourseState): Readonly<Record<string, unknown>> { return { id:value.id,brandId:value.brandId,academicModuleId:value.academicModuleId,code:value.code,title:value.title,classification:value.classification,status:value.status,version:value.version }; }
function courseInstructorSummary(value: AdminM2CourseInstructorState): Readonly<Record<string, unknown>> { return { id:value.id,brandId:value.brandId,courseId:value.courseId,instructorBrandAssignmentId:value.instructorBrandAssignmentId,instructorId:value.instructorId,status:value.status,version:value.version }; }

export class TransactionalAdminM2CommandExecutor implements AdminM2CommandExecutor {
  constructor(private readonly runner: AdminM2WriteTransactionRunner, private readonly permissionResolver: AdminPermissionResolver) {}

  private async authorize(context: AdminRequestContext, command: CommandEnvelope, permission: AdminPermissionCode, validate: () => Result<void, AdminCoreError>): Promise<Result<void, AdminCoreError>> {
    const metadata = validateSensitiveCommandMetadata(command.metadata); if (!metadata.ok) return metadata;
    if (command.metadata.correlationId !== context.correlationId) return fail(adminCoreError("validation_failed", "The command correlation does not match the trusted request context.", context.correlationId));
    const brand = validateCommandBrand(command.metadata, context); if (!brand.ok) return brand;
    if (!uuid.test(context.brand.brandId) || !uuid.test(context.adminUser.adminProfileId) || context.adminUser.adminProfileId !== context.adminUser.adminUserId) return fail(adminCoreError("unauthenticated", "A trusted Admin profile and brand identity are required.", context.correlationId));
    if (context.correlationId.length > 128 || (context.requestId?.length ?? 0) > 128 || trim(command.metadata.idempotencyKey).length > 128 || (command.metadata.policySetId?.length ?? 0) > 128 || (expectedVersion(command) !== undefined && (!Number.isSafeInteger(expectedVersion(command)) || expectedVersion(command)! < 1))) return fail(adminCoreError("validation_failed", "The administrative command metadata is invalid.", context.correlationId));
    const syntactic = validate(); if (!syntactic.ok) return syntactic;
    const permissions = await this.permissionResolver.resolvePermissions(context);
    return requireAdminPermission({ ...context, permissions }, permission);
  }

  private async execute<T>(input: {
    readonly context: AdminRequestContext; readonly command: CommandEnvelope; readonly commandName: string;
    readonly permission: AdminPermissionCode; readonly validate: () => Result<void, AdminCoreError>;
    readonly targetType: TargetType; readonly scopeKind: "global" | "brand"; readonly fingerprintData: Readonly<Record<string, unknown>>;
    readonly resultKeys: readonly string[];
    readonly mutate: (transaction: AdminM2WriteTransaction) => Promise<Result<Mutation<T>, AdminCoreError>>;
  }): Promise<AdminM2CommandResult<T>> {
    const authorized = await this.authorize(input.context, input.command, input.permission, input.validate); if (!authorized.ok) return authorized;
    const correlationId = input.context.correlationId;
    const brandId=input.scopeKind==="brand"?input.context.brand.brandId:null;
    const fingerprint = createAdminM2CommandFingerprint({ commandName: input.commandName, scopeKind:input.scopeKind, brandId, reason: trim(input.command.metadata.reason), expectedVersion: expectedVersion(input.command) ?? null, ...input.fingerprintData });
    const identity: AdminM2IdempotencyIdentity = { scopeKind:input.scopeKind, brandId, adminProfileId: input.context.adminUser.adminProfileId, commandName: input.commandName, idempotencyKey: trim(input.command.metadata.idempotencyKey) };
    const result = await this.runner.run(correlationId, async (transaction) => {
      if (!await transaction.lockExecutionIdentity(identity)) return fail(targetNotFound(correlationId));
      const receipt = await transaction.findReceipt(identity);
      if (receipt) return this.replay<T>(receipt, fingerprint, correlationId, input.resultKeys);
      const mutation = await input.mutate(transaction); if (!mutation.ok) return mutation;
      if (!mutation.value.mutated) return ok({ data: mutation.value.data, correlationId, mutated: false, replayed: false });
      const resultSummary = mutation.value.data as Readonly<Record<string, unknown>>;
      for (const value of [resultSummary, mutation.value.after, ...(mutation.value.before ? [mutation.value.before] : [])]) { const size = safeJson(value, correlationId); if (!size.ok) return size; }
      const evidence = await transaction.writeEvidence({ identity, requestFingerprint: fingerprint, targetType: input.targetType, targetId: mutation.value.targetId, reason: trim(input.command.metadata.reason), correlationId, resultSummary, beforeSummary: mutation.value.before, afterSummary: mutation.value.after, metadata: { fingerprintVersion: "v1", commandVersion: "v1", expectedVersionPresent: expectedVersion(input.command)!==undefined } });
      return ok({ data: mutation.value.data, correlationId, mutated: true, replayed: false, ...evidence });
    });
    if (!result.ok && result.error.details?.reason === "idempotency_race") {
      const winner = await this.runner.findCommittedReceipt(identity, correlationId); if (!winner.ok) return winner;
      return winner.value ? this.replay<T>(winner.value, fingerprint, correlationId, input.resultKeys) : fail(adminCoreError("persistence_failed", "The administrative transaction could not be completed.", correlationId));
    }
    return result;
  }

  private replay<T>(receipt: AdminM2Receipt, fingerprint: string, correlationId: string, resultKeys: readonly string[]): AdminM2CommandResult<T> {
    if (receipt.requestFingerprint !== fingerprint) return fail(adminCoreError("idempotency_key_reused", "The idempotency key was already used for a different command.", correlationId));
    if (!resultKeys.every((key) => typeof receipt.resultSummary[key] === "string" && receipt.resultSummary[key])) return fail(adminCoreError("persistence_failed", "The stored administrative result is invalid.", correlationId));
    return ok({ data: receipt.resultSummary as T, correlationId, mutated: false, replayed: true, receiptId:receipt.receiptId, auditEventId:receipt.auditEventId });
  }

  createInstructor(context: AdminRequestContext, command: CreateInstructorCommand): Promise<AdminM2CommandResult<CreateInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.instructors.create", permission: "admin.platform.admin.write", validate: () => validateCreateInstructorCommand(command), targetType: "instructor", scopeKind:"global", resultKeys: ["instructorId"], fingerprintData: { code:trim(command.code),displayName:trim(command.displayName) }, mutate: async (transaction) => {
      const created = await transaction.insertInstructor({ code:trim(command.code),displayName:trim(command.displayName) });
      return ok({ data: { instructorId: created.id }, targetId: created.id, before: null, after: instructorSummary(created), mutated: true });
    } });
  }

  updateInstructor(context: AdminRequestContext, command: UpdateInstructorCommand): Promise<AdminM2CommandResult<CreateInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.instructors.update", permission: "admin.platform.admin.write", validate: () => validateUpdateInstructorCommand(command), targetType: "instructor", scopeKind:"global", resultKeys: ["instructorId"], fingerprintData: { instructorId:command.instructorId,code:command.code===undefined?"unchanged":trim(command.code),displayName:command.displayName===undefined?"unchanged":trim(command.displayName) }, mutate: async (transaction) => {
      const current = await transaction.lockInstructor(command.instructorId); if (!current) return fail(targetNotFound(context.correlationId));
      if (!versionMatches(command, current.version)) return fail(conflict(context.correlationId, "expected_version_mismatch"));
      const next={code:command.code===undefined?current.code:trim(command.code),displayName:command.displayName===undefined?current.displayName:trim(command.displayName),status:current.status};
      if(next.code===current.code&&next.displayName===current.displayName)return ok({data:{instructorId:current.id},targetId:current.id,before:instructorSummary(current),after:instructorSummary(current),mutated:false});
      const updated = await transaction.updateInstructor({ id: current.id, ...next });
      return ok({ data: { instructorId: updated.id }, targetId: updated.id, before: instructorSummary(current), after: instructorSummary(updated), mutated: true });
    } });
  }

  setInstructorStatus(context: AdminRequestContext, command: SetInstructorStatusCommand): Promise<AdminM2CommandResult<CreateInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.instructors.set_status", permission: "admin.platform.admin.write", validate: () => validateSetInstructorStatusCommand(command), targetType: "instructor", scopeKind:"global", resultKeys: ["instructorId"], fingerprintData: { instructorId: command.instructorId, status: command.status }, mutate: async (transaction) => {
      const current = await transaction.lockInstructor(command.instructorId); if (!current) return fail(targetNotFound(context.correlationId));
      if (!versionMatches(command, current.version)) return fail(conflict(context.correlationId, "expected_version_mismatch"));
      if (current.status === command.status) return ok({ data: { instructorId: current.id }, targetId: current.id, before: instructorSummary(current), after: instructorSummary(current), mutated: false });
      const updated = await transaction.updateInstructor({ id:current.id,code:current.code,displayName:current.displayName,status:command.status });
      return ok({ data: { instructorId: updated.id }, targetId: updated.id, before: instructorSummary(current), after: instructorSummary(updated), mutated: true });
    } });
  }

  assignInstructorToBrand(context: AdminRequestContext, command: AssignInstructorToBrandCommand): Promise<AdminM2CommandResult<BrandInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.instructor_brand_assignments.assign", permission: "admin.platform.admin.write", validate: () => validateAssignInstructorToBrandCommand(command), targetType: "instructor_brand_assignment", scopeKind:"brand", resultKeys: ["brandId", "instructorId"], fingerprintData: { brandId: command.brandId, instructorId: command.instructorId }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const instructor = await transaction.lockInstructor(command.instructorId); const existing = await transaction.lockBrandInstructor(command.brandId, command.instructorId);
      const policy = validateAssignInstructorToBrandPolicy(context.correlationId, { brandExists: true, brandIsActive: true, instructorExists: Boolean(instructor), instructorStatus: instructor?.status ?? "inactive", associationStatus: existing?.status }); if (!policy.ok) return policy;
      const created = await transaction.insertBrandInstructor({ brandId: command.brandId, instructorId: command.instructorId });
      return ok({ data: { brandId: created.brandId, instructorId: created.instructorId }, targetId: created.id, before: null, after: brandInstructorSummary(created), mutated: true });
    } });
  }

  setBrandInstructorStatus(context: AdminRequestContext, command: SetBrandInstructorStatusCommand): Promise<AdminM2CommandResult<BrandInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.instructor_brand_assignments.set_status", permission: "admin.platform.admin.write", validate: () => validateSetBrandInstructorStatusCommand(command), targetType: "instructor_brand_assignment", scopeKind:"brand", resultKeys: ["brandId", "instructorId"], fingerprintData: { brandId: command.brandId, instructorId: command.instructorId, status: command.status }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const instructor = await transaction.lockInstructor(command.instructorId); const current = await transaction.lockBrandInstructor(command.brandId, command.instructorId);
      if (!instructor || !current) return fail(targetNotFound(context.correlationId));
      if (!versionMatches(command, current.version)) return fail(conflict(context.correlationId, "expected_version_mismatch"));
      if (command.status === "active" && instructor.status !== "active") return fail(adminCoreError("policy_validation_failed", "The command policy rejected the requested state.", context.correlationId));
      if (current.status === command.status) return ok({ data: { brandId: current.brandId, instructorId: current.instructorId }, targetId: current.id, before: brandInstructorSummary(current), after: brandInstructorSummary(current), mutated: false });
      const updated = await transaction.updateBrandInstructorStatus({ id: current.id, status: command.status });
      return ok({ data: { brandId: updated.brandId, instructorId: updated.instructorId }, targetId: updated.id, before: brandInstructorSummary(current), after: brandInstructorSummary(updated), mutated: true });
    } });
  }

  createBrandCourse(context: AdminRequestContext, command: CreateBrandCourseCommand): Promise<AdminM2CommandResult<CreateBrandCourseCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.brand_courses.create", permission: "admin.platform.admin.write", validate: () => validateCreateBrandCourseCommand(command), targetType: "brand_course", scopeKind:"brand", resultKeys: ["brandId", "courseId"], fingerprintData: { brandId:command.brandId,code:trim(command.courseCode),title:trim(command.title),classification:command.courseScope,academicModuleId:command.academicModuleId }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const moduleExists = command.academicModuleId ? await transaction.lockAcademicModule(command.academicModuleId) : false;
      const policy = validateM2BrandCourseDefinitionPolicy(context.correlationId, { courseScope: command.courseScope, academicModuleId: command.academicModuleId, academicModuleExists: moduleExists }); if (!policy.ok) return policy;
      if (await transaction.lockBrandCourseByCode(command.brandId, trim(command.courseCode))) return fail(conflict(context.correlationId, "brand_course_code_exists"));
      const created = await transaction.insertBrandCourse({ brandId:command.brandId,academicModuleId:command.academicModuleId,code:trim(command.courseCode),title:trim(command.title),classification:command.courseScope });
      return ok({ data: { brandId: created.brandId, courseId: created.id }, targetId: created.id, before: null, after: courseSummary(created), mutated: true });
    } });
  }

  updateBrandCourse(context: AdminRequestContext, command: UpdateBrandCourseCommand): Promise<AdminM2CommandResult<CreateBrandCourseCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.brand_courses.update", permission: "admin.platform.admin.write", validate: () => validateUpdateBrandCourseCommand(command), targetType: "brand_course", scopeKind:"brand", resultKeys: ["brandId", "courseId"], fingerprintData: { brandId:command.brandId,courseId:command.courseId,title:command.title===undefined?"unchanged":trim(command.title),classification:command.courseScope??"unchanged",academicModuleId:command.academicModuleId===undefined?"unchanged":command.academicModuleId }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const requestedModuleExists = command.academicModuleId ? await transaction.lockAcademicModule(command.academicModuleId) : false;
      const current = await transaction.lockBrandCourse(command.brandId, command.courseId); if (!current) return fail(targetNotFound(context.correlationId));
      if (!versionMatches(command, current.version)) return fail(conflict(context.correlationId, "expected_version_mismatch"));
      const next={title:command.title===undefined?current.title:trim(command.title),classification:command.courseScope??current.classification,academicModuleId:command.academicModuleId===undefined?current.academicModuleId:command.academicModuleId};
      const moduleExists = next.academicModuleId ? (command.academicModuleId === undefined ? true : requestedModuleExists) : false;
      const policy=validateM2BrandCourseDefinitionPolicy(context.correlationId,{courseScope:next.classification,academicModuleId:next.academicModuleId,academicModuleExists:moduleExists});if(!policy.ok)return policy;
      if(next.title===current.title&&next.classification===current.classification&&next.academicModuleId===current.academicModuleId)return ok({data:{brandId:current.brandId,courseId:current.id},targetId:current.id,before:courseSummary(current),after:courseSummary(current),mutated:false});
      const updated = await transaction.updateBrandCourse({ id: current.id, ...next, status: current.status });
      return ok({ data: { brandId: updated.brandId, courseId: updated.id }, targetId: updated.id, before: courseSummary(current), after: courseSummary(updated), mutated: true });
    } });
  }

  setBrandCourseStatus(context: AdminRequestContext, command: SetBrandCourseStatusCommand): Promise<AdminM2CommandResult<CreateBrandCourseCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.brand_courses.set_status", permission: "admin.platform.admin.write", validate: () => validateSetBrandCourseStatusCommand(command), targetType: "brand_course", scopeKind:"brand", resultKeys: ["brandId", "courseId"], fingerprintData: { brandId: command.brandId, courseId: command.courseId, status: command.status }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const current = await transaction.lockBrandCourse(command.brandId, command.courseId); if (!current) return fail(targetNotFound(context.correlationId));
      if (!versionMatches(command, current.version)) return fail(conflict(context.correlationId, "expected_version_mismatch"));
      const policy = validateBrandCourseStatusTransition(context.correlationId, current.status, command.status); if (!policy.ok) return policy;
      if (policy.value.idempotent) return ok({ data: { brandId: current.brandId, courseId: current.id }, targetId: current.id, before: courseSummary(current), after: courseSummary(current), mutated: false });
      const updated=await transaction.updateBrandCourse({id:current.id,academicModuleId:current.academicModuleId,title:current.title,classification:current.classification,status:command.status});
      return ok({ data: { brandId: updated.brandId, courseId: updated.id }, targetId: updated.id, before: courseSummary(current), after: courseSummary(updated), mutated: true });
    } });
  }

  assignInstructorToCourse(context: AdminRequestContext, command: AssignInstructorToCourseCommand): Promise<AdminM2CommandResult<CourseInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.course_instructor_assignments.assign", permission: "admin.platform.admin.write", validate: () => validateAssignInstructorToCourseCommand(command), targetType: "course_instructor_assignment", scopeKind:"brand", resultKeys: ["brandId", "courseId", "instructorId"], fingerprintData: { brandId: command.brandId, courseId: command.courseId, instructorId: command.instructorId }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const course = await transaction.lockBrandCourse(command.brandId, command.courseId); const instructor = await transaction.lockInstructor(command.instructorId); const brandInstructor = await transaction.lockBrandInstructor(command.brandId, command.instructorId); const existing = await transaction.lockCourseInstructor(command.brandId, command.courseId, command.instructorId);
      const policy = validateAssignInstructorToCoursePolicy(context.correlationId, { brandExists: true, brandIsActive: true, instructorExists: Boolean(instructor), instructorStatus: instructor?.status ?? "inactive", associationStatus: brandInstructor?.status, courseExistsInBrand: Boolean(course), courseStatus: course?.status, brandInstructorStatus: brandInstructor?.status, courseInstructorStatus: existing?.status }); if (!policy.ok) return policy;
      const created = await transaction.insertCourseInstructor({ brandId: command.brandId, courseId: command.courseId, instructorId: command.instructorId });
      return ok({ data: { brandId: created.brandId, courseId: created.courseId, instructorId: created.instructorId }, targetId: created.id, before: null, after: courseInstructorSummary(created), mutated: true });
    } });
  }

  setCourseInstructorStatus(context: AdminRequestContext, command: SetCourseInstructorStatusCommand): Promise<AdminM2CommandResult<CourseInstructorCommandResult>> {
    return this.execute({ context, command, commandName: "admin.m2.course_instructor_assignments.set_status", permission: "admin.platform.admin.write", validate: () => validateSetCourseInstructorStatusCommand(command), targetType: "course_instructor_assignment", scopeKind:"brand", resultKeys: ["brandId", "courseId", "instructorId"], fingerprintData: { brandId: command.brandId, courseId: command.courseId, instructorId: command.instructorId, status: command.status }, mutate: async (transaction) => {
      if (command.brandId !== context.brand.brandId) return fail(targetNotFound(context.correlationId));
      const course = await transaction.lockBrandCourse(command.brandId, command.courseId); const instructor = await transaction.lockInstructor(command.instructorId); const brandInstructor = await transaction.lockBrandInstructor(command.brandId, command.instructorId); const current = await transaction.lockCourseInstructor(command.brandId, command.courseId, command.instructorId);
      if (!course || !instructor || !current) return fail(targetNotFound(context.correlationId));
      if (!versionMatches(command, current.version)) return fail(conflict(context.correlationId, "expected_version_mismatch"));
      if (command.status === "active" && (instructor.status !== "active" || brandInstructor?.status !== "active")) return fail(adminCoreError("policy_validation_failed", "The command policy rejected the requested state.", context.correlationId));
      if (current.status === command.status) return ok({ data: { brandId: current.brandId, courseId: current.courseId, instructorId: current.instructorId }, targetId: current.id, before: courseInstructorSummary(current), after: courseInstructorSummary(current), mutated: false });
      const updated = await transaction.updateCourseInstructorStatus({ id: current.id, status: command.status });
      return ok({ data: { brandId: updated.brandId, courseId: updated.courseId, instructorId: updated.instructorId }, targetId: updated.id, before: courseInstructorSummary(current), after: courseInstructorSummary(updated), mutated: true });
    } });
  }
}
