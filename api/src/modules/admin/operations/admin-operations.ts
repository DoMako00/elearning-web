import { Pool } from "pg";
import type { Pool as PgPool } from "pg";
import { resolvePostgresPoolConfiguration } from "../../../infrastructure/postgres/postgres-pool-config";
import type { PostgresWritePoolFactory } from "../../../infrastructure/postgres";
import type { SupabaseBoundaryEnvironment } from "../../../infrastructure/supabase/supabase-config";

export type ManualSubscriptionPlanCode = "single_course_manual" | "oct10_four_subjects_individual" | "oct10_four_subjects_group3" | "oct10_four_subjects_group5";
export type ManualOrderStatus = "pending_review" | "approved" | "rejected" | "cancelled";

export interface ManualSubscriptionPlan {
  readonly code: ManualSubscriptionPlanCode;
  readonly title: string;
  readonly description: string;
  readonly currency: "EGP";
  readonly pricePerStudent: number | null;
  readonly listPricePerStudent: number | null;
  readonly studentCount: 1 | 3 | 5;
  readonly subjectCount: number;
  readonly promoEndsOn: string | null;
  readonly requiresManualPrice: boolean;
}

export interface CreateStudentInput {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly brandCode: "medway" | "elite" | "nexus";
  readonly academicInstitutionCode: "buc" | "delta";
  readonly academicLevelNumber: number;
  readonly academicSemesterNumber: number;
  readonly studentCode?: string;
  readonly programLabel?: string;
  readonly expectedGraduationDate?: string;
}

export interface CreateManualOrderInput {
  readonly studentProfileId: string;
  readonly brandCode: "medway" | "elite" | "nexus";
  readonly planCode: ManualSubscriptionPlanCode;
  readonly courseIds: readonly string[];
  readonly pricePerStudent?: number;
  readonly paymentMethod: "bank_transfer" | "cash" | "wallet" | "other";
  readonly paymentReference?: string;
  readonly paymentEvidenceNote?: string;
}

export interface ReviewManualOrderInput { readonly orderId: string; readonly reason: string; }
export interface AdminOperationContext { readonly adminProfileId: string; readonly correlationId: string; }
export interface OperationResult<T> { readonly ok: true; readonly value: T; }
export interface OperationFailure { readonly ok: false; readonly status: 400 | 404 | 409 | 503; readonly code: string; readonly message: string; }
type Result<T> = OperationResult<T> | OperationFailure;

const plans: readonly ManualSubscriptionPlan[] = [
  { code: "single_course_manual", title: "Single subject manual subscription", description: "One selected subject. Price is entered by Admin until the standard price is finalized.", currency: "EGP", pricePerStudent: null, listPricePerStudent: null, studentCount: 1, subjectCount: 1, promoEndsOn: null, requiresManualPrice: true },
  { code: "oct10_four_subjects_individual", title: "October 10 offer - 4 subjects", description: "One student gets four selected subjects for 5,000 EGP instead of 6,000 EGP.", currency: "EGP", pricePerStudent: 5000, listPricePerStudent: 6000, studentCount: 1, subjectCount: 4, promoEndsOn: "2026-10-10", requiresManualPrice: false },
  { code: "oct10_four_subjects_group3", title: "October 10 group of 3", description: "Group-of-3 offer. Each student pays 4,700 EGP for four selected subjects.", currency: "EGP", pricePerStudent: 4700, listPricePerStudent: 6000, studentCount: 3, subjectCount: 4, promoEndsOn: "2026-10-10", requiresManualPrice: false },
  { code: "oct10_four_subjects_group5", title: "October 10 group of 5", description: "Group-of-5 offer. Each student pays 4,500 EGP for four selected subjects.", currency: "EGP", pricePerStudent: 4500, listPricePerStudent: 6000, studentCount: 5, subjectCount: 4, promoEndsOn: "2026-10-10", requiresManualPrice: false },
];
const planByCode = new Map(plans.map((plan) => [plan.code, plan]));
const trim = (value: string | undefined): string | undefined => { const normalized = value?.trim(); return normalized || undefined; };
const fail = (status: OperationFailure["status"], code: string, message: string): OperationFailure => ({ ok: false, status, code, message });
const ok = <T>(value: T): OperationResult<T> => ({ ok: true, value });

function poolFromEnvironment(environment: SupabaseBoundaryEnvironment, poolFactory?: PostgresWritePoolFactory): PgPool {
  const configuration = resolvePostgresPoolConfiguration(environment);
  const factory = poolFactory ?? ((input: ConstructorParameters<typeof Pool>[0]) => new Pool(input));
  return factory({ host: configuration.host, port: configuration.port, ...(configuration.user ? { user: configuration.user } : {}), ...(configuration.password ? { password: configuration.password } : {}), database: configuration.database, max: configuration.max, idleTimeoutMillis: configuration.idleTimeoutMillis, connectionTimeoutMillis: configuration.connectionTimeoutMillis, ssl: { rejectUnauthorized: true, ...(configuration.trustedRootCertificate ? { ca: configuration.trustedRootCertificate } : {}) } }) as PgPool;
}

export class AdminOperationsExecutor {
  private readonly pool: PgPool;
  private readonly supabaseUrl?: string;
  private readonly supabaseSecretKey?: string;

  constructor(environment: SupabaseBoundaryEnvironment = process.env, poolFactory?: PostgresWritePoolFactory) {
    this.pool = poolFromEnvironment(environment, poolFactory);
    this.supabaseUrl = trim(environment.SUPABASE_URL)?.replace(/\/+$/, "");
    this.supabaseSecretKey = trim(environment.SUPABASE_SECRET_KEY) ?? trim(environment.SUPABASE_SERVICE_ROLE_KEY);
  }

  listPlans(): readonly ManualSubscriptionPlan[] { return plans; }
  async close(): Promise<void> { await this.pool.end(); }

  async createStudent(_context: AdminOperationContext, input: CreateStudentInput): Promise<Result<Record<string, unknown>>> {
    const email = trim(input.email)?.toLowerCase();
    const password = input.password;
    const fullName = trim(input.fullName);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return fail(400, "invalid_input", "A valid student email is required.");
    if (!password || password.length < 8) return fail(400, "invalid_input", "A password of at least 8 characters is required.");
    if (!fullName) return fail(400, "invalid_input", "A student full name is required.");
    if (!this.supabaseUrl || !this.supabaseSecretKey) return fail(503, "auth_admin_not_configured", "SUPABASE_URL and SUPABASE_SECRET_KEY are required on the server to create student Auth accounts.");
    const placement = await this.resolvePlacement(input.brandCode, input.academicInstitutionCode, input.academicLevelNumber, input.academicSemesterNumber);
    if (!placement.ok) return placement;
    const auth = await this.createAuthUser(email, password, fullName);
    if (!auth.ok) return auth;
    let committed = false;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const appUser = await client.query<{ id: string }>("insert into app.app_users (auth_user_id, status) values ($1, 'active') returning id", [auth.value.authUserId]);
      const appUserId = appUser.rows[0]!.id;
      const membership = await client.query<{ id: string }>("insert into app.brand_memberships (app_user_id, brand_id, status) values ($1, $2, 'active') returning id", [appUserId, placement.value.brandId]);
      const membershipId = membership.rows[0]!.id;
      const student = await client.query<{ id: string }>("insert into app.student_profiles (brand_membership_id, app_user_id, brand_id, status) values ($1, $2, $3, 'active') returning id", [membershipId, appUserId, placement.value.brandId]);
      const studentProfileId = student.rows[0]!.id;
      await client.query("insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, student_code, academic_institution_id, academic_level_id, academic_semester_id, program_label, expected_graduation_date) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [studentProfileId, placement.value.brandId, fullName, email, trim(input.studentCode) ?? null, placement.value.institutionId, placement.value.levelId, placement.value.semesterId, trim(input.programLabel) ?? null, trim(input.expectedGraduationDate) ?? null]);
      await client.query("COMMIT");
      committed = true;
      return ok({ studentProfileId, appUserId, brandCode: input.brandCode, academicInstitutionCode: input.academicInstitutionCode });
    } catch {
      if (!committed) await client.query("ROLLBACK").catch(() => undefined);
      await this.deleteAuthUser(auth.value.authUserId).catch(() => undefined);
      return fail(409, "student_create_failed", "The student could not be created. Check for duplicate email, student code, or placement data.");
    } finally {
      client.release();
    }
  }

  async createManualOrder(context: AdminOperationContext, input: CreateManualOrderInput): Promise<Result<Record<string, unknown>>> {
    const plan = planByCode.get(input.planCode);
    if (!plan) return fail(400, "invalid_plan", "Select a valid subscription plan.");
    const pricePerStudent = plan.requiresManualPrice ? input.pricePerStudent : plan.pricePerStudent;
    if (!Number.isSafeInteger(pricePerStudent) || Number(pricePerStudent) <= 0) return fail(400, "invalid_price", "A valid price per student is required.");
    if (new Set(input.courseIds).size !== input.courseIds.length || input.courseIds.length !== plan.subjectCount) return fail(400, "invalid_courses", `Select exactly ${plan.subjectCount} course(s) for this plan.`);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const scope = await client.query<{ brand_id: string; student_profile_id: string }>("select b.id as brand_id, sp.id as student_profile_id from app.educational_brands b join app.student_profiles sp on sp.brand_id = b.id and sp.status = 'active' where lower(b.code) = lower($1) and b.status = 'active' and sp.id = $2 for share", [input.brandCode, input.studentProfileId]);
      if (!scope.rowCount) { await client.query("ROLLBACK"); return fail(404, "student_not_found", "The selected active student was not found for this brand."); }
      const brandId = scope.rows[0]!.brand_id;
      const courses = await client.query<{ id: string }>("select bc.id from app.brand_courses bc where bc.brand_id = $1 and bc.id = any($2::uuid[]) and bc.status = 'published'", [brandId, input.courseIds]);
      if (courses.rowCount !== input.courseIds.length) { await client.query("ROLLBACK"); return fail(400, "invalid_courses", "All selected courses must be published and belong to the selected brand."); }
      const order = await client.query<{ id: string }>("insert into app.manual_subscription_orders (brand_id, student_profile_id, plan_code, price_per_student, student_count, subject_count, promo_ends_on, payment_method, payment_reference, payment_evidence_note, created_by_admin_profile_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id", [brandId, input.studentProfileId, plan.code, pricePerStudent, plan.studentCount, plan.subjectCount, plan.promoEndsOn, input.paymentMethod, trim(input.paymentReference) ?? null, trim(input.paymentEvidenceNote) ?? null, context.adminProfileId]);
      const orderId = order.rows[0]!.id;
      for (const courseId of input.courseIds) await client.query("insert into app.manual_subscription_order_courses (order_id, brand_course_id, brand_id) values ($1,$2,$3)", [orderId, courseId, brandId]);
      await client.query("COMMIT");
      return ok({ orderId, status: "pending_review", planCode: plan.code, courseCount: input.courseIds.length });
    } catch {
      await client.query("ROLLBACK").catch(() => undefined);
      return fail(503, "order_create_failed", "The manual subscription order could not be created.");
    } finally {
      client.release();
    }
  }

  async approveManualOrder(context: AdminOperationContext, input: ReviewManualOrderInput): Promise<Result<Record<string, unknown>>> {
    return this.reviewOrder(context, input, "approved");
  }

  async rejectManualOrder(context: AdminOperationContext, input: ReviewManualOrderInput): Promise<Result<Record<string, unknown>>> {
    return this.reviewOrder(context, input, "rejected");
  }

  async listManualOrders(status?: ManualOrderStatus): Promise<Result<Record<string, unknown>>> {
    const allowed = status ? [status] : ["pending_review", "approved", "rejected", "cancelled"];
    const result = await this.pool.query("select o.id, o.status, o.plan_code as \"planCode\", o.price_per_student as \"pricePerStudent\", o.student_count as \"studentCount\", o.subject_count as \"subjectCount\", o.payment_method as \"paymentMethod\", o.payment_reference as \"paymentReference\", o.created_at as \"createdAt\", o.reviewed_at as \"reviewedAt\", b.code as \"brandCode\", sap.full_name as \"studentName\", sap.email as \"studentEmail\" from app.manual_subscription_orders o join app.educational_brands b on b.id = o.brand_id join app.student_academic_profiles sap on sap.student_profile_id = o.student_profile_id where o.status = any($1::text[]) order by o.created_at desc limit 100", [allowed]);
    return ok({ items: result.rows });
  }

  private async reviewOrder(context: AdminOperationContext, input: ReviewManualOrderInput, decision: "approved" | "rejected"): Promise<Result<Record<string, unknown>>> {
    const reason = trim(input.reason);
    if (!reason) return fail(400, "invalid_reason", "A review reason is required.");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const order = await client.query<{ id: string; brand_id: string; student_profile_id: string; status: string }>("select id, brand_id, student_profile_id, status from app.manual_subscription_orders where id = $1 for update", [input.orderId]);
      if (!order.rowCount) { await client.query("ROLLBACK"); return fail(404, "order_not_found", "The manual subscription order was not found."); }
      if (order.rows[0]!.status !== "pending_review") { await client.query("ROLLBACK"); return fail(409, "order_already_reviewed", "This order has already been reviewed."); }
      let enrolled = 0;
      if (decision === "approved") {
        const courses = await client.query<{ brand_course_id: string }>("select brand_course_id from app.manual_subscription_order_courses where order_id = $1", [input.orderId]);
        for (const course of courses.rows) {
          const inserted = await client.query("insert into app.course_enrollments (student_profile_id, brand_course_id, brand_id, status, enrolled_at) values ($1,$2,$3,'active',now()) on conflict do nothing", [order.rows[0]!.student_profile_id, course.brand_course_id, order.rows[0]!.brand_id]);
          enrolled += inserted.rowCount ?? 0;
        }
      }
      await client.query("update app.manual_subscription_orders set status = $1, reviewed_by_admin_profile_id = $2, reviewed_at = now(), review_reason = $3, version = version + 1 where id = $4", [decision, context.adminProfileId, reason, input.orderId]);
      await client.query("COMMIT");
      return ok({ orderId: input.orderId, status: decision, enrolledCourses: enrolled });
    } catch {
      await client.query("ROLLBACK").catch(() => undefined);
      return fail(503, "order_review_failed", "The manual subscription order could not be reviewed.");
    } finally {
      client.release();
    }
  }

  private async resolvePlacement(brandCode: string, institutionCode: string, levelNumber: number, semesterNumber: number): Promise<Result<{ brandId: string; institutionId: string; levelId: string; semesterId: string }>> {
    const result = await this.pool.query<{ brand_id: string; institution_id: string; level_id: string; semester_id: string }>("select b.id as brand_id, ai.id as institution_id, al.id as level_id, sem.id as semester_id from app.educational_brands b join app.academic_institutions ai on lower(ai.code) = lower($2) and ai.status = 'active' join app.brand_academic_institution_access access on access.brand_id = b.id and access.academic_institution_id = ai.id and access.status = 'active' join app.academic_levels al on al.academic_institution_id = ai.id and al.level_number = $3 and al.status = 'active' join app.academic_semesters sem on sem.academic_level_id = al.id and sem.semester_number = $4 and sem.status = 'active' where lower(b.code) = lower($1) and b.status = 'active'", [brandCode, institutionCode, levelNumber, semesterNumber]);
    if (!result.rowCount) return fail(400, "invalid_placement", "Select an active brand/institution/level/semester placement.");
    return ok({ brandId: result.rows[0]!.brand_id, institutionId: result.rows[0]!.institution_id, levelId: result.rows[0]!.level_id, semesterId: result.rows[0]!.semester_id });
  }

  private async createAuthUser(email: string, password: string, fullName: string): Promise<Result<{ authUserId: string }>> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, { method: "POST", headers: { apikey: this.supabaseSecretKey!, Authorization: `Bearer ${this.supabaseSecretKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName } }) });
    if (!response.ok) return fail(response.status === 409 ? 409 : 503, "auth_user_create_failed", "Supabase Auth rejected the student account creation request.");
    const data = await response.json() as { readonly id?: unknown; readonly user?: { readonly id?: unknown } };
    const authUserId = typeof data.user?.id === "string" ? data.user.id : typeof data.id === "string" ? data.id : undefined;
    return authUserId ? ok({ authUserId }) : fail(503, "auth_user_create_failed", "Supabase Auth did not return a user id.");
  }

  private async deleteAuthUser(authUserId: string): Promise<void> {
    if (!this.supabaseUrl || !this.supabaseSecretKey) return;
    await fetch(`${this.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(authUserId)}`, { method: "DELETE", headers: { apikey: this.supabaseSecretKey, Authorization: `Bearer ${this.supabaseSecretKey}` } });
  }
}

export function createAdminOperationsExecutor(environment: SupabaseBoundaryEnvironment = process.env, poolFactory?: PostgresWritePoolFactory): AdminOperationsExecutor | undefined {
  return environment.PERSISTENCE_PROVIDER === "supabase" ? new AdminOperationsExecutor(environment, poolFactory) : undefined;
}
