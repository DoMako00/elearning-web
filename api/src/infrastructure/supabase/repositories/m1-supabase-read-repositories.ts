import type { BrandScope } from "../../../core/brand-scope";
import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type {
  M1AdminPermission,
  M1AdminPermissionReadRepository,
  M1AdminProfile,
  M1AdminProfileReadRepository,
  M1AdminRole,
  M1AdminRoleAssignment,
  M1AdminRoleAssignmentReadRepository,
  M1AdminRolePermission,
  M1AdminRolePermissionReadRepository,
  M1AdminRoleReadRepository,
  M1AppUser,
  M1AppUserReadRepository,
  M1BrandMembership,
  M1BrandMembershipReadRepository,
  M1EducationalBrand,
  M1EducationalBrandReadRepository,
  M1StudentProfile,
  M1StudentProfileReadRepository,
} from "../../../core/repositories";
import type { ReadQueryRequest, ReadQueryTransport } from "../read-query-transport";

type Row = Readonly<Record<string, unknown>>;

function requiredString(row: Row, column: string): string {
  const value = row[column];
  if (typeof value !== "string" || !value) throw new Error(`Required persistence column is malformed: ${column}.`);
  return value;
}

function nullableString(row: Row, column: string): string | null {
  const value = row[column];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`Nullable persistence column is malformed: ${column}.`);
  return value;
}

function oneOf<T extends string>(row: Row, column: string, allowed: readonly T[]): T {
  const value = requiredString(row, column);
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Persistence status is malformed: ${column}.`);
}

function mapResult<T>(
  result: RepositoryResult<Row>,
  mapper: (row: Row) => T,
  correlationId?: string,
): RepositoryResult<T> {
  if (!result.ok) return result;
  try {
    return repositoryOk(mapper(result.value));
  } catch {
    return repositoryErr({ code: "persistence_data_invalid", message: "Persisted data is malformed.", correlationId });
  }
}

function mapListResult<T>(
  result: RepositoryResult<readonly Row[]>,
  mapper: (row: Row) => T,
  correlationId?: string,
): RepositoryResult<readonly T[]> {
  if (!result.ok) return result;
  try {
    return repositoryOk(result.value.map(mapper));
  } catch {
    return repositoryErr({ code: "persistence_data_invalid", message: "Persisted data is malformed.", correlationId });
  }
}

class SupabaseM1ReadRepositoryBase {
  constructor(protected readonly transport: ReadQueryTransport) {}

  protected async one(request: ReadQueryRequest, correlationId?: string): Promise<RepositoryResult<Row>> {
    try {
      const result = await this.transport.query<Row>(request);
      return result.rows[0]
        ? repositoryOk(result.rows[0])
        : repositoryErr({ code: "not_found", message: "Requested record was not found.", correlationId });
    } catch {
      return repositoryErr({ code: "query_failed", message: "Persistence read failed.", correlationId });
    }
  }

  protected async many(request: ReadQueryRequest, correlationId?: string): Promise<RepositoryResult<readonly Row[]>> {
    try {
      return repositoryOk((await this.transport.query<Row>(request)).rows);
    } catch {
      return repositoryErr({ code: "query_failed", message: "Persistence read failed.", correlationId });
    }
  }
}

function mapEducationalBrand(row: Row): M1EducationalBrand {
  return {
    id: requiredString(row, "id"), code: oneOf(row, "code", ["medway", "elite"]), name: requiredString(row, "name"),
    slug: requiredString(row, "slug"), status: oneOf(row, "status", ["active", "inactive"]),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapAppUser(row: Row): M1AppUser {
  return {
    id: requiredString(row, "id"), authUserId: requiredString(row, "auth_user_id"),
    primaryEmail: nullableString(row, "primary_email"), primaryPhone: nullableString(row, "primary_phone"),
    status: oneOf(row, "status", ["active", "disabled", "anonymized"]),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapBrandMembership(row: Row): M1BrandMembership {
  return {
    id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), appUserId: requiredString(row, "app_user_id"),
    membershipType: oneOf(row, "membership_type", ["student", "admin_candidate", "staff"]),
    status: oneOf(row, "status", ["pending_payment", "pending_review", "active", "suspended", "expired", "cancelled", "rejected"]),
    activatedAt: nullableString(row, "activated_at"), suspendedAt: nullableString(row, "suspended_at"),
    expiredAt: nullableString(row, "expired_at"), cancelledAt: nullableString(row, "cancelled_at"), rejectedAt: nullableString(row, "rejected_at"),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapStudentProfile(row: Row): M1StudentProfile {
  return {
    id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), appUserId: requiredString(row, "app_user_id"),
    brandMembershipId: requiredString(row, "brand_membership_id"), fullName: requiredString(row, "full_name"),
    phone: nullableString(row, "phone"), email: nullableString(row, "email"), academicYear: nullableString(row, "academic_year"),
    academicTerm: nullableString(row, "academic_term"), university: nullableString(row, "university"), studentId: nullableString(row, "student_id"),
    status: oneOf(row, "status", ["pending", "active", "suspended", "archived"]),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapAdminProfile(row: Row): M1AdminProfile {
  return {
    id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), appUserId: requiredString(row, "app_user_id"),
    displayName: requiredString(row, "display_name"), status: oneOf(row, "status", ["active", "suspended", "revoked"]),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapAdminPermission(row: Row): M1AdminPermission {
  return {
    id: requiredString(row, "id"), code: requiredString(row, "code"), category: requiredString(row, "category"),
    description: nullableString(row, "description"), status: oneOf(row, "status", ["active", "deprecated", "disabled"]),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapAdminRole(row: Row): M1AdminRole {
  return {
    id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), code: requiredString(row, "code"),
    name: requiredString(row, "name"), description: nullableString(row, "description"),
    status: oneOf(row, "status", ["active", "disabled", "archived"]),
    createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

function mapAdminRolePermission(row: Row): M1AdminRolePermission {
  return { roleId: requiredString(row, "role_id"), permissionId: requiredString(row, "permission_id"), createdAt: requiredString(row, "created_at") };
}

function mapAdminRoleAssignment(row: Row): M1AdminRoleAssignment {
  return {
    id: requiredString(row, "id"), brandId: requiredString(row, "brand_id"), adminProfileId: requiredString(row, "admin_profile_id"),
    roleId: requiredString(row, "role_id"), assignedByAdminProfileId: nullableString(row, "assigned_by_admin_profile_id"),
    assignedAt: requiredString(row, "assigned_at"), revokedAt: nullableString(row, "revoked_at"),
    status: oneOf(row, "status", ["active", "revoked"]), createdAt: requiredString(row, "created_at"), updatedAt: requiredString(row, "updated_at"),
  };
}

const educationalBrandColumns = "id, code, name, slug, status, created_at, updated_at";
const appUserColumns = "id, auth_user_id, primary_email, primary_phone, status, created_at, updated_at";
const membershipColumns = "id, brand_id, app_user_id, membership_type, status, activated_at, suspended_at, expired_at, cancelled_at, rejected_at, created_at, updated_at";
const studentProfileColumns = "id, brand_id, app_user_id, brand_membership_id, full_name, phone, email, academic_year, academic_term, university, student_id, status, created_at, updated_at";
const adminProfileColumns = "id, brand_id, app_user_id, display_name, status, created_at, updated_at";
const adminPermissionColumns = "id, code, category, description, status, created_at, updated_at";
const adminRoleColumns = "id, brand_id, code, name, description, status, created_at, updated_at";
const adminRoleAssignmentColumns = "id, brand_id, admin_profile_id, role_id, assigned_by_admin_profile_id, assigned_at, revoked_at, status, created_at, updated_at";

export class SupabaseM1EducationalBrandReadRepository extends SupabaseM1ReadRepositoryBase implements M1EducationalBrandReadRepository {
  async findEducationalBrandById(input: { readonly id: string; readonly correlationId?: string }): Promise<RepositoryResult<M1EducationalBrand>> {
    return mapResult(await this.one({ label: "m1.educational-brand.by-id", text: `select ${educationalBrandColumns} from app.educational_brands where id = $1 limit 1`, values: [input.id] }, input.correlationId), mapEducationalBrand, input.correlationId);
  }
  async findEducationalBrandByCode(input: { readonly code: "medway" | "elite"; readonly correlationId?: string }): Promise<RepositoryResult<M1EducationalBrand>> {
    return mapResult(await this.one({ label: "m1.educational-brand.by-code", text: `select ${educationalBrandColumns} from app.educational_brands where code = $1 limit 1`, values: [input.code] }, input.correlationId), mapEducationalBrand, input.correlationId);
  }
}

export class SupabaseM1AppUserReadRepository extends SupabaseM1ReadRepositoryBase implements M1AppUserReadRepository {
  async findAppUserById(input: { readonly id: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AppUser>> {
    return mapResult(await this.one({ label: "m1.app-user.by-id", text: `select ${appUserColumns} from app.app_users where id = $1 limit 1`, values: [input.id] }, input.correlationId), mapAppUser, input.correlationId);
  }
  async findAppUserByAuthUserId(input: { readonly authUserId: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AppUser>> {
    return mapResult(await this.one({ label: "m1.app-user.by-auth-user-id", text: `select ${appUserColumns} from app.app_users where auth_user_id = $1 limit 1`, values: [input.authUserId] }, input.correlationId), mapAppUser, input.correlationId);
  }
}

export class SupabaseM1BrandMembershipReadRepository extends SupabaseM1ReadRepositoryBase implements M1BrandMembershipReadRepository {
  async findBrandMembershipByUserId(input: { readonly appUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1BrandMembership>> {
    return mapResult(await this.one({ label: "m1.brand-membership.by-user-brand", text: `select ${membershipColumns} from app.brand_memberships where app_user_id = $1 and brand_id = $2 limit 1`, values: [input.appUserId, input.brand.brandId] }, input.correlationId), mapBrandMembership, input.correlationId);
  }
}

export class SupabaseM1StudentProfileReadRepository extends SupabaseM1ReadRepositoryBase implements M1StudentProfileReadRepository {
  async findStudentProfileById(input: { readonly id: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1StudentProfile>> {
    return mapResult(await this.one({ label: "m1.student-profile.by-id-brand", text: `select ${studentProfileColumns} from app.student_profiles where id = $1 and brand_id = $2 limit 1`, values: [input.id, input.brand.brandId] }, input.correlationId), mapStudentProfile, input.correlationId);
  }
  async findStudentProfileByUserId(input: { readonly appUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1StudentProfile>> {
    return mapResult(await this.one({ label: "m1.student-profile.by-user-brand", text: `select ${studentProfileColumns} from app.student_profiles where app_user_id = $1 and brand_id = $2 limit 1`, values: [input.appUserId, input.brand.brandId] }, input.correlationId), mapStudentProfile, input.correlationId);
  }
  async listStudentProfilesByBrand(input: { readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1StudentProfile[]>> {
    return mapListResult(await this.many({ label: "m1.student-profile.list-brand", text: `select ${studentProfileColumns} from app.student_profiles where brand_id = $1 order by created_at asc`, values: [input.brand.brandId] }, input.correlationId), mapStudentProfile, input.correlationId);
  }
}

export class SupabaseM1AdminProfileReadRepository extends SupabaseM1ReadRepositoryBase implements M1AdminProfileReadRepository {
  async findAdminProfileById(input: { readonly id: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminProfile>> {
    return mapResult(await this.one({ label: "m1.admin-profile.by-id-brand", text: `select ${adminProfileColumns} from app.admin_profiles where id = $1 and brand_id = $2 limit 1`, values: [input.id, input.brand.brandId] }, input.correlationId), mapAdminProfile, input.correlationId);
  }
  async findAdminProfileByUserId(input: { readonly appUserId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminProfile>> {
    return mapResult(await this.one({ label: "m1.admin-profile.by-user-brand", text: `select ${adminProfileColumns} from app.admin_profiles where app_user_id = $1 and brand_id = $2 limit 1`, values: [input.appUserId, input.brand.brandId] }, input.correlationId), mapAdminProfile, input.correlationId);
  }
}

export class SupabaseM1AdminRoleReadRepository extends SupabaseM1ReadRepositoryBase implements M1AdminRoleReadRepository {
  async findAdminRoleById(input: { readonly id: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminRole>> {
    return mapResult(await this.one({ label: "m1.admin-role.by-id-brand", text: `select ${adminRoleColumns} from app.admin_roles where id = $1 and brand_id = $2 limit 1`, values: [input.id, input.brand.brandId] }, input.correlationId), mapAdminRole, input.correlationId);
  }
  async listAdminRolesByBrand(input: { readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminRole[]>> {
    return mapListResult(await this.many({ label: "m1.admin-role.list-brand", text: `select ${adminRoleColumns} from app.admin_roles where brand_id = $1 order by code asc`, values: [input.brand.brandId] }, input.correlationId), mapAdminRole, input.correlationId);
  }
}

export class SupabaseM1AdminPermissionReadRepository extends SupabaseM1ReadRepositoryBase implements M1AdminPermissionReadRepository {
  async findAdminPermissionById(input: { readonly id: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminPermission>> {
    return mapResult(await this.one({ label: "m1.admin-permission.by-id", text: `select ${adminPermissionColumns} from app.admin_permissions where id = $1 limit 1`, values: [input.id] }, input.correlationId), mapAdminPermission, input.correlationId);
  }
  async findAdminPermissionByCode(input: { readonly code: string; readonly correlationId?: string }): Promise<RepositoryResult<M1AdminPermission>> {
    return mapResult(await this.one({ label: "m1.admin-permission.by-code", text: `select ${adminPermissionColumns} from app.admin_permissions where code = $1 limit 1`, values: [input.code] }, input.correlationId), mapAdminPermission, input.correlationId);
  }
}

export class SupabaseM1AdminRolePermissionReadRepository extends SupabaseM1ReadRepositoryBase implements M1AdminRolePermissionReadRepository {
  async listAdminRolePermissions(input: { readonly roleId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminRolePermission[]>> {
    return mapListResult(await this.many({ label: "m1.admin-role-permission.list-role-brand", text: "select rp.role_id, rp.permission_id, rp.created_at from app.admin_role_permissions rp inner join app.admin_roles r on r.id = rp.role_id where rp.role_id = $1 and r.brand_id = $2 order by rp.permission_id asc", values: [input.roleId, input.brand.brandId] }, input.correlationId), mapAdminRolePermission, input.correlationId);
  }
}

export class SupabaseM1AdminRoleAssignmentReadRepository extends SupabaseM1ReadRepositoryBase implements M1AdminRoleAssignmentReadRepository {
  async listAdminRoleAssignmentsForProfile(input: { readonly adminProfileId: string; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<readonly M1AdminRoleAssignment[]>> {
    return mapListResult(await this.many({ label: "m1.admin-role-assignment.list-profile-brand", text: `select ${adminRoleAssignmentColumns} from app.admin_role_assignments where admin_profile_id = $1 and brand_id = $2 order by assigned_at asc`, values: [input.adminProfileId, input.brand.brandId] }, input.correlationId), mapAdminRoleAssignment, input.correlationId);
  }
}
