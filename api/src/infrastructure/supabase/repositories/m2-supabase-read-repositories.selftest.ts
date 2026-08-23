import type { BrandScope } from "../../../core/brand-scope";
import type { ReadQueryRequest, ReadQueryResult, ReadQueryTransport } from "../read-query-transport";
import {
  SupabaseM2AcademicLevelReadRepository,
  SupabaseM2AcademicModuleReadRepository,
  SupabaseM2AcademicSemesterReadRepository,
  SupabaseM2BrandCourseReadRepository,
  SupabaseM2BrandInstructorReadRepository,
  SupabaseM2CourseInstructorReadRepository,
  SupabaseM2InstructorReadRepository,
} from "./m2-supabase-read-repositories";

export interface M2SupabaseReadRepositorySelfTestRunResult {
  readonly passed: boolean;
  readonly cases: readonly { readonly name: string; readonly passed: boolean }[];
}

const brand: BrandScope = { brandId: "brand-medway" as BrandScope["brandId"], brandCode: "medway", brandDisplayName: "Medway", isActive: true };
const now = "2026-01-01T00:00:00.000Z";
const levelRow = { id: "level-1", level_number: 1, display_name: "Level 1", sort_order: 1, status: "active", created_at: now, updated_at: now };
const semesterRow = { id: "semester-1", level_id: "level-1", semester_number: 1, display_name: "Semester 1", phase: "phase_i", sort_order: 1, status: "active", created_at: now, updated_at: now };
const moduleRow = { id: "module-1", semester_id: "semester-1", module_code: "MSK2115", title: "MSK", sort_order: 1, status: "active", created_at: now, updated_at: now };
const instructorRow = { id: "instructor-1", display_name: "Dr Example", professional_title: null, status: "active", created_at: now, updated_at: now };
const brandInstructorRow = { id: "brand-instructor-1", brand_id: "brand-medway", instructor_id: "instructor-1", status: "active", created_at: now, updated_at: now };
const courseRow = { id: "course-1", brand_id: "brand-medway", academic_module_id: null, course_code: "STANDALONE", title: "Standalone", course_scope: "standalone", status: "draft", created_at: now, updated_at: now };
const assignmentRow = { id: "assignment-1", course_id: "course-1", brand_id: "brand-medway", instructor_id: "instructor-1", status: "active", created_at: now, updated_at: now };

class Fake implements ReadQueryTransport {
  readonly requests: ReadQueryRequest[] = [];
  constructor(private readonly rows: Record<string, readonly Record<string, unknown>[]>, private readonly fail = false) {}
  async query<Row extends Record<string, unknown>>(request: ReadQueryRequest): Promise<ReadQueryResult<Row>> {
    this.requests.push(request);
    if (this.fail) throw new Error("network");
    return { rows: (this.rows[request.label] ?? []) as readonly Row[] };
  }
}

function ok(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const select = (request: ReadQueryRequest) => {
  ok(/^select\b/i.test(request.text) && request.text.includes("app."), "not schema-qualified SELECT");
  ok(!/\b(insert|update|delete|create|alter|drop|grant|revoke)\b/i.test(request.text), "unsafe SQL");
};

export async function runM2SupabaseReadRepositorySelfTest(): Promise<M2SupabaseReadRepositorySelfTestRunResult> {
  const cases: { name: string; passed: boolean }[] = [];
  const test = async (name: string, run: () => Promise<void> | void) => { try { await run(); cases.push({ name, passed: true }); } catch { cases.push({ name, passed: false }); } };

  await test("construction issues no query", () => {
    const transport = new Fake({});
    new SupabaseM2AcademicLevelReadRepository(transport); new SupabaseM2AcademicSemesterReadRepository(transport); new SupabaseM2AcademicModuleReadRepository(transport); new SupabaseM2InstructorReadRepository(transport); new SupabaseM2BrandInstructorReadRepository(transport); new SupabaseM2BrandCourseReadRepository(transport); new SupabaseM2CourseInstructorReadRepository(transport);
    ok(transport.requests.length === 0, "queried during construction");
  });

  await test("module code trims and binds", async () => {
    const transport = new Fake({ "m2.academic-module.by-code": [moduleRow] });
    const result = await new SupabaseM2AcademicModuleReadRepository(transport).findAcademicModuleByCode({ moduleCode: " MSK2115 " });
    ok(result.ok, "missing"); ok(transport.requests[0]?.values[0] === "MSK2115", "code binding"); select(transport.requests[0]!);
  });

  await test("valid Date timestamps normalize across M2 models", async () => {
    const createdAt = new Date("2026-02-03T04:05:06.000Z"); const updatedAt = new Date("2026-02-04T05:06:07.000Z");
    const dated = (row: Record<string, unknown>) => ({ ...row, created_at: createdAt, updated_at: updatedAt });
    const transport = new Fake({
      "m2.academic-level.list": [dated(levelRow)], "m2.academic-semester.list": [dated(semesterRow)], "m2.academic-module.list": [dated(moduleRow)], "m2.instructor.list": [dated(instructorRow)], "m2.brand-instructor.list-brand": [dated(brandInstructorRow)], "m2.brand-course.list-brand": [dated(courseRow)], "m2.course-instructor.list-brand-course": [dated(assignmentRow)],
    });
    const values = [await new SupabaseM2AcademicLevelReadRepository(transport).listAcademicLevels(), await new SupabaseM2AcademicSemesterReadRepository(transport).listAcademicSemesters(), await new SupabaseM2AcademicModuleReadRepository(transport).listAcademicModules(), await new SupabaseM2InstructorReadRepository(transport).listInstructors(), await new SupabaseM2BrandInstructorReadRepository(transport).listBrandInstructors({ brand }), await new SupabaseM2BrandCourseReadRepository(transport).listBrandCourses({ brand }), await new SupabaseM2CourseInstructorReadRepository(transport).listCourseInstructors({ brand, courseId: "course-1" })];
    for (const value of values) ok(value.ok && value.value[0]?.createdAt === createdAt.toISOString() && value.value[0]?.updatedAt === updatedAt.toISOString(), "Date timestamps must normalize");
    transport.requests.forEach(select);
  });

  await test("existing string timestamps remain accepted", async () => {
    const result = await new SupabaseM2AcademicLevelReadRepository(new Fake({ "m2.academic-level.list": [levelRow] })).listAcademicLevels();
    ok(result.ok && result.value[0]?.createdAt === now && result.value[0]?.updatedAt === now, "string timestamps changed");
  });

  await test("malformed timestamps and lifecycle values are safe", async () => {
    const invalidDate = await new SupabaseM2AcademicLevelReadRepository(new Fake({ "m2.academic-level.list": [{ ...levelRow, created_at: new Date("invalid") }] })).listAcademicLevels();
    const invalidPrimitive = await new SupabaseM2AcademicLevelReadRepository(new Fake({ "m2.academic-level.list": [{ ...levelRow, updated_at: {} }] })).listAcademicLevels();
    const invalidCourse = await new SupabaseM2BrandCourseReadRepository(new Fake({ "m2.brand-course.list-brand": [{ ...courseRow, course_scope: "invalid" }] })).listBrandCourses({ brand });
    ok(!invalidDate.ok && invalidDate.error.code === "persistence_data_invalid", "invalid Date mapping"); ok(!invalidPrimitive.ok && invalidPrimitive.error.code === "persistence_data_invalid", "invalid timestamp primitive mapping"); ok(!invalidCourse.ok && invalidCourse.error.code === "persistence_data_invalid", "invalid course scope mapping");
  });

  await test("brand lists bind scope and preserve null module", async () => {
    const transport = new Fake({ "m2.brand-course.list-brand": [courseRow], "m2.brand-instructor.list-brand": [], "m2.course-instructor.list-brand-course": [] });
    const courses = await new SupabaseM2BrandCourseReadRepository(transport).listBrandCourses({ brand }); await new SupabaseM2BrandInstructorReadRepository(transport).listBrandInstructors({ brand }); await new SupabaseM2CourseInstructorReadRepository(transport).listCourseInstructors({ brand, courseId: "course-1" });
    ok(courses.ok && courses.value[0]?.academicModuleId === null, "standalone course mapping"); ok(transport.requests.every((request) => request.values[0] === brand.brandId), "brand binding"); transport.requests.forEach(select);
  });

  await test("cross-brand misses and transport failures do not leak", async () => {
    const missing = await new SupabaseM2BrandCourseReadRepository(new Fake({})).findBrandCourseById({ brand, courseId: "other" }); const failed = await new SupabaseM2InstructorReadRepository(new Fake({}, true)).listInstructors();
    ok(!missing.ok && missing.error.code === "not_found" && !missing.error.message.includes("other"), "cross-brand not found"); ok(!failed.ok && failed.error.code === "query_failed", "transport error mapping");
  });

  return { passed: cases.every((testCase) => testCase.passed), cases };
}

if (process.argv[1]?.endsWith("m2-supabase-read-repositories.selftest.js")) {
  runM2SupabaseReadRepositorySelfTest().then((result) => { if (!result.passed) process.exitCode = 1; else console.log("m2 supabase read repository selftest passed"); });
}
