import type { AdminSensitiveCommandMetadata } from "../../../contracts/admin";
import { createTestAdminRequestContext } from "../../../core/context";
import { InMemoryAdminPermissionResolver } from "../../../core/permissions";
import type {
  AdminM2ActionEvidence, AdminM2BrandCourseState, AdminM2BrandInstructorState, AdminM2CourseInstructorState,
  AdminM2IdempotencyIdentity, AdminM2InstructorState, AdminM2Receipt, AdminM2WriteTransaction,
  AdminM2WriteTransactionRunner,
} from "../../../core/repositories";
import { ok, type Result } from "../../../shared";
import { adminCoreError, type AdminCoreError } from "../../../core/errors";
import { createAdminM2CommandFingerprint, TransactionalAdminM2CommandExecutor } from "./admin-m2-command-executor";

export interface AdminM2CommandExecutorSelfTestResult { readonly passed: boolean; readonly cases: readonly { readonly name: string; readonly passed: boolean; readonly details?: string }[]; }
const brandId = "10000000-0000-4000-8000-000000000001";
const adminProfileId = "10000000-0000-4000-8000-000000000002";
const moduleId = "10000000-0000-4000-8000-000000000003";
const now = "2026-08-23T12:00:00.000Z";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function metadata(key: string, expectedVersion?: string): AdminSensitiveCommandMetadata { return { platform: { platformId: brandId, platformCode: "medway" }, reason: "Controlled command self-test.", correlationId: "m2-write-selftest", idempotencyKey: key, expectedVersion }; }

class MemoryTransaction implements AdminM2WriteTransaction {
  readonly receipts = new Map<string, AdminM2Receipt>(); readonly evidence: AdminM2ActionEvidence[] = [];
  readonly instructors = new Map<string, AdminM2InstructorState>(); readonly brandInstructors = new Map<string, AdminM2BrandInstructorState>(); readonly courses = new Map<string, AdminM2BrandCourseState>(); readonly courseInstructors = new Map<string, AdminM2CourseInstructorState>();
  counter = 10;
  key(input: AdminM2IdempotencyIdentity): string { return `${input.brandId}:${input.adminProfileId}:${input.commandName}:${input.idempotencyKey}`; }
  async lockExecutionIdentity(input: { brandId: string; adminProfileId: string }): Promise<boolean> { return input.brandId === brandId && input.adminProfileId === adminProfileId; }
  async findReceipt(input: AdminM2IdempotencyIdentity): Promise<AdminM2Receipt | null> { return this.receipts.get(this.key(input)) ?? null; }
  async lockInstructor(id: string): Promise<AdminM2InstructorState | null> { return this.instructors.get(id) ?? null; }
  async lockAcademicModule(id: string): Promise<boolean> { return id === moduleId; }
  async lockBrandInstructor(scope: string, instructorId: string): Promise<AdminM2BrandInstructorState | null> { return this.brandInstructors.get(`${scope}:${instructorId}`) ?? null; }
  async lockBrandCourse(scope: string, courseId: string): Promise<AdminM2BrandCourseState | null> { const value = this.courses.get(courseId); return value?.brandId === scope ? value : null; }
  async lockBrandCourseByCode(scope: string, code: string): Promise<AdminM2BrandCourseState | null> { return [...this.courses.values()].find((item) => item.brandId === scope && item.courseCode === code) ?? null; }
  async lockCourseInstructor(scope: string, courseId: string, instructorId: string): Promise<AdminM2CourseInstructorState | null> { return this.courseInstructors.get(`${scope}:${courseId}:${instructorId}`) ?? null; }
  id(): string { return `20000000-0000-4000-8000-${String(this.counter++).padStart(12, "0")}`; }
  async insertInstructor(input: { displayName: string; professionalTitle: string | null }): Promise<AdminM2InstructorState> { const value = { id: this.id(), ...input, status: "active" as const, updatedAt: now }; this.instructors.set(value.id, value); return value; }
  async updateInstructor(input: { id: string; displayName: string; professionalTitle: string | null; status: "active" | "inactive" }): Promise<AdminM2InstructorState> { const value = { ...input, updatedAt: now }; this.instructors.set(value.id, value); return value; }
  async insertBrandInstructor(input: { brandId: string; instructorId: string }): Promise<AdminM2BrandInstructorState> { const value = { id: this.id(), ...input, status: "active" as const, updatedAt: now }; this.brandInstructors.set(`${input.brandId}:${input.instructorId}`, value); return value; }
  async updateBrandInstructorStatus(input: { id: string; status: "active" | "inactive" }): Promise<AdminM2BrandInstructorState> { const current = [...this.brandInstructors.values()].find((item) => item.id === input.id)!; const value = { ...current, status: input.status, updatedAt: now }; this.brandInstructors.set(`${value.brandId}:${value.instructorId}`, value); return value; }
  async insertBrandCourse(input: { brandId: string; academicModuleId: string | null; courseCode: string; title: string; courseScope: "curriculum" | "standalone" }): Promise<AdminM2BrandCourseState> { const value = { id: this.id(), ...input, status: "draft" as const, updatedAt: now }; this.courses.set(value.id, value); return value; }
  async updateBrandCourse(input: { id: string; academicModuleId: string | null; title: string; courseScope: "curriculum" | "standalone"; status: "draft" | "published" | "archived" }): Promise<AdminM2BrandCourseState> { const current = this.courses.get(input.id)!; const value = { ...current, ...input, updatedAt: now }; this.courses.set(value.id, value); return value; }
  async insertCourseInstructor(input: { brandId: string; courseId: string; instructorId: string }): Promise<AdminM2CourseInstructorState> { const value = { id: this.id(), ...input, status: "active" as const, updatedAt: now }; this.courseInstructors.set(`${input.brandId}:${input.courseId}:${input.instructorId}`, value); return value; }
  async updateCourseInstructorStatus(input: { id: string; status: "active" | "inactive" }): Promise<AdminM2CourseInstructorState> { const current = [...this.courseInstructors.values()].find((item) => item.id === input.id)!; const value = { ...current, status: input.status, updatedAt: now }; this.courseInstructors.set(`${value.brandId}:${value.courseId}:${value.instructorId}`, value); return value; }
  async writeEvidence(input: AdminM2ActionEvidence): Promise<{ adminActionId: string; auditLogId: string }> { this.evidence.push(input); const stored = { adminActionId: this.id(), auditLogId: this.id(), commandFingerprint: input.commandFingerprint, resultSummary: input.resultSummary }; this.receipts.set(this.key(input.identity), stored); return { adminActionId: stored.adminActionId, auditLogId: stored.auditLogId }; }
}
class MemoryRunner implements AdminM2WriteTransactionRunner {
  runs = 0; closes = 0; raceNext = false; raceWinner: AdminM2Receipt | null = null; constructor(readonly transaction = new MemoryTransaction()) {}
  async run<T>(correlationId: string, work: (transaction: AdminM2WriteTransaction) => Promise<Result<T, AdminCoreError>>): Promise<Result<T, AdminCoreError>> { this.runs += 1; if (this.raceNext) { this.raceNext = false; return { ok: false, error: adminCoreError("conflict", "Race.", correlationId, { reason: "idempotency_race" }) }; } return work(this.transaction); }
  async findCommittedReceipt(identity: AdminM2IdempotencyIdentity): Promise<Result<AdminM2Receipt | null, AdminCoreError>> { return ok(this.raceWinner ?? await this.transaction.findReceipt(identity)); }
  async close(): Promise<void> { this.closes += 1; }
}

export async function runAdminM2CommandExecutorSelfTest(): Promise<AdminM2CommandExecutorSelfTestResult> {
  const cases: { name: string; passed: boolean; details?: string }[] = [];
  const record = async (name: string, run: () => Promise<void> | void) => { try { await run(); cases.push({ name, passed: true }); } catch (error) { cases.push({ name, passed: false, details: error instanceof Error ? error.message : "Unexpected failure" }); } };
  const permissions = ["admin.instructors.create", "admin.instructors.update", "admin.brand_instructors.assign", "admin.brand_instructors.update", "admin.brand_courses.create", "admin.brand_courses.update", "admin.course_instructors.assign", "admin.course_instructors.update"] as const;
  const context = createTestAdminRequestContext({ brandId, brandCode: "medway", adminProfileId, correlationId: "m2-write-selftest", permissions });
  const runner = new MemoryRunner(); const executor = new TransactionalAdminM2CommandExecutor(runner, new InMemoryAdminPermissionResolver());
  let instructorId = ""; let courseId = "";
  await record("fingerprints are stable under recursive key ordering", () => { const first = createAdminM2CommandFingerprint({ b: { y: 2, x: 1 }, a: 1 }); const second = createAdminM2CommandFingerprint({ a: 1, b: { x: 1, y: 2 } }); assert(first === second && /^v1:sha256:[0-9a-f]{64}$/.test(first), "fingerprint is not canonical"); assert(first !== createAdminM2CommandFingerprint({ a: 2, b: { x: 1, y: 2 } }), "semantic changes must change the fingerprint"); });
  await record("trusted Admin profile aliases cannot diverge", () => { try { createTestAdminRequestContext({ brandId, adminProfileId, adminUserId: "10000000-0000-4000-8000-000000000099" }); throw new Error("mismatched aliases were accepted"); } catch (error) { assert(error instanceof Error && error.message.includes("aliases"), "alias mismatch did not fail safely"); } });
  await record("all ten command methods preserve policies and atomic evidence semantics", async () => {
    const createdInstructor = await executor.createInstructor(context, { metadata: metadata("01"), displayName: "  Dr. Example  ", professionalTitle: " Professor " }); assert(createdInstructor.ok && createdInstructor.value.mutated, "instructor create failed"); instructorId = createdInstructor.value.data.instructorId;
    const updatedInstructor = await executor.updateInstructor(context, { metadata: metadata("02"), instructorId, displayName: "Dr. Updated" }); assert(updatedInstructor.ok && updatedInstructor.value.mutated, "instructor update failed");
    const instructorNoop = await executor.setInstructorStatus(context, { metadata: metadata("03"), instructorId, status: "active" }); assert(instructorNoop.ok && !instructorNoop.value.mutated && !instructorNoop.value.adminActionId, "same status must be an evidence-free no-op");
    const brandAssigned = await executor.assignInstructorToBrand(context, { metadata: metadata("04"), brandId, instructorId }); assert(brandAssigned.ok && brandAssigned.value.mutated, "brand assignment failed");
    const brandNoop = await executor.setBrandInstructorStatus(context, { metadata: metadata("05"), brandId, instructorId, status: "active" }); assert(brandNoop.ok && !brandNoop.value.mutated, "brand status no-op failed");
    const course = await executor.createBrandCourse(context, { metadata: metadata("06"), brandId, courseCode: " MED-101 ", title: " Course ", courseScope: "curriculum", academicModuleId: moduleId, status: "draft" }); assert(course.ok && course.value.mutated, "course create failed"); courseId = course.value.data.courseId;
    const courseUpdate = await executor.updateBrandCourse(context, { metadata: metadata("07"), brandId, courseId, title: "Updated Course" }); assert(courseUpdate.ok && courseUpdate.value.mutated, "course update failed");
    const publish = await executor.setBrandCourseStatus(context, { metadata: metadata("08"), brandId, courseId, status: "published" }); assert(publish.ok && publish.value.mutated, "course publish failed");
    const assigned = await executor.assignInstructorToCourse(context, { metadata: metadata("09"), brandId, courseId, instructorId }); assert(assigned.ok && assigned.value.mutated, "course assignment failed");
    const assignmentStatus = await executor.setCourseInstructorStatus(context, { metadata: metadata("10"), brandId, courseId, instructorId, status: "inactive" }); assert(assignmentStatus.ok && assignmentStatus.value.mutated, "course assignment status failed");
    assert(runner.transaction.evidence.length === 8, "only eight actual mutations should have evidence");
    assert(runner.transaction.evidence.every((item) => item.identity.adminProfileId === adminProfileId && item.afterSummary && JSON.stringify(item).length < 16 * 1024), "evidence identity or bounds failed");
  });
  await record("matching retries replay and mismatched retries are rejected", async () => {
    const command = { metadata: metadata("replay"), displayName: "Replay Instructor" } as const;
    const first = await executor.createInstructor(context, command); const evidenceCount = runner.transaction.evidence.length; const second = await executor.createInstructor(context, command);
    assert(first.ok && second.ok && second.value.replayed && !second.value.mutated, "matching retry did not replay"); assert(runner.transaction.evidence.length === evidenceCount, "replay created duplicate evidence");
    const mismatch = await executor.createInstructor(context, { ...command, displayName: "Different" }); assert(!mismatch.ok && mismatch.error.code === "idempotency_key_reused", "mismatched retry was not rejected");
  });
  await record("brand courses permit repeated module placement and standalone null modules", async () => {
    const sameModule = await executor.createBrandCourse(context, { metadata: metadata("same-module"), brandId, courseCode: "MED-102", title: "Second Module Offering", courseScope: "curriculum", academicModuleId: moduleId, status: "draft" });
    const standalone = await executor.createBrandCourse(context, { metadata: metadata("standalone"), brandId, courseCode: "EXTRA-1", title: "Standalone", courseScope: "standalone", academicModuleId: null, status: "draft" });
    assert(sameModule.ok && standalone.ok, "valid course multiplicity or standalone course was rejected");
  });
  await record("an idempotency race resolves only through the committed winner", async () => {
    const command = { metadata: metadata("race"), displayName: "Race Winner" } as const;
    const commandFingerprint = createAdminM2CommandFingerprint({ commandName: "admin.m2.instructors.create", brandId, reason: "Controlled command self-test.", expectedVersion: null, displayName: "Race Winner", professionalTitle: null });
    runner.raceWinner = { adminActionId: "30000000-0000-4000-8000-000000000001", auditLogId: "30000000-0000-4000-8000-000000000002", commandFingerprint, resultSummary: { instructorId: "30000000-0000-4000-8000-000000000003" } };
    runner.raceNext = true; const raced = await executor.createInstructor(context, command);
    assert(raced.ok && raced.value.replayed && raced.value.data.instructorId === "30000000-0000-4000-8000-000000000003", "race winner was not replayed");
    runner.raceWinner = null;
  });
  await record("invalid authority and expected versions fail safely", async () => {
    const before = runner.runs; const invalidContext = createTestAdminRequestContext({ brandId, brandCode: "medway", adminProfileId, correlationId: "m2-write-selftest", permissions: [] });
    const denied = await executor.createInstructor(invalidContext, { metadata: metadata("denied"), displayName: "Denied" }); assert(!denied.ok && denied.error.code === "permission_denied" && runner.runs === before, "permission failure reached transaction");
    const oversized = await executor.createInstructor(context, { metadata: metadata("x".repeat(256)), displayName: "Oversized" }); assert(!oversized.ok && oversized.error.code === "validation_failed" && runner.runs === before, "oversized metadata reached transaction");
    const versioned = await executor.updateInstructor(context, { metadata: metadata("version", "wrong-version"), instructorId, displayName: "Conflict" }); assert(!versioned.ok && versioned.error.code === "conflict", "expected-version mismatch was not rejected");
    const crossBrand = await executor.createBrandCourse(context, { metadata: metadata("cross"), brandId: "10000000-0000-4000-8000-000000000099", courseCode: "X", title: "X", courseScope: "standalone", academicModuleId: null, status: "draft" }); assert(!crossBrand.ok && crossBrand.error.code === "target_not_found", "cross-brand command leaked state");
  });
  await record("archived courses remain terminal", async () => {
    const archived = await executor.setBrandCourseStatus(context, { metadata: metadata("archive"), brandId, courseId, status: "archived" }); assert(archived.ok, "archive failed");
    const reopen = await executor.setBrandCourseStatus(context, { metadata: metadata("reopen"), brandId, courseId, status: "draft" }); assert(!reopen.ok && reopen.error.code === "lifecycle_transition_denied", "archived course reopened");
  });
  return { passed: cases.every((item) => item.passed), cases };
}

if (process.argv[1]?.endsWith("admin-m2-command-executor.selftest.js")) runAdminM2CommandExecutorSelfTest().then((result) => { if (!result.passed) throw new Error(JSON.stringify(result.cases.filter((item) => !item.passed))); console.log("admin M2 command executor selftest passed"); });
