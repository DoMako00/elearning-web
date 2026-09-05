import type { RepositoryResult } from "../../../core/persistence";
import type { M2AcademicLevel, M2AcademicSemester, M2AcademicModule, M2Instructor, M2InstructorBrandAssignment, M2BrandCourse, M2CourseInstructorAssignment } from "../../../core/repositories";

export type AcademicLevelAdminDto = M2AcademicLevel;
export type AcademicSemesterAdminDto = M2AcademicSemester;
export type AcademicModuleAdminDto = M2AcademicModule;
export type InstructorAdminDto = M2Instructor;
export type InstructorBrandAssignmentAdminDto = M2InstructorBrandAssignment;
export type BrandCourseAdminDto = M2BrandCourse;
export type CourseInstructorAssignmentAdminDto = M2CourseInstructorAssignment;

export interface AdminM2ReadModel {
  listAcademicLevels(input?: { readonly correlationId?: string }): Promise<RepositoryResult<readonly AcademicLevelAdminDto[]>>;
  listAcademicSemesters(input: { readonly levelId?: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly AcademicSemesterAdminDto[]>>;
  listAcademicModules(input: { readonly semesterId?: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly AcademicModuleAdminDto[]>>;
  findAcademicModule(input: { readonly moduleId: string; readonly correlationId?: string }): Promise<RepositoryResult<AcademicModuleAdminDto>>;
  listInstructors(input?: { readonly correlationId?: string }): Promise<RepositoryResult<readonly InstructorAdminDto[]>>;
  findInstructor(input: { readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<InstructorAdminDto>>;
  listInstructorBrandAssignments(input: { readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly InstructorBrandAssignmentAdminDto[]>>;
  listBrandInstructors(input: { readonly brandId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly InstructorBrandAssignmentAdminDto[]>>;
  findBrandInstructor(input: { readonly brandId: string; readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<InstructorBrandAssignmentAdminDto>>;
  listBrandCourses(input: { readonly brandId: string; readonly academicModuleId?: string; readonly scope?: "standalone"; readonly correlationId?: string }): Promise<RepositoryResult<readonly BrandCourseAdminDto[]>>;
  findBrandCourse(input: { readonly brandId: string; readonly courseId: string; readonly correlationId?: string }): Promise<RepositoryResult<BrandCourseAdminDto>>;
  listCourseInstructors(input: { readonly brandId: string; readonly courseId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly CourseInstructorAssignmentAdminDto[]>>;
  listInstructorCourseAssignments(input: { readonly brandId: string; readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly CourseInstructorAssignmentAdminDto[]>>;
}
