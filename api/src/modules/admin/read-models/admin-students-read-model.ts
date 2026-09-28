import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type { ReadQueryTransport } from "../../../infrastructure/supabase/read-query-transport";

export type AdminStudentsBrandFilter = "all" | "medway" | "elite" | "nexus";
export type AdminStudentsStatusFilter = "active" | "pending" | "disabled" | "suspended";
type CommercialBrand = Exclude<AdminStudentsBrandFilter, "all">;

export interface AdminStudentReadItem {
  readonly id: string;
  readonly platform: { readonly platformId: string; readonly platformCode: CommercialBrand; readonly platformDisplayName: string };
  readonly displayName: string | null;
  readonly emailMasked: string | null;
  readonly phoneMasked: null;
  readonly studentIdMasked: string | null;
  readonly academicInstitution: string | null;
  readonly academicLevel: string | null;
  readonly academicLevelId: string | null;
  readonly academicSemester: string | null;
  readonly academicTermOrYear: string | null;
  readonly university: string | null;
  readonly program: string | null;
  readonly expectedGraduationDate: string | null;
  readonly status: "active" | "disabled";
  readonly activeSubscriptionCount: null;
  readonly activeGrantCount: null;
  readonly activeDeviceCount: null;
  readonly activeSessionCount: null;
  readonly lastSeenAt: null;
  readonly riskFlags: readonly ["none"];
}

export interface AdminStudentReadDetail extends AdminStudentReadItem {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly access: { readonly activeSubscriptionCount: null; readonly activeSeatCount: null; readonly activeGrantCount: null; readonly expiredGrantCount: null; readonly revokedGrantCount: null; readonly enrollmentCount: null };
  readonly learning: { readonly enrollmentCount: null; readonly completedLessonCount: null; readonly attemptCount: null; readonly playbackSessionCount: null; readonly lastLearningActivityAt: null };
  readonly devices: readonly [];
  readonly sessions: readonly [];
}

export interface AdminStudentsPageResult { readonly data: readonly AdminStudentReadItem[]; readonly pagination: { readonly page: number; readonly pageSize: number; readonly totalItems: number; readonly totalPages: number }; }
export interface AdminStudentsReadModel {
  listStudents(input: { readonly brand: AdminStudentsBrandFilter; readonly search?: string; readonly academicLevel?: string; readonly status?: AdminStudentsStatusFilter; readonly page: number; readonly pageSize: number; readonly correlationId?: string }): Promise<RepositoryResult<AdminStudentsPageResult>>;
  findStudent(input: { readonly studentId: string; readonly brand: AdminStudentsBrandFilter; readonly correlationId?: string }): Promise<RepositoryResult<AdminStudentReadDetail>>;
}

const commercial = ["medway", "elite", "nexus"] as const;
const unavailable = <T>(message: string, correlationId?: string): RepositoryResult<T> => repositoryErr({ code: "provider_unavailable", message, correlationId });
const asNumber = (value: unknown) => { const parsed = typeof value === "number" ? value : Number(value); if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("number"); return parsed; };
const required = (row: Readonly<Record<string, unknown>>, key: string) => { const value = row[key]; if (typeof value !== "string" || !value) throw new Error(key); return value; };
const nullable = (row: Readonly<Record<string, unknown>>, key: string) => typeof row[key] === "string" && row[key] ? row[key] as string : null;
const maskEmail = (email: string) => { const at = email.indexOf("@"); if (at < 1) return "•••"; return `${email.slice(0, 1)}•••${email.slice(at)}`; };
const maskStudentCode = (code: string) => code.length <= 3 ? "•••" : `${code.slice(0, Math.min(3, code.length - 2))}•••${code.slice(-2)}`;
const brandArray = (brand: AdminStudentsBrandFilter) => brand === "all" ? commercial : [brand];

const item = (row: Readonly<Record<string, unknown>>): AdminStudentReadItem => {
  const academicLevel = nullable(row, "academic_level_title");
  const academicSemester = nullable(row, "academic_semester_title");
  const email = nullable(row, "email");
  const studentCode = nullable(row, "student_code");
  return {
    id: required(row, "id"),
    platform: { platformId: required(row, "brand_id"), platformCode: required(row, "brand_code") as CommercialBrand, platformDisplayName: required(row, "brand_name") },
    displayName: nullable(row, "full_name"), emailMasked: email ? maskEmail(email) : null, phoneMasked: null, studentIdMasked: studentCode ? maskStudentCode(studentCode) : null,
    academicInstitution: nullable(row, "academic_institution_name"), academicLevel, academicLevelId: nullable(row, "academic_level_id"), academicSemester,
    academicTermOrYear: academicLevel && academicSemester ? `${academicLevel} / ${academicSemester}` : academicLevel ?? academicSemester,
    university: nullable(row, "academic_institution_name"), program: nullable(row, "program_label"), expectedGraduationDate: nullable(row, "expected_graduation_date"),
    status: required(row, "status") === "active" ? "active" : "disabled", activeSubscriptionCount: null, activeGrantCount: null, activeDeviceCount: null, activeSessionCount: null, lastSeenAt: null, riskFlags: ["none"],
  };
};

const selectFields = `sp.id, sp.status, sp.created_at, sp.updated_at, eb.id as brand_id, eb.code as brand_code, eb.name as brand_name, sap.full_name, sap.email, sap.student_code, sap.academic_level_id, sap.program_label, sap.expected_graduation_date::text, institution.display_name as academic_institution_name, level.display_title as academic_level_title, semester.display_title as academic_semester_title`;
const joins = `from app.student_profiles sp join app.educational_brands eb on eb.id = sp.brand_id left join app.student_academic_profiles sap on sap.student_profile_id = sp.id left join app.academic_institutions institution on institution.id = sap.academic_institution_id left join app.academic_levels level on level.id = sap.academic_level_id left join app.academic_semesters semester on semester.id = sap.academic_semester_id`;

export class EmptyAdminStudentsReadModel implements AdminStudentsReadModel {
  async listStudents(input: Parameters<AdminStudentsReadModel["listStudents"]>[0]) { return repositoryOk({ data: [], pagination: { page: input.page, pageSize: input.pageSize, totalItems: 0, totalPages: 0 } }); }
  async findStudent(input: Parameters<AdminStudentsReadModel["findStudent"]>[0]) { return repositoryErr({ code: "not_found", message: "The requested student was not found.", correlationId: input.correlationId }); }
}

export class PostgresAdminStudentsReadModel implements AdminStudentsReadModel {
  constructor(private readonly transport: ReadQueryTransport) {}
  async listStudents(input: Parameters<AdminStudentsReadModel["listStudents"]>[0]): Promise<RepositoryResult<AdminStudentsPageResult>> {
    try {
      const search = input.search?.trim() ?? "";
      const status = input.status === "active" ? "active" : input.status ? "inactive" : "";
      const level = input.academicLevel?.trim() ?? "";
      const where = `where eb.code = any(string_to_array($1, ',')) and ($2 = '' or sp.id::text ilike '%' || $2 || '%' or lower(coalesce(sap.full_name, '')) like '%' || lower($2) || '%' or lower(coalesce(sap.email, '')) like '%' || lower($2) || '%' or lower(coalesce(sap.student_code, '')) like '%' || lower($2) || '%') and ($3 = '' or sp.status = $3) and ($4 = '' or sap.academic_level_id::text = $4)`;
      const values = [brandArray(input.brand).join(","), search, status, level];
      const count = await this.transport.query({ label: "admin.students.count", text: `select count(*)::text as total ${joins} ${where}`, values });
      const totalItems = asNumber(count.rows[0]?.total);
      const rows = await this.transport.query({ label: "admin.students.list", text: `select ${selectFields} ${joins} ${where} order by sp.created_at desc, sp.id asc limit $5 offset $6`, values: [...values, String(input.pageSize), String((input.page - 1) * input.pageSize)] });
      return repositoryOk({ data: rows.rows.map(item), pagination: { page: input.page, pageSize: input.pageSize, totalItems, totalPages: totalItems ? Math.ceil(totalItems / input.pageSize) : 0 } });
    } catch { return unavailable("Student records could not be read from the private data store.", input.correlationId); }
  }
  async findStudent(input: Parameters<AdminStudentsReadModel["findStudent"]>[0]): Promise<RepositoryResult<AdminStudentReadDetail>> {
    try {
      const rows = await this.transport.query({ label: "admin.students.detail", text: `select ${selectFields} ${joins} where sp.id = $1 and eb.code = any(string_to_array($2, ','))`, values: [input.studentId, brandArray(input.brand).join(",")] });
      const row = rows.rows[0];
      if (!row) return repositoryErr({ code: "not_found", message: "The requested student was not found.", correlationId: input.correlationId });
      const base = item(row);
      return repositoryOk({ ...base, createdAt: required(row, "created_at"), updatedAt: required(row, "updated_at"), access: { activeSubscriptionCount: null, activeSeatCount: null, activeGrantCount: null, expiredGrantCount: null, revokedGrantCount: null, enrollmentCount: null }, learning: { enrollmentCount: null, completedLessonCount: null, attemptCount: null, playbackSessionCount: null, lastLearningActivityAt: null }, devices: [], sessions: [] });
    } catch { return unavailable("Student details could not be read from the private data store.", input.correlationId); }
  }
}
