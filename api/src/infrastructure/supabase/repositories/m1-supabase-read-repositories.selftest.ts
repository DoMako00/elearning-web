import type { BrandScope } from "../../../core/brand-scope";
import type { ReadQueryRequest, ReadQueryResult, ReadQueryTransport } from "../read-query-transport";
import {
  SupabaseM1AdminProfileReadRepository,
  SupabaseM1AdminRoleAssignmentReadRepository,
  SupabaseM1AppUserReadRepository,
  SupabaseM1BrandMembershipReadRepository,
  SupabaseM1EducationalBrandReadRepository,
  SupabaseM1StudentProfileReadRepository,
} from "./m1-supabase-read-repositories";

export interface M1SupabaseReadRepositorySelfTestCaseResult {
  readonly name: string;
  readonly passed: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface M1SupabaseReadRepositorySelfTestRunResult {
  readonly passed: boolean;
  readonly cases: readonly M1SupabaseReadRepositorySelfTestCaseResult[];
}

const medway: BrandScope = { brandId: "brand-medway" as BrandScope["brandId"], brandCode: "medway", brandDisplayName: "Medway", isActive: true };
const elite: BrandScope = { brandId: "brand-elite" as BrandScope["brandId"], brandCode: "elite", brandDisplayName: "Elite", isActive: true };

const brandRow = { id: "brand-medway", code: "medway", name: "Medway", slug: "medway", status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };
const appUserRow = { id: "user-global-001", auth_user_id: "auth-001", primary_email: "student@example.test", primary_phone: null, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };
const membershipRow = { id: "membership-medway-001", brand_id: "brand-medway", app_user_id: "user-global-001", membership_type: "student", status: "active", activated_at: "2026-01-01T00:00:00.000Z", suspended_at: null, expired_at: null, cancelled_at: null, rejected_at: null, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };
const studentRow = { id: "student-medway-001", brand_id: "brand-medway", app_user_id: "user-global-001", brand_membership_id: "membership-medway-001", full_name: "Medway Student", phone: null, email: "student@example.test", academic_year: "2026", academic_term: "term-1", university: "Example University", student_id: "STUDENT-001", status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };
const adminRow = { id: "admin-medway-001", brand_id: "brand-medway", app_user_id: "user-global-001", display_name: "Medway Admin", status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };
const assignmentRow = { id: "assignment-medway-001", brand_id: "brand-medway", admin_profile_id: "admin-medway-001", role_id: "role-medway-001", assigned_by_admin_profile_id: null, assigned_at: "2026-01-01T00:00:00.000Z", revoked_at: null, status: "active", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" };

class FakeReadQueryTransport implements ReadQueryTransport {
  readonly requests: ReadQueryRequest[] = [];
  constructor(private readonly rowsByLabel: Readonly<Record<string, readonly Record<string, unknown>[]>>, private readonly shouldFail = false) {}

  async query<Row extends Record<string, unknown>>(request: ReadQueryRequest): Promise<ReadQueryResult<Row>> {
    this.requests.push(request);
    if (this.shouldFail) throw new Error("transport failure containing no query detail");
    return { rows: (this.rowsByLabel[request.label] ?? []) as readonly Row[] };
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function assertTruthy(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

async function recordCase(cases: M1SupabaseReadRepositorySelfTestCaseResult[], name: string, run: () => Promise<void> | void): Promise<void> {
  try {
    await run();
    cases.push({ name, passed: true });
  } catch (error) {
    cases.push({ name, passed: false, details: { message: error instanceof Error ? error.message : "Unexpected self-test failure." } });
  }
}

function assertSelectOnly(request: ReadQueryRequest): void {
  const text = request.text.trim().toLowerCase();
  assertTruthy(text.startsWith("select "), "Read transport request must start with SELECT");
  for (const forbidden of ["insert ", "update ", "delete ", "merge ", "upsert ", "truncate ", "create ", "alter ", "drop ", "grant ", "revoke ", "call "]) {
    assertEqual(text.includes(forbidden), false, `Read transport request must not contain ${forbidden.trim()}`);
  }
}

/** Deterministic local-only contract tests; this function never runs on import. */
export async function runM1SupabaseReadRepositorySelfTest(): Promise<M1SupabaseReadRepositorySelfTestRunResult> {
  const cases: M1SupabaseReadRepositorySelfTestCaseResult[] = [];

  await recordCase(cases, "Construction and import issue no query", () => {
    const transport = new FakeReadQueryTransport({});
    new SupabaseM1EducationalBrandReadRepository(transport);
    new SupabaseM1AppUserReadRepository(transport);
    new SupabaseM1BrandMembershipReadRepository(transport);
    new SupabaseM1StudentProfileReadRepository(transport);
    new SupabaseM1AdminProfileReadRepository(transport);
    new SupabaseM1AdminRoleAssignmentReadRepository(transport);
    assertEqual(transport.requests.length, 0, "Constructor query count");
  });

  await recordCase(cases, "Educational brand lookup supports ID and canonical code", async () => {
    const transport = new FakeReadQueryTransport({ "m1.educational-brand.by-id": [brandRow], "m1.educational-brand.by-code": [brandRow] });
    const repository = new SupabaseM1EducationalBrandReadRepository(transport);
    const byId = await repository.findEducationalBrandById({ id: "brand-medway" });
    const byCode = await repository.findEducationalBrandByCode({ code: "medway" });
    assertTruthy(byId.ok && byId.value.code === "medway", "Brand ID result");
    assertTruthy(byCode.ok && byCode.value.id === "brand-medway", "Brand code result");
    assertTruthy(byId.ok && byId.value.createdAt === brandRow.created_at && byId.value.updatedAt === brandRow.updated_at, "Existing string timestamps must remain unchanged");
  });

  await recordCase(cases, "M1 Date timestamps normalize to ISO strings", async () => {
    const createdAt = new Date("2026-02-03T04:05:06.000Z");
    const updatedAt = new Date("2026-02-04T05:06:07.000Z");
    const transport = new FakeReadQueryTransport({
      "m1.educational-brand.by-id": [{ ...brandRow, created_at: createdAt, updated_at: updatedAt }],
      "m1.brand-membership.by-user-brand": [{ ...membershipRow, activated_at: createdAt, created_at: createdAt, updated_at: updatedAt }],
    });
    const educationalBrand = await new SupabaseM1EducationalBrandReadRepository(transport).findEducationalBrandById({ id: "brand-medway" });
    const membership = await new SupabaseM1BrandMembershipReadRepository(transport).findBrandMembershipByUserId({ appUserId: "user-global-001", brand: medway });
    assertTruthy(educationalBrand.ok && educationalBrand.value.createdAt === createdAt.toISOString() && educationalBrand.value.updatedAt === updatedAt.toISOString(), "Educational-brand Date timestamps must normalize");
    assertTruthy(membership.ok && membership.value.activatedAt === createdAt.toISOString() && membership.value.updatedAt === updatedAt.toISOString(), "Membership Date timestamps must normalize");
  });

  await recordCase(cases, "M1 malformed timestamps fail safely", async () => {
    const invalidDate = new Date("invalid");
    const dateResult = await new SupabaseM1EducationalBrandReadRepository(new FakeReadQueryTransport({ "m1.educational-brand.by-id": [{ ...brandRow, created_at: invalidDate }] })).findEducationalBrandById({ id: "brand-medway" });
    const primitiveResult = await new SupabaseM1EducationalBrandReadRepository(new FakeReadQueryTransport({ "m1.educational-brand.by-id": [{ ...brandRow, updated_at: 42 }] })).findEducationalBrandById({ id: "brand-medway" });
    assertTruthy(!dateResult.ok && dateResult.error.code === "persistence_data_invalid", "Invalid Date must map safely");
    assertTruthy(!primitiveResult.ok && primitiveResult.error.code === "persistence_data_invalid", "Non-timestamp primitive must map safely");
  });

  await recordCase(cases, "Global app-user lookup has no brand predicate", async () => {
    const transport = new FakeReadQueryTransport({ "m1.app-user.by-id": [appUserRow] });
    const result = await new SupabaseM1AppUserReadRepository(transport).findAppUserById({ id: "user-global-001" });
    assertTruthy(result.ok && result.value.authUserId === "auth-001", "Global app-user result");
    assertEqual(transport.requests[0]?.text.includes("brand_id"), false, "Global app-user must not require brand scope");
  });

  await recordCase(cases, "Membership and student-profile reads bind canonical brand IDs", async () => {
    const transport = new FakeReadQueryTransport({ "m1.brand-membership.by-user-brand": [membershipRow], "m1.student-profile.by-user-brand": [studentRow] });
    const membership = await new SupabaseM1BrandMembershipReadRepository(transport).findBrandMembershipByUserId({ appUserId: "user-global-001", brand: medway });
    const student = await new SupabaseM1StudentProfileReadRepository(transport).findStudentProfileByUserId({ appUserId: "user-global-001", brand: medway });
    assertTruthy(membership.ok && membership.value.brandId === medway.brandId, "Membership result");
    assertTruthy(student.ok && student.value.brandId === medway.brandId, "Student profile result");
    assertEqual(transport.requests[0]?.values[1], medway.brandId, "Membership brand parameter");
    assertEqual(transport.requests[1]?.values[1], medway.brandId, "Student profile brand parameter");
  });

  await recordCase(cases, "Admin profile and role-assignment reads bind canonical brand IDs", async () => {
    const transport = new FakeReadQueryTransport({ "m1.admin-profile.by-id-brand": [adminRow], "m1.admin-role-assignment.list-profile-brand": [assignmentRow] });
    const profile = await new SupabaseM1AdminProfileReadRepository(transport).findAdminProfileById({ id: "admin-medway-001", brand: medway });
    const assignments = await new SupabaseM1AdminRoleAssignmentReadRepository(transport).listAdminRoleAssignmentsForProfile({ adminProfileId: "admin-medway-001", brand: medway });
    assertTruthy(profile.ok && profile.value.brandId === medway.brandId, "Admin profile result");
    assertTruthy(assignments.ok && assignments.value[0]?.brandId === medway.brandId, "Admin role-assignment result");
    assertEqual(transport.requests[0]?.values[1], medway.brandId, "Admin profile brand parameter");
    assertEqual(transport.requests[1]?.values[1], medway.brandId, "Assignment brand parameter");
  });

  await recordCase(cases, "Cross-brand reads return not found without revealing the other brand", async () => {
    const transport = new FakeReadQueryTransport({ "m1.student-profile.by-id-brand": [] });
    const result = await new SupabaseM1StudentProfileReadRepository(transport).findStudentProfileById({ id: "student-medway-001", brand: elite, correlationId: "cross-brand" });
    assertEqual(result.ok, false, "Cross-brand result");
    if (!result.ok) {
      assertEqual(result.error.code, "not_found", "Cross-brand error code");
      assertEqual(result.error.message.includes("Medway"), false, "Cross-brand error disclosure");
    }
    assertEqual(transport.requests[0]?.values[1], elite.brandId, "Cross-brand parameter");
  });

  await recordCase(cases, "Malformed persistence rows fail safely", async () => {
    const transport = new FakeReadQueryTransport({ "m1.educational-brand.by-id": [{ ...brandRow, status: "unexpected" }] });
    const result = await new SupabaseM1EducationalBrandReadRepository(transport).findEducationalBrandById({ id: "brand-medway" });
    assertEqual(result.ok, false, "Malformed row result");
    if (!result.ok) assertEqual(result.error.code, "persistence_data_invalid", "Malformed row error code");
  });

  await recordCase(cases, "Transport failures become provider-neutral query errors", async () => {
    const result = await new SupabaseM1EducationalBrandReadRepository(new FakeReadQueryTransport({}, true)).findEducationalBrandById({ id: "brand-medway" });
    assertEqual(result.ok, false, "Transport error result");
    if (!result.ok) assertEqual(result.error.code, "query_failed", "Transport error code");
  });

  await recordCase(cases, "All issued requests are parameterized SELECT reads", async () => {
    const transport = new FakeReadQueryTransport({ "m1.student-profile.list-brand": [studentRow] });
    const result = await new SupabaseM1StudentProfileReadRepository(transport).listStudentProfilesByBrand({ brand: medway });
    assertTruthy(result.ok, "List result");
    assertEqual(transport.requests.length, 1, "Read request count");
    assertSelectOnly(transport.requests[0]!);
    assertEqual(transport.requests[0]?.values[0], medway.brandId, "Bound brand parameter");
  });

  return { passed: cases.every((testCase) => testCase.passed), cases };
}
