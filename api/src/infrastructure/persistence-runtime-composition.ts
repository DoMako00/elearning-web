import type { M1ReadRepositories, PersistenceRuntimeComposition } from "../core/persistence/runtime-composition";
import type { M2ReadRepositories } from "../core/repositories";
import type { SupabaseBoundaryEnvironment } from "./supabase/supabase-config";
import {
  SupabaseM1AdminPermissionReadRepository,
  SupabaseM1AdminProfileReadRepository,
  SupabaseM1AdminRoleAssignmentReadRepository,
  SupabaseM1AdminRolePermissionReadRepository,
  SupabaseM1AdminRoleReadRepository,
  SupabaseM1AppUserReadRepository,
  SupabaseM1BrandMembershipReadRepository,
  SupabaseM1EducationalBrandReadRepository,
  SupabaseM1StudentProfileReadRepository,
  SupabaseM2AcademicLevelReadRepository, SupabaseM2AcademicSemesterReadRepository, SupabaseM2AcademicModuleReadRepository, SupabaseM2AcademicModuleAliasReadRepository, SupabaseM2InstructorReadRepository, SupabaseM2BrandInstructorReadRepository, SupabaseM2BrandCourseReadRepository, SupabaseM2CourseInstructorReadRepository,
} from "./supabase/repositories";
import { createPostgresReadTransportFromEnvironment, type PostgresPoolFactory } from "./postgres";

export interface PersistenceRuntimeCompositionOptions {
  readonly environment?: SupabaseBoundaryEnvironment;
  readonly poolFactory?: PostgresPoolFactory;
}
function createM2ReadRepositories(transport: NonNullable<PersistenceRuntimeComposition["readTransport"]>): M2ReadRepositories { return { academicLevels:new SupabaseM2AcademicLevelReadRepository(transport), academicSemesters:new SupabaseM2AcademicSemesterReadRepository(transport), academicModules:new SupabaseM2AcademicModuleReadRepository(transport), academicModuleAliases:new SupabaseM2AcademicModuleAliasReadRepository(transport), instructors:new SupabaseM2InstructorReadRepository(transport), instructorBrandAssignments:new SupabaseM2BrandInstructorReadRepository(transport), brandCourses:new SupabaseM2BrandCourseReadRepository(transport), courseInstructorAssignments:new SupabaseM2CourseInstructorReadRepository(transport) }; }

function createMockComposition(): PersistenceRuntimeComposition {
  return { provider: "mock", status: "mock-disabled", close: async () => undefined };
}

function createM1ReadRepositories(transport: NonNullable<PersistenceRuntimeComposition["readTransport"]>): M1ReadRepositories {
  return {
    educationalBrands: new SupabaseM1EducationalBrandReadRepository(transport),
    appUsers: new SupabaseM1AppUserReadRepository(transport),
    brandMemberships: new SupabaseM1BrandMembershipReadRepository(transport),
    studentProfiles: new SupabaseM1StudentProfileReadRepository(transport),
    adminProfiles: new SupabaseM1AdminProfileReadRepository(transport),
    adminPermissions: new SupabaseM1AdminPermissionReadRepository(transport),
    adminRoles: new SupabaseM1AdminRoleReadRepository(transport),
    adminRolePermissions: new SupabaseM1AdminRolePermissionReadRepository(transport),
    adminRoleAssignments: new SupabaseM1AdminRoleAssignmentReadRepository(transport),
  };
}

export function createPersistenceRuntimeComposition(
  options: PersistenceRuntimeCompositionOptions = {},
): PersistenceRuntimeComposition {
  const boundary = createPostgresReadTransportFromEnvironment(options.environment, options.poolFactory);
  if (boundary.kind === "mock-disabled") return createMockComposition();

  const transport = boundary.transport;
  let closePromise: Promise<void> | undefined;
  return {
    provider: "supabase",
    status: "supabase-read-only-configured",
    readTransport: transport,
    m1Repositories: createM1ReadRepositories(transport),
    m2Repositories: createM2ReadRepositories(transport),
    close: () => {
      if (!closePromise) closePromise = transport.close();
      return closePromise;
    },
  };
}
