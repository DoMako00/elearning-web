import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type { AdminM2ReadModel, AcademicLevelAdminDto, AcademicSemesterAdminDto, AcademicModuleAdminDto, InstructorAdminDto, BrandInstructorAdminDto, BrandCourseAdminDto, CourseInstructorAdminDto } from "./admin-m2-read-model";

const missing = <T>(correlationId?: string): RepositoryResult<T> => repositoryErr({ code: "not_found", message: "The requested admin M2 record was not found.", correlationId });
/** Deterministic mock source. Empty results are intentional and do not represent staging data. */
export class InMemoryAdminM2ReadModel implements AdminM2ReadModel {
  async listAcademicLevels(): Promise<RepositoryResult<readonly AcademicLevelAdminDto[]>> { return repositoryOk([]); }
  async listAcademicSemesters(): Promise<RepositoryResult<readonly AcademicSemesterAdminDto[]>> { return repositoryOk([]); }
  async listAcademicModules(): Promise<RepositoryResult<readonly AcademicModuleAdminDto[]>> { return repositoryOk([]); }
  async findAcademicModule(input: { readonly moduleId: string; readonly correlationId?: string }): Promise<RepositoryResult<AcademicModuleAdminDto>> { return missing(input.correlationId); }
  async listInstructors(): Promise<RepositoryResult<readonly InstructorAdminDto[]>> { return repositoryOk([]); }
  async findInstructor(input: { readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<InstructorAdminDto>> { return missing(input.correlationId); }
  async listBrandInstructors(): Promise<RepositoryResult<readonly BrandInstructorAdminDto[]>> { return repositoryOk([]); }
  async findBrandInstructor(input: { readonly brandId: string; readonly instructorId: string; readonly correlationId?: string }): Promise<RepositoryResult<BrandInstructorAdminDto>> { return missing(input.correlationId); }
  async listBrandCourses(): Promise<RepositoryResult<readonly BrandCourseAdminDto[]>> { return repositoryOk([]); }
  async findBrandCourse(input: { readonly brandId: string; readonly courseId: string; readonly correlationId?: string }): Promise<RepositoryResult<BrandCourseAdminDto>> { return missing(input.correlationId); }
  async listCourseInstructors(): Promise<RepositoryResult<readonly CourseInstructorAdminDto[]>> { return repositoryOk([]); }
  async listInstructorCourseAssignments(): Promise<RepositoryResult<readonly CourseInstructorAdminDto[]>> { return repositoryOk([]); }
}
