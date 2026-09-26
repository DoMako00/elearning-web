import type { AdminUser } from "../../domain";
import type { BrandScopedQuery, BrandScopedLookup, AdminProfileId, AppUserId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface AdminPermissionSnapshot {
  readonly permissionCodes: readonly string[];
  readonly roleCodes: readonly string[];
  readonly isGlobalRole: boolean;
}

export interface AdminProfileRepository {
  findAdminProfileByUserId(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<AdminUser>>;
  findAdminProfileById(input: BrandScopedLookup<AdminProfileId>): Promise<RepositoryResult<AdminUser>>;
  findAdminBrandScopes(input: { readonly userId: AppUserId; readonly correlationId?: string }): Promise<RepositoryResult<readonly BrandScopedQuery["brand"][]>>;
  findAdminPermissions(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<AdminPermissionSnapshot>>;
}

