import type { AuthIdentityAdapter } from "../../core/auth";
import type { PersistenceRuntimeComposition } from "../../core/persistence/runtime-composition";
import type { SupabaseBoundaryEnvironment } from "../../infrastructure/supabase/supabase-config";
import { resolveSupabaseAuthConfiguration } from "../../infrastructure/supabase/supabase-auth-config";
import { SupabaseJwtJwksAuthIdentityAdapter } from "../../infrastructure/supabase/supabase-jwt-adapter";
import { PostgresStudentCourseReadModel, type StudentCourseReadModel } from "./student-course-read-model";

export interface StudentCourses {
  readonly auth: AuthIdentityAdapter;
  readonly readModel: StudentCourseReadModel;
}

export function createStudentCourses(persistence: PersistenceRuntimeComposition, environment: SupabaseBoundaryEnvironment): StudentCourses | undefined {
  if (persistence.provider !== "supabase" || !persistence.readTransport || environment.AUTH_PROVIDER?.trim() !== "supabase") return undefined;
  return {
    auth: new SupabaseJwtJwksAuthIdentityAdapter(resolveSupabaseAuthConfiguration(environment)),
    readModel: new PostgresStudentCourseReadModel(persistence.readTransport),
  };
}
