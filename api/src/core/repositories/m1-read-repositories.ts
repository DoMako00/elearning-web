import type { BrandScope } from "../brand-scope";
import type { RepositoryResult } from "../persistence";

export interface M1EducationalBrand {
  readonly id: string;
  readonly code: "medway" | "elite";
  readonly name: string;
  readonly slug: string;
  readonly status: "active" | "inactive";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1AppUser {
  readonly id: string;
  readonly authUserId: string;
  readonly primaryEmail: string | null;
  readonly primaryPhone: string | null;
  readonly status: "active" | "disabled" | "anonymized";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1BrandMembership {
  readonly id: string;
  readonly brandId: string;
  readonly appUserId: string;
  readonly membershipType: "student" | "admin_candidate" | "staff";
  readonly status: "pending_payment" | "pending_review" | "active" | "suspended" | "expired" | "cancelled" | "rejected";
  readonly activatedAt: string | null;
  readonly suspendedAt: string | null;
  readonly expiredAt: string | null;
  readonly cancelledAt: string | null;
  readonly rejectedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1StudentProfile {
  readonly id: string;
  readonly brandId: string;
  readonly appUserId: string;
  readonly brandMembershipId: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly academicYear: string | null;
  readonly academicTerm: string | null;
  readonly university: string | null;
  readonly studentId: string | null;
  readonly status: "pending" | "active" | "suspended" | "archived";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1AdminProfile {
  readonly id: string;
  readonly brandId: string;
  readonly appUserId: string;
  readonly displayName: string;
  readonly status: "active" | "suspended" | "revoked";
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Backend-only projection of the existing M1 authority tables. This is not a
 * second RBAC model: it binds one authenticated application user to one
 * brand-scoped Admin profile and its active role/permission state.
 */
export interface M1AdminAuthorizationSnapshot {
  readonly appUser: M1AppUser;
  readonly adminProfile: M1AdminProfile;
  readonly roleCodes: readonly string[];
  readonly permissionCodes: readonly string[];
}

export interface M1AdminPermission {
  readonly id: string;
  readonly code: string;
  readonly category: string;
  readonly description: string | null;
  readonly status: "active" | "deprecated" | "disabled";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1AdminRole {
  readonly id: string;
  readonly brandId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: "active" | "disabled" | "archived";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1AdminRolePermission {
  readonly roleId: string;
  readonly permissionId: string;
  readonly createdAt: string;
}

export interface M1AdminRoleAssignment {
  readonly id: string;
  readonly brandId: string;
  readonly adminProfileId: string;
  readonly roleId: string;
  readonly assignedByAdminProfileId: string | null;
  readonly assignedAt: string;
  readonly revokedAt: string | null;
  readonly status: "active" | "revoked";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface M1EducationalBrandReadRepository {
  findEducationalBrandById(input: { readonly id: string; readonly correlationId?: string }): Promise<RepositoryResult<M1EducationalBrand>>;
  findEducationalBrandByCode(input: { readonly code: "medway" | "elite"; readonly correlationId?: string }): Promise<RepositoryResult<M1EducationalBrand>>;
}

/** app_users are global identities. These methods deliberately take no brand scope. */
export interface M1AppUserReadRepository {
  findAppUserById(input: { readonly id: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AppUser>>;
  findAppUserByAuthUserId(input: { readonly authUserId: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AppUser>>;
}

export interface M1BrandMembershipReadRepository {
  findBrandMembershipByUserId(input: { readonly appUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1BrandMembership>>;
}

export interface M1StudentProfileReadRepository {
  findStudentProfileById(input: { readonly id: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1StudentProfile>>;
  findStudentProfileByUserId(input: { readonly appUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1StudentProfile>>;
  listStudentProfilesByBrand(input: { readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1StudentProfile[]>>;
}

export interface M1AdminProfileReadRepository {
  findAdminProfileById(input: { readonly id: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminProfile>>;
  findAdminProfileByUserId(input: { readonly appUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminProfile>>;
  resolveAdminAuthorizationByAuthUserId(input: { readonly authUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminAuthorizationSnapshot>>;
  listAdminAuthorizationsByAuthUserId(input: { readonly authUserId: string; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminAuthorizationSnapshot[]>>;
}

export interface M1AdminRoleReadRepository {
  findAdminRoleById(input: { readonly id: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminRole>>;
  listAdminRolesByBrand(input: { readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminRole[]>>;
}

export interface M1AdminPermissionReadRepository {
  findAdminPermissionById(input: { readonly id: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminPermission>>;
  findAdminPermissionByCode(input: { readonly code: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminPermission>>;
}

export interface M1AdminRolePermissionReadRepository {
  listAdminRolePermissions(input: { readonly roleId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminRolePermission[]>>;
}

export interface M1AdminRoleAssignmentReadRepository {
  listAdminRoleAssignmentsForProfile(input: { readonly adminProfileId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminRoleAssignment[]>>;
}
