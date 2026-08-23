import { Pool } from "pg";
import type { AdminCoreError } from "../../core/errors";
import { adminCoreError } from "../../core/errors";
import type {
  AdminM2ActionEvidence, AdminM2BrandCourseState, AdminM2BrandInstructorState,
  AdminM2CourseInstructorState, AdminM2IdempotencyIdentity, AdminM2InstructorState,
  AdminM2Receipt, AdminM2WriteTransaction, AdminM2WriteTransactionRunner,
} from "../../core/repositories";
import { fail, ok, type Result } from "../../shared";
import { requiredPersistenceTimestamp } from "../supabase/repositories/persistence-timestamp";
import { resolvePostgresPoolConfiguration } from "./postgres-pool-config";
import type { SupabaseBoundaryEnvironment } from "../supabase/supabase-config";

export interface PgWriteQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> { readonly rows: readonly Row[]; }
export interface PgWriteClientLike { query<Row extends Record<string, unknown> = Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<PgWriteQueryResult<Row>>; release(): void; }
export interface PgWritePoolLike { connect(): Promise<PgWriteClientLike>; end(): Promise<void>; }
export type PostgresWritePoolFactory = (configuration: ConstructorParameters<typeof Pool>[0]) => PgWritePoolLike;

class PostgresAdminM2WriteError extends Error {
  constructor(readonly kind: "persistence" | "evidence" | "idempotency_race" | "conflict" | "not_found", readonly constraint?: string) { super("The Admin M2 transaction failed."); }
}
function providerFacts(error: unknown): { code: string; constraint: string } {
  if (!error || typeof error !== "object") return { code: "", constraint: "" };
  return { code: "code" in error ? String(error.code) : "", constraint: "constraint" in error ? String(error.constraint) : "" };
}
function translated(error: unknown): PostgresAdminM2WriteError {
  if (error instanceof PostgresAdminM2WriteError) return error;
  const facts = providerFacts(error);
  if (facts.code === "23505" && facts.constraint === "admin_actions_idempotency_key") return new PostgresAdminM2WriteError("idempotency_race", facts.constraint);
  if (facts.code === "23505") return new PostgresAdminM2WriteError("conflict", facts.constraint);
  if (facts.code === "23503") return new PostgresAdminM2WriteError("not_found", facts.constraint);
  return new PostgresAdminM2WriteError("persistence", facts.constraint);
}
function requiredString(row: Record<string, unknown>, key: string): string { const value = row[key]; if (typeof value !== "string" || !value) throw new PostgresAdminM2WriteError("persistence"); return value; }
function nullableString(row: Record<string, unknown>, key: string): string | null { const value = row[key]; if (value === null || value === undefined) return null; if (typeof value !== "string") throw new PostgresAdminM2WriteError("persistence"); return value; }
function objectValue(row: Record<string, unknown>, key: string): Readonly<Record<string, unknown>> { const value = row[key]; if (!value || typeof value !== "object" || Array.isArray(value)) throw new PostgresAdminM2WriteError("persistence"); return value as Readonly<Record<string, unknown>>; }
function status(value: unknown): "active" | "inactive" { if (value === "active" || value === "inactive") return value; throw new PostgresAdminM2WriteError("persistence"); }
function courseStatus(value: unknown): "draft" | "published" | "archived" { if (value === "draft" || value === "published" || value === "archived") return value; throw new PostgresAdminM2WriteError("persistence"); }
function courseScope(value: unknown): "curriculum" | "standalone" { if (value === "curriculum" || value === "standalone") return value; throw new PostgresAdminM2WriteError("persistence"); }
function instructor(row: Record<string, unknown>): AdminM2InstructorState { return { id: requiredString(row, "id"), displayName: requiredString(row, "display_name"), professionalTitle: nullableString(row, "professional_title"), status: status(row.status), updatedAt: requiredPersistenceTimestamp(row.updated_at) }; }
function brandInstructor(row: Record<string, unknown>): AdminM2BrandInstructorState { return { id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), instructorId: requiredString(row, "instructor_id"), status: status(row.status), updatedAt: requiredPersistenceTimestamp(row.updated_at) }; }
function brandCourse(row: Record<string, unknown>): AdminM2BrandCourseState { return { id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), academicModuleId: nullableString(row, "academic_module_id"), courseCode: requiredString(row, "course_code"), title: requiredString(row, "title"), courseScope: courseScope(row.course_scope), status: courseStatus(row.status), updatedAt: requiredPersistenceTimestamp(row.updated_at) }; }
function courseInstructor(row: Record<string, unknown>): AdminM2CourseInstructorState { return { id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), courseId: requiredString(row, "course_id"), instructorId: requiredString(row, "instructor_id"), status: status(row.status), updatedAt: requiredPersistenceTimestamp(row.updated_at) }; }
function receipt(row: Record<string, unknown>): AdminM2Receipt { return { adminActionId: requiredString(row, "admin_action_id"), auditLogId: requiredString(row, "audit_log_id"), commandFingerprint: requiredString(row, "command_fingerprint"), resultSummary: objectValue(row, "result_summary") }; }
const instructorColumns = "id, display_name, professional_title, status, updated_at";
const brandInstructorColumns = "id, brand_id, instructor_id, status, updated_at";
const brandCourseColumns = "id, brand_id, academic_module_id, course_code, title, course_scope, status, updated_at";
const courseInstructorColumns = "id, course_id, brand_id, instructor_id, status, updated_at";

class PostgresAdminM2WriteTransaction implements AdminM2WriteTransaction {
  constructor(private readonly client: PgWriteClientLike) {}
  private async one<Row extends Record<string, unknown>>(text: string, values: readonly unknown[]): Promise<Row | null> { try { return (await this.client.query<Row>(text, values)).rows[0] ?? null; } catch (error) { throw translated(error); } }
  async lockExecutionIdentity(input: { brandId: string; adminProfileId: string }): Promise<boolean> { return Boolean(await this.one(`select eb.id from app.educational_brands eb join app.admin_profiles ap on ap.brand_id = eb.id where eb.id = $1 and eb.status = 'active' and ap.id = $2 and ap.status = 'active' for update of eb, ap`, [input.brandId, input.adminProfileId])); }
  async findReceipt(input: AdminM2IdempotencyIdentity): Promise<AdminM2Receipt | null> { const row = await this.one(`select aa.id as admin_action_id, al.id as audit_log_id, aa.command_fingerprint, aa.result_summary from app.admin_actions aa join app.audit_logs al on al.admin_action_id = aa.id where aa.brand_id = $1 and aa.admin_profile_id = $2 and aa.command_name = $3 and aa.idempotency_key = $4`, [input.brandId, input.adminProfileId, input.commandName, input.idempotencyKey]); return row ? receipt(row) : null; }
  async lockInstructor(id: string): Promise<AdminM2InstructorState | null> { const row = await this.one(`select ${instructorColumns} from app.instructors where id = $1 for update`, [id]); return row ? instructor(row) : null; }
  async lockAcademicModule(id: string): Promise<boolean> { return Boolean(await this.one(`select id from app.academic_modules where id = $1 for update`, [id])); }
  async lockBrandInstructor(brandId: string, instructorId: string): Promise<AdminM2BrandInstructorState | null> { const row = await this.one(`select ${brandInstructorColumns} from app.brand_instructors where brand_id = $1 and instructor_id = $2 for update`, [brandId, instructorId]); return row ? brandInstructor(row) : null; }
  async lockBrandCourse(brandId: string, courseId: string): Promise<AdminM2BrandCourseState | null> { const row = await this.one(`select ${brandCourseColumns} from app.brand_courses where brand_id = $1 and id = $2 for update`, [brandId, courseId]); return row ? brandCourse(row) : null; }
  async lockBrandCourseByCode(brandId: string, courseCode: string): Promise<AdminM2BrandCourseState | null> { const row = await this.one(`select ${brandCourseColumns} from app.brand_courses where brand_id = $1 and course_code = $2 for update`, [brandId, courseCode]); return row ? brandCourse(row) : null; }
  async lockCourseInstructor(brandId: string, courseId: string, instructorId: string): Promise<AdminM2CourseInstructorState | null> { const row = await this.one(`select ${courseInstructorColumns} from app.course_instructors where brand_id = $1 and course_id = $2 and instructor_id = $3 for update`, [brandId, courseId, instructorId]); return row ? courseInstructor(row) : null; }
  async insertInstructor(input: { displayName: string; professionalTitle: string | null }): Promise<AdminM2InstructorState> { const row = await this.one(`insert into app.instructors (display_name, professional_title) values ($1, $2) returning ${instructorColumns}`, [input.displayName, input.professionalTitle]); if (!row) throw new PostgresAdminM2WriteError("persistence"); return instructor(row); }
  async updateInstructor(input: { id: string; displayName: string; professionalTitle: string | null; status: "active" | "inactive" }): Promise<AdminM2InstructorState> { const row = await this.one(`update app.instructors set display_name = $2, professional_title = $3, status = $4 where id = $1 returning ${instructorColumns}`, [input.id, input.displayName, input.professionalTitle, input.status]); if (!row) throw new PostgresAdminM2WriteError("not_found"); return instructor(row); }
  async insertBrandInstructor(input: { brandId: string; instructorId: string }): Promise<AdminM2BrandInstructorState> { const row = await this.one(`insert into app.brand_instructors (brand_id, instructor_id) values ($1, $2) returning ${brandInstructorColumns}`, [input.brandId, input.instructorId]); if (!row) throw new PostgresAdminM2WriteError("persistence"); return brandInstructor(row); }
  async updateBrandInstructorStatus(input: { id: string; status: "active" | "inactive" }): Promise<AdminM2BrandInstructorState> { const row = await this.one(`update app.brand_instructors set status = $2 where id = $1 returning ${brandInstructorColumns}`, [input.id, input.status]); if (!row) throw new PostgresAdminM2WriteError("not_found"); return brandInstructor(row); }
  async insertBrandCourse(input: { brandId: string; academicModuleId: string | null; courseCode: string; title: string; courseScope: "curriculum" | "standalone" }): Promise<AdminM2BrandCourseState> { const row = await this.one(`insert into app.brand_courses (brand_id, academic_module_id, course_code, title, course_scope) values ($1, $2, $3, $4, $5) returning ${brandCourseColumns}`, [input.brandId, input.academicModuleId, input.courseCode, input.title, input.courseScope]); if (!row) throw new PostgresAdminM2WriteError("persistence"); return brandCourse(row); }
  async updateBrandCourse(input: { id: string; academicModuleId: string | null; title: string; courseScope: "curriculum" | "standalone"; status: "draft" | "published" | "archived" }): Promise<AdminM2BrandCourseState> { const row = await this.one(`update app.brand_courses set academic_module_id = $2, title = $3, course_scope = $4, status = $5 where id = $1 returning ${brandCourseColumns}`, [input.id, input.academicModuleId, input.title, input.courseScope, input.status]); if (!row) throw new PostgresAdminM2WriteError("not_found"); return brandCourse(row); }
  async insertCourseInstructor(input: { brandId: string; courseId: string; instructorId: string }): Promise<AdminM2CourseInstructorState> { const row = await this.one(`insert into app.course_instructors (brand_id, course_id, instructor_id) values ($1, $2, $3) returning ${courseInstructorColumns}`, [input.brandId, input.courseId, input.instructorId]); if (!row) throw new PostgresAdminM2WriteError("persistence"); return courseInstructor(row); }
  async updateCourseInstructorStatus(input: { id: string; status: "active" | "inactive" }): Promise<AdminM2CourseInstructorState> { const row = await this.one(`update app.course_instructors set status = $2 where id = $1 returning ${courseInstructorColumns}`, [input.id, input.status]); if (!row) throw new PostgresAdminM2WriteError("not_found"); return courseInstructor(row); }
  async writeEvidence(input: AdminM2ActionEvidence): Promise<{ adminActionId: string; auditLogId: string }> {
    try {
      const action = await this.client.query<{ id: string }>(`insert into app.admin_actions (brand_id, admin_profile_id, command_name, target_type, target_id, reason, correlation_id, request_id, idempotency_key, command_fingerprint, policy_set_id, expected_version, result_summary, metadata) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb) returning id`, [input.identity.brandId, input.identity.adminProfileId, input.identity.commandName, input.targetType, input.targetId, input.reason, input.correlationId, input.requestId ?? null, input.identity.idempotencyKey, input.commandFingerprint, input.policySetId ?? null, input.expectedVersion ?? null, JSON.stringify(input.resultSummary), JSON.stringify(input.metadata)]);
      const adminActionId = action.rows[0]?.id; if (!adminActionId) throw new PostgresAdminM2WriteError("evidence");
      const audit = await this.client.query<{ id: string }>(`insert into app.audit_logs (admin_action_id, brand_id, admin_profile_id, action, target_type, target_id, reason, correlation_id, idempotency_key, before_summary, after_summary, metadata) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb) returning id`, [adminActionId, input.identity.brandId, input.identity.adminProfileId, input.identity.commandName, input.targetType, input.targetId, input.reason, input.correlationId, input.identity.idempotencyKey, input.beforeSummary === null ? null : JSON.stringify(input.beforeSummary), JSON.stringify(input.afterSummary), JSON.stringify(input.metadata)]);
      const auditLogId = audit.rows[0]?.id; if (!auditLogId) throw new PostgresAdminM2WriteError("evidence");
      return { adminActionId, auditLogId };
    } catch (error) {
      const mapped = translated(error); if (mapped.kind === "idempotency_race") throw mapped; throw new PostgresAdminM2WriteError("evidence", mapped.constraint);
    }
  }
}

function coreFailure(error: PostgresAdminM2WriteError, correlationId: string): AdminCoreError {
  if (error.kind === "idempotency_race") return adminCoreError("conflict", "The administrative command raced with another request.", correlationId, { reason: "idempotency_race" });
  if (error.kind === "conflict") return adminCoreError("conflict", "The requested change conflicts with the current state.", correlationId);
  if (error.kind === "not_found") return adminCoreError("target_not_found", "The requested target was not found.", correlationId);
  if (error.kind === "evidence") return adminCoreError("audit_write_failed", "The administrative evidence could not be written.", correlationId);
  return adminCoreError("persistence_failed", "The administrative transaction could not be completed.", correlationId);
}

export class PostgresAdminM2WriteTransactionRunner implements AdminM2WriteTransactionRunner {
  private closePromise: Promise<void> | undefined;
  constructor(private readonly pool: PgWritePoolLike) {}
  async run<T>(correlationId: string, work: (transaction: AdminM2WriteTransaction) => Promise<Result<T, AdminCoreError>>): Promise<Result<T, AdminCoreError>> {
    let client: PgWriteClientLike | undefined; let begun = false;
    try {
      client = await this.pool.connect(); await client.query("BEGIN"); begun = true;
      const result = await work(new PostgresAdminM2WriteTransaction(client));
      if (!result.ok) { await client.query("ROLLBACK"); begun = false; return result; }
      await client.query("COMMIT"); begun = false; return result;
    } catch (error) {
      if (client && begun) { try { await client.query("ROLLBACK"); } catch { /* preserve the original sanitized failure */ } }
      return fail(coreFailure(translated(error), correlationId));
    } finally { client?.release(); }
  }
  async findCommittedReceipt(identity: AdminM2IdempotencyIdentity, correlationId: string): Promise<Result<AdminM2Receipt | null, AdminCoreError>> {
    let client: PgWriteClientLike | undefined;
    try { client = await this.pool.connect(); const transaction = new PostgresAdminM2WriteTransaction(client); return ok(await transaction.findReceipt(identity)); }
    catch (error) { return fail(coreFailure(translated(error), correlationId)); }
    finally { client?.release(); }
  }
  close(): Promise<void> { if (!this.closePromise) this.closePromise = this.pool.end().catch(() => { throw new Error("The Admin M2 write pool could not be closed."); }); return this.closePromise; }
}

export function createPostgresAdminM2WriteTransactionRunner(environment: SupabaseBoundaryEnvironment = process.env, poolFactory: PostgresWritePoolFactory = (configuration) => new Pool(configuration)): PostgresAdminM2WriteTransactionRunner {
  const configuration = resolvePostgresPoolConfiguration(environment);
  return new PostgresAdminM2WriteTransactionRunner(poolFactory({ connectionString: configuration.connectionString, max: configuration.max, idleTimeoutMillis: configuration.idleTimeoutMillis, connectionTimeoutMillis: configuration.connectionTimeoutMillis }));
}
