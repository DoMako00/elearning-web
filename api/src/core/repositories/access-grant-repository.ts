import type { AccessGrant } from "../../domain";
import type { BrandScopedLookup, AccessGrantId, AppUserId, ResourceId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface AccessGrantRepository {
  findAccessGrantById(input: BrandScopedLookup<AccessGrantId>): Promise<RepositoryResult<AccessGrant>>;
  findActiveAccessGrantsForUserBrand(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly AccessGrant[]>>;
  findGrantForResource(input: BrandScopedLookup<ResourceId> & { readonly userId: AppUserId }): Promise<RepositoryResult<AccessGrant>>;
  findGrantSnapshotForAccessEvaluation(input: BrandScopedLookup<AccessGrantId>): Promise<RepositoryResult<AccessGrant>>;
}
