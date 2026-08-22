import type {
  M1AdminPermissionReadRepository,
  M1AdminProfileReadRepository,
  M1AdminRoleAssignmentReadRepository,
  M1AdminRolePermissionReadRepository,
  M1AdminRoleReadRepository,
  M1AppUserReadRepository,
  M1BrandMembershipReadRepository,
  M1EducationalBrandReadRepository,
  M1StudentProfileReadRepository,
} from "../repositories";
import type { M2ReadRepositories } from "../repositories";
import type { ReadQueryTransport } from "../../infrastructure/supabase/read-query-transport";

export interface M1ReadRepositories {
  readonly educationalBrands: M1EducationalBrandReadRepository;
  readonly appUsers: M1AppUserReadRepository;
  readonly brandMemberships: M1BrandMembershipReadRepository;
  readonly studentProfiles: M1StudentProfileReadRepository;
  readonly adminProfiles: M1AdminProfileReadRepository;
  readonly adminPermissions: M1AdminPermissionReadRepository;
  readonly adminRoles: M1AdminRoleReadRepository;
  readonly adminRolePermissions: M1AdminRolePermissionReadRepository;
  readonly adminRoleAssignments: M1AdminRoleAssignmentReadRepository;
}

export type PersistenceRuntimeProvider = "mock" | "supabase";
export type PersistenceRuntimeStatus = "mock-disabled" | "supabase-read-only-configured";

export interface PersistenceRuntimeComposition {
  readonly provider: PersistenceRuntimeProvider;
  readonly status: PersistenceRuntimeStatus;
  readonly readTransport?: ReadQueryTransport;
  readonly m1Repositories?: M1ReadRepositories;
  readonly m2Repositories?: M2ReadRepositories;
  close(): Promise<void>;
}
