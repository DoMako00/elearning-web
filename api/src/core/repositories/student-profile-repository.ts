import type { StudentProfile } from "../../domain";
import type { BrandScopedQuery, BrandScopedLookup, AppUserId, StudentProfileId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface StudentAcademicProfile {
  readonly profileId: StudentProfileId;
  readonly summaryReference?: string;
}

export interface StudentProfileRepository {
  findStudentProfileByUserId(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<StudentProfile>>;
  findStudentProfileByBrand(input: BrandScopedQuery): Promise<RepositoryResult<readonly StudentProfile[]>>;
  findStudentAcademicProfile(input: BrandScopedLookup<StudentProfileId>): Promise<RepositoryResult<StudentAcademicProfile>>;
}

