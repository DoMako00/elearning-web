import type { RepositoryResult } from "../../../core/persistence";

export interface AcademicLevelAdminDto { readonly id: string; readonly levelNumber: number; readonly displayName: string; readonly status: "active" | "inactive"; readonly sortOrder: number; }
export interface AcademicSemesterAdminDto { readonly id: string; readonly academicLevelId: string; readonly semesterNumber: number; readonly displayName: string; readonly phase: "phase_i" | "phase_ii"; readonly status: "active" | "inactive"; readonly sortOrder: number; }
export interface AcademicModuleAdminDto { readonly id: string; readonly academicSemesterId: string; readonly moduleCode: string; readonly title: string; readonly status: "active" | "inactive"; readonly sortOrder: number; }
export interface InstructorAdminDto { readonly id: string; readonly displayName: string; readonly professionalTitle: string | null; readonly status: "active" | "inactive"; readonly createdAt: string; readonly updatedAt: string; }
export interface BrandInstructorAdminDto { readonly id: string; readonly brandId: string; readonly instructorId: string; readonly status: "active" | "inactive"; readonly createdAt: string; readonly updatedAt: string; }
/** Brand courses intentionally omit sortOrder: the reviewed M2 schema has no such column. */
export interface BrandCourseAdminDto { readonly id: string; readonly brandId: string; readonly academicModuleId: string | null; readonly courseCode: string; readonly title: string; readonly courseScope: "curriculum" | "standalone"; readonly status: "draft" | "published" | "archived"; readonly createdAt: string; readonly updatedAt: string; }
export interface CourseInstructorAdminDto { readonly id: string; readonly brandId: string; readonly courseId: string; readonly instructorId: string; readonly status: "active" | "inactive"; readonly createdAt: string; readonly updatedAt: string; }

export interface AdminM2ReadModel {
  listAcademicLevels(input?: { readonly correlationId?: string }): Promise<RepositoryResult<readonly AcademicLevelAdminDto[]>>;
  listAcademicSemesters(input: { readonly levelId?: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly AcademicSemesterAdminDto[]>>;
  listAcademicModules(input: { readonly semesterId?: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly AcademicModuleAdminDto[]>>;
  findAcademicModule(input: { readonly moduleId: string; readonly correlationId?: string }): Promise<RepositoryResult<AcademicModuleAdminDto>>;
  listInstructors(input?: { readonly correlationId?: string }): Promise<RepositoryResult<readonly InstructorAdminDto[]>>;
  findInstructor(input: { readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<InstructorAdminDto>>;
  listBrandInstructors(input: { readonly brandId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly BrandInstructorAdminDto[]>>;
  findBrandInstructor(input: { readonly brandId: string; readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<BrandInstructorAdminDto>>;
  listBrandCourses(input: { readonly brandId: string; readonly academicModuleId?: string; readonly scope?: "standalone"; readonly correlationId?: string }): Promise<RepositoryResult<readonly BrandCourseAdminDto[]>>;
  findBrandCourse(input: { readonly brandId: string; readonly courseId: string; readonly correlationId?: string }): Promise<RepositoryResult<BrandCourseAdminDto>>;
  listCourseInstructors(input: { readonly brandId: string; readonly courseId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly CourseInstructorAdminDto[]>>;
  listInstructorCourseAssignments(input: { readonly brandId: string; readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly CourseInstructorAdminDto[]>>;
}
