import type { StudentCommercialBrand, StudentCourseDetail, StudentCourseList } from "../../contracts/student/courses";
import { repositoryErr, repositoryOk, type RepositoryResult } from "../../core/persistence";
import type { ReadQueryTransport } from "../../infrastructure/supabase/read-query-transport";

export interface StudentCourseReadInput {
  readonly subject: string;
  readonly brand?: StudentCommercialBrand;
  readonly correlationId: string;
}
export interface StudentCourseReadModel {
  list(input: StudentCourseReadInput & { readonly page: number; readonly pageSize: number }): Promise<RepositoryResult<StudentCourseList>>;
  find(input: StudentCourseReadInput & { readonly courseId: string }): Promise<RepositoryResult<StudentCourseDetail>>;
}

interface StudentCourseScope extends Record<string, unknown> {
  readonly brand: StudentCommercialBrand;
  readonly brandId: string;
  readonly institutionId: string;
  readonly levelId: string;
  readonly semesterId: string;
  readonly studentProfileId: string;
}

// These joins derive identity and placement from private records. Client filters
// select among eligible memberships; they never supply student or placement IDs.
const scopeFrom = `from app.app_users su
  join app.brand_memberships sm on sm.app_user_id = su.id
  join app.student_profiles sp on sp.app_user_id = su.id and sp.brand_membership_id = sm.id and sp.brand_id = sm.brand_id
  join app.student_academic_profiles sap on sap.student_profile_id = sp.id and sap.brand_id = sp.brand_id
  join app.educational_brands sb on sb.id = sp.brand_id
  join app.academic_institutions si on si.id = sap.academic_institution_id
  join app.academic_levels sl on sl.id = sap.academic_level_id and sl.academic_institution_id = si.id
  join app.academic_semesters ss on ss.id = sap.academic_semester_id and ss.academic_level_id = sl.id
  join app.brand_academic_institution_access sa on sa.brand_id = sb.id and sa.academic_institution_id = si.id`;
const scopeWhere = `su.auth_user_id = $1::uuid and ($2 = '' or sb.code = $2)
  and su.status = 'active' and sm.status = 'active' and sp.status = 'active'
  and sm.valid_from <= now() and (sm.valid_until is null or sm.valid_until > now())
  and sb.status = 'active' and si.status = 'active' and sl.status = 'active' and ss.status = 'active' and sa.status = 'active'
  and sb.code in ('medway', 'elite', 'nexus')
  and not exists (select 1 from app.admin_profiles ap where ap.app_user_id = su.id)
  and (sl.level_number <> 1 or ss.semester_number <> 1
    or si.code = case sb.code when 'nexus' then 'delta' else 'buc' end)`;

// Revalidate membership, placement and admin exclusion in the data statement.
const scopeGuard = (subjectParameter: number, brandParameter: number): string =>
  `exists (select 1 ${scopeFrom} where ${scopeWhere.replaceAll("$1", "$" + subjectParameter).replaceAll("$2", "$" + brandParameter)}
    and sb.id = $1::uuid and si.id = $2::uuid and sl.id = $3::uuid and ss.id = $4::uuid)`;

const courseFrom = `from app.brand_courses c
  join app.educational_brands b on b.id = c.brand_id
  join app.academic_institutions i on i.id = c.academic_institution_id
  join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
  join app.academic_semesters s on s.id = m.academic_semester_id
  join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id`;
const courseWhere = `c.status = 'published' and c.classification = 'academic_module_offering'
  and m.review_status in ('unreviewed', 'approved')
  and (l.level_number <> 1 or s.semester_number <> 1
    or c.catalogue_presentation = case b.code when 'nexus' then 'module_based' else 'subject_based' end)
  and c.brand_id = $1::uuid and c.academic_institution_id = $2::uuid
  and l.id = $3::uuid and s.id = $4::uuid`;
const enrolledCourseExists = (studentProfileParameter: number): string =>
  `exists (select 1 from app.course_enrollments ce
    where ce.student_profile_id = $${studentProfileParameter}::uuid and ce.brand_course_id = c.id
      and ce.brand_id = c.brand_id and ce.status in ('active','completed'))`;
const enrollmentStatus = (studentProfileParameter: number): string =>
  `(select ce.status from app.course_enrollments ce
    where ce.student_profile_id = $${studentProfileParameter}::uuid and ce.brand_course_id = c.id
      and ce.brand_id = c.brand_id and ce.status in ('active','completed')
    order by case ce.status when 'active' then 0 else 1 end, ce.enrolled_at desc limit 1)`;
const courseAccessJson = (studentProfileParameter: number): string =>
  `jsonb_build_object('isEnrolled', ${enrolledCourseExists(studentProfileParameter)},
    'canOpen', ${enrolledCourseExists(studentProfileParameter)},
    'enrollmentStatus', ${enrollmentStatus(studentProfileParameter)})`;
const chaptersFrom = `from app.course_chapters ch
  where ch.brand_course_id = c.id and ch.brand_id = c.brand_id and ch.status = 'published'`;
const lessonsFrom = `from app.course_lessons ls
  join app.course_chapters ch on ch.id = ls.course_chapter_id and ch.brand_course_id = ls.brand_course_id and ch.brand_id = ls.brand_id
  where ls.brand_course_id = c.id and ls.brand_id = c.brand_id and ls.status = 'published' and ch.status = 'published'`;
const pendingResource = `(select r.id from app.lesson_resources r
  where r.course_lesson_id = ls.id and r.brand_course_id = ls.brand_course_id and r.brand_id = ls.brand_id
    and r.status = 'published' order by r.sort_order, r.id limit 1)`;
const lessonJson = `jsonb_build_object(
  'lessonId', ls.id, 'chapterId', ls.course_chapter_id, 'title', ls.title, 'sortOrder', ls.sort_order, 'status', ls.status,
  'mediaStatus', case when ${pendingResource} is null then 'no_media' else 'pending_media' end,
  'resourceId', ${pendingResource}, 'playbackAvailable', false)`;
const courseJson = (studentProfileParameter: number): string => `jsonb_build_object(
  'courseId', c.id, 'title', c.title, 'code', c.code,
  'brand', jsonb_build_object('code', b.code, 'name', b.name),
  'academicInstitution', jsonb_build_object('code', i.code, 'name', i.display_name),
  'academicLevel', jsonb_build_object('levelNumber', l.level_number, 'title', l.display_title),
  'academicSemester', jsonb_build_object('semesterNumber', s.semester_number, 'title', s.display_title),
  'cataloguePresentation', c.catalogue_presentation,
  'unitLabel', case c.catalogue_presentation when 'subject_based' then 'Subject' else 'Module' end,
  'status', c.status, 'chapterCount', (select count(*) ${chaptersFrom}),
  'lessonCount', (select count(*) ${lessonsFrom}),
  'mediaSummary', jsonb_build_object('totalLessons', (select count(*) ${lessonsFrom}),
    'lessonsWithMedia', 0, 'pendingMediaLessons', (select count(*) ${lessonsFrom} and ${pendingResource} is not null)),
  'access', ${courseAccessJson(studentProfileParameter)},
  'updatedAt', c.updated_at)`;
const detailJson = (studentProfileParameter: number): string => `${courseJson(studentProfileParameter)} || jsonb_build_object(
  'academicUnit', jsonb_build_object('code', m.code, 'label', case c.catalogue_presentation when 'subject_based' then c.title else m.source_display_label end),
  'chapters', coalesce((select jsonb_agg(jsonb_build_object(
    'chapterId', ch.id, 'title', ch.title, 'sortOrder', ch.sort_order, 'status', ch.status,
    'lessons', coalesce((select jsonb_agg(${lessonJson} order by ls.sort_order, ls.id)
      from app.course_lessons ls where ls.course_chapter_id = ch.id and ls.brand_course_id = c.id
        and ls.brand_id = c.brand_id and ls.status = 'published'), '[]'::jsonb)) order by ch.sort_order, ch.id)
    ${chaptersFrom}), '[]'::jsonb))`;

/** Private read transport only. No auth IDs, contacts, paths, durations or URLs leave this model. */
export class PostgresStudentCourseReadModel implements StudentCourseReadModel {
  constructor(private readonly transport: ReadQueryTransport) {}

  private async scope(input: StudentCourseReadInput): Promise<RepositoryResult<StudentCourseScope>> {
    const rows = (await this.transport.query<StudentCourseScope>({
      label: "student.course-scope",
      text: `select sb.code as brand, sp.id as "studentProfileId", sap.brand_id as "brandId", sap.academic_institution_id as "institutionId",
          sap.academic_level_id as "levelId", sap.academic_semester_id as "semesterId"
        ${scopeFrom} where ${scopeWhere} order by sb.code limit 2`,
      values: [input.subject, input.brand ?? ""],
    })).rows;
    if (!rows.length) return repositoryErr({ code: "permission_denied", message: "An active student academic placement is required.", correlationId: input.correlationId });
    if (rows.length > 1) return repositoryErr({ code: "invalid_input", message: "Select a commercial brand for this student membership.", correlationId: input.correlationId });
    return repositoryOk(rows[0]);
  }

  async list(input: StudentCourseReadInput & { readonly page: number; readonly pageSize: number }): Promise<RepositoryResult<StudentCourseList>> {
    try {
      const scope = await this.scope(input);
      if (!scope.ok) return scope;
      // Scope is rechecked in the same statement as counts and rows. Revoked
      // membership/access cannot be reused from a prior context lookup.
      const result = await this.transport.query<{ items: StudentCourseList["items"]; total: number }>({
        label: "student.courses.list",
        text: `select (select count(*)::integer ${courseFrom} where ${courseWhere}) as total,
          coalesce((select jsonb_agg(page.item order by page.is_enrolled desc, page.title, page.id) from (
            select ${courseJson(5)} as item, ${enrolledCourseExists(5)} as is_enrolled, c.title, c.id ${courseFrom} where ${courseWhere}
            order by is_enrolled desc, c.title, c.id limit $6::integer offset $7::integer) page), '[]'::jsonb) as items
          where ${scopeGuard(8, 9)}`,
        values: [
          scope.value.brandId,
          scope.value.institutionId,
          scope.value.levelId,
          scope.value.semesterId,
          scope.value.studentProfileId,
          String(input.pageSize),
          String((input.page - 1) * input.pageSize),
          input.subject,
          input.brand ?? "",
        ],
      });
      const row = result.rows[0];
      if (!row) return repositoryErr({ code: "permission_denied", message: "An active student academic placement is required.", correlationId: input.correlationId });
      if (!Array.isArray(row.items) || !Number.isSafeInteger(row.total)) throw new Error("Invalid course data");
      return repositoryOk({ items: row.items, pagination: { page: input.page, pageSize: input.pageSize, totalItems: row.total } });
    } catch {
      return repositoryErr({ code: "provider_unavailable", message: "Student courses are temporarily unavailable.", correlationId: input.correlationId });
    }
  }

  async find(input: StudentCourseReadInput & { readonly courseId: string }): Promise<RepositoryResult<StudentCourseDetail>> {
    try {
      const scope = await this.scope(input);
      if (!scope.ok) return scope;
      const result = await this.transport.query<{ item: StudentCourseDetail }>({
        label: "student.courses.detail",
        text: `select ${detailJson(6)} as item ${courseFrom} where ${courseWhere} and c.id = $5::uuid and ${enrolledCourseExists(6)} and ${scopeGuard(7, 8)}`,
        values: [scope.value.brandId, scope.value.institutionId, scope.value.levelId, scope.value.semesterId, input.courseId, scope.value.studentProfileId, input.subject, input.brand ?? ""],
      });
      return result.rows[0] ? repositoryOk(result.rows[0].item)
        : repositoryErr({ code: "not_found", message: "Course was not found.", correlationId: input.correlationId });
    } catch {
      return repositoryErr({ code: "provider_unavailable", message: "Student courses are temporarily unavailable.", correlationId: input.correlationId });
    }
  }
}