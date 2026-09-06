import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type { AdminM2ReadModel, AcademicLevelAdminDto, AcademicSemesterAdminDto, AcademicModuleAdminDto, InstructorAdminDto, InstructorBrandAssignmentAdminDto, BrandCourseAdminDto, CourseInstructorAssignmentAdminDto, CourseChapterAdminDto, CourseLessonAdminDto, LessonResourceAdminDto } from "./admin-m2-read-model";

const missing = <T>(correlationId?: string): RepositoryResult<T> => repositoryErr({ code: "not_found", message: "The requested admin M2 record was not found.", correlationId });
/** Deterministic mock source. Empty results are intentional and do not represent staging data. */
export class InMemoryAdminM2ReadModel implements AdminM2ReadModel {
  async listAcademicLevels(): Promise<RepositoryResult<readonly AcademicLevelAdminDto[]>> { return repositoryOk([]); }
  async listAcademicSemesters(): Promise<RepositoryResult<readonly AcademicSemesterAdminDto[]>> { return repositoryOk([]); }
  async listAcademicModules(): Promise<RepositoryResult<readonly AcademicModuleAdminDto[]>> { return repositoryOk([]); }
  async findAcademicModule(input: { readonly moduleId: string; readonly correlationId?: string }): Promise<RepositoryResult<AcademicModuleAdminDto>> { return missing(input.correlationId); }
  async listInstructors(): Promise<RepositoryResult<readonly InstructorAdminDto[]>> { return repositoryOk([]); }
  async findInstructor(input: { readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<InstructorAdminDto>> { return missing(input.correlationId); }
  async listInstructorBrandAssignments(): Promise<RepositoryResult<readonly InstructorBrandAssignmentAdminDto[]>> { return repositoryOk([]); }
  async listBrandInstructors(): Promise<RepositoryResult<readonly InstructorBrandAssignmentAdminDto[]>> { return repositoryOk([]); }
  async findBrandInstructor(input: { readonly brandId: string; readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<InstructorBrandAssignmentAdminDto>> { return missing(input.correlationId); }
  async listBrandCourses(): Promise<RepositoryResult<readonly BrandCourseAdminDto[]>> { return repositoryOk([]); }
  async findBrandCourse(input: { readonly brandId: string; readonly courseId: string; readonly correlationId?: string }): Promise<RepositoryResult<BrandCourseAdminDto>> { return missing(input.correlationId); }
  async listCourseInstructors(): Promise<RepositoryResult<readonly CourseInstructorAssignmentAdminDto[]>> { return repositoryOk([]); }
  async listInstructorCourseAssignments(): Promise<RepositoryResult<readonly CourseInstructorAssignmentAdminDto[]>> { return repositoryOk([]); }
  async listCourseChapters(): Promise<RepositoryResult<readonly CourseChapterAdminDto[]>> { return repositoryOk([]); }
  async listCourseLessons(): Promise<RepositoryResult<readonly CourseLessonAdminDto[]>> { return repositoryOk([]); }
  async listLessonResources(): Promise<RepositoryResult<readonly LessonResourceAdminDto[]>> { return repositoryOk([]); }
}
