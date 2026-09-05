import type { BrandScope } from "../../../core/brand-scope";
import type { ReadQueryRequest, ReadQueryResult, ReadQueryTransport } from "../read-query-transport";
import { SupabaseM2AcademicLevelReadRepository, SupabaseM2AcademicModuleAliasReadRepository, SupabaseM2AcademicModuleReadRepository, SupabaseM2AcademicSemesterReadRepository, SupabaseM2BrandCourseReadRepository, SupabaseM2BrandInstructorReadRepository, SupabaseM2CourseInstructorReadRepository, SupabaseM2InstructorReadRepository } from "./m2-supabase-read-repositories";

const now = "2026-01-01T00:00:00.000Z";
const brand: BrandScope = { brandId: "brand-medway" as BrandScope["brandId"], brandCode: "medway", brandDisplayName: "Medway", isActive: true };
const level = { id: "level-1", level_number: 1, display_title: "Level 1", sort_order: 1, status: "active", version: 1, created_at: now, updated_at: now };
const semester = { id: "semester-1", academic_level_id: "level-1", semester_number: 1, display_title: "Semester 1", sort_order: 1, status: "active", version: 1, created_at: now, updated_at: now };
const academicModule = { id: "module-1", academic_semester_id: "semester-1", code: "MSK2115", normalized_code: "MSK2115", source_display_label: "MSK", sort_order: 1, review_status: "unreviewed", version: 1, created_at: now, updated_at: now };
const alias = { id: "alias-1", academic_module_id: "module-1", alias_value: "2115 MSK", normalized_alias: "2115 MSK", status: "active", version: 1, created_at: now, updated_at: now };
const instructor = { id: "instructor-1", code: "INS-00001", display_name: "Example", status: "active", version: 1, created_at: now, updated_at: now };
const instructorBrand = { id: "assignment-1", brand_id: "brand-medway", instructor_id: "instructor-1", status: "active", version: 1, created_at: now, updated_at: now };
const course = { id: "course-1", brand_id: "brand-medway", academic_module_id: null, code: "STANDALONE", title: "Standalone", classification: "standalone", status: "draft", version: 1, created_at: now, updated_at: now };
const courseInstructor = { id: "course-assignment-1", course_id: "course-1", brand_id: "brand-medway", instructor_brand_assignment_id: "assignment-1", instructor_id: "instructor-1", status: "active", version: 1, created_at: now, updated_at: now };

class Fake implements ReadQueryTransport { readonly requests: ReadQueryRequest[] = []; constructor(private readonly rows: Record<string, readonly Record<string, unknown>[]>, private readonly broken = false) {} async query<Row extends Record<string, unknown>>(request: ReadQueryRequest): Promise<ReadQueryResult<Row>> { this.requests.push(request); if (this.broken) throw new Error("offline"); return { rows: (this.rows[request.label] ?? []) as readonly Row[] }; } }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function readOnly(request: ReadQueryRequest): void { assert(/^select\b/i.test(request.text), "query is not SELECT"); assert(request.text.includes("app."), "query is not schema qualified"); assert(!/\b(insert|update|delete|create|alter|drop|grant|revoke)\b/i.test(request.text), "query is not read-only"); }

export async function runM2SupabaseReadRepositorySelfTest(): Promise<{ readonly passed: boolean; readonly cases: readonly { readonly name: string; readonly passed: boolean }[] }> {
  const cases: { name: string; passed: boolean }[] = [];
  const test = async (name: string, run: () => Promise<void> | void) => { try { await run(); cases.push({ name, passed: true }); } catch { cases.push({ name, passed: false }); } };
  await test("canonical catalogue rows map", async () => {
    const transport = new Fake({ "m2.academic-level.list": [level], "m2.academic-semester.list-level": [semester], "m2.academic-module.list-semester": [academicModule], "m2.academic-module-alias.by-normalized-value": [alias] });
    const levels = await new SupabaseM2AcademicLevelReadRepository(transport).listAcademicLevels(); const semesters = await new SupabaseM2AcademicSemesterReadRepository(transport).listAcademicSemestersByLevelId({ levelId: "level-1" }); const modules = await new SupabaseM2AcademicModuleReadRepository(transport).listAcademicModulesBySemesterId({ semesterId: "semester-1" }); const aliases = await new SupabaseM2AcademicModuleAliasReadRepository(transport).findAcademicModuleAlias({ normalizedAlias: " 2115 msk " });
    assert(levels.ok && levels.value[0]?.displayTitle === "Level 1", "level mapping"); assert(semesters.ok && semesters.value[0]?.academicLevelId === "level-1", "semester mapping"); assert(modules.ok && modules.value[0]?.normalizedCode === "MSK2115", "module mapping"); assert(aliases.ok && aliases.value.academicModuleId === "module-1", "alias mapping"); transport.requests.forEach(readOnly);
  });
  await test("canonical teaching rows map", async () => {
    const transport = new Fake({ "m2.instructor.list": [instructor], "m2.instructor-brand-assignment.list-brand": [instructorBrand], "m2.brand-course.list-brand": [course], "m2.course-instructor-assignment.list-brand-course": [courseInstructor] });
    const instructors = await new SupabaseM2InstructorReadRepository(transport).listInstructors(); const assignments = await new SupabaseM2BrandInstructorReadRepository(transport).listBrandAssignments({ brand }); const courses = await new SupabaseM2BrandCourseReadRepository(transport).listBrandCourses({ brand }); const courseAssignments = await new SupabaseM2CourseInstructorReadRepository(transport).listCourseInstructors({ brand, courseId: "course-1" });
    assert(instructors.ok && instructors.value[0]?.code === "INS-00001", "instructor mapping"); assert(assignments.ok && assignments.value[0]?.brandId === brand.brandId, "brand assignment mapping"); assert(courses.ok && courses.value[0]?.classification === "standalone", "course mapping"); assert(courseAssignments.ok && courseAssignments.value[0]?.instructorBrandAssignmentId === "assignment-1", "course assignment mapping"); transport.requests.forEach(readOnly);
  });
  await test("bound input and timestamps are normalized", async () => {
    const createdAt = new Date(now); const transport = new Fake({ "m2.academic-module.by-code": [{ ...academicModule, created_at: createdAt, updated_at: createdAt }], "m2.instructor.by-code": [instructor] });
    const foundModule = await new SupabaseM2AcademicModuleReadRepository(transport).findAcademicModuleByCode({ moduleCode: " msk2115 " }); const foundInstructor = await new SupabaseM2InstructorReadRepository(transport).findInstructorByCode({ instructorCode: " INS-00001 " });
    assert(foundModule.ok && foundModule.value.createdAt === now, "Date timestamp mapping"); assert(foundInstructor.ok && transport.requests[1]?.values[0] === "INS-00001", "instructor code binding"); assert(transport.requests[0]?.values[0] === "MSK2115", "module code binding");
  });
  await test("malformed persistence fails closed", async () => {
    const invalid = await new SupabaseM2BrandCourseReadRepository(new Fake({ "m2.brand-course.list-brand": [{ ...course, classification: "wrong" }] })).listBrandCourses({ brand }); const unavailable = await new SupabaseM2InstructorReadRepository(new Fake({}, true)).listInstructors();
    assert(!invalid.ok && invalid.error.code === "persistence_data_invalid", "invalid lifecycle accepted"); assert(!unavailable.ok && unavailable.error.code === "query_failed", "provider failure leaked");
  });
  return { passed: cases.every((entry) => entry.passed), cases };
}

if (process.argv[1]?.endsWith("m2-supabase-read-repositories.selftest.js")) runM2SupabaseReadRepositorySelfTest().then((result) => { if (!result.passed) process.exitCode = 1; else console.log("m2 supabase read repository selftest passed"); });
