import type { Subscription } from "../../domain";
import type { BrandScopedLookup, AppUserId, SubscriptionId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface SubscriptionRepository {
  findSubscriptionById(input: BrandScopedLookup<SubscriptionId>): Promise<RepositoryResult<Subscription>>;
  findActiveSubscriptionsForUserBrand(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly Subscription[]>>;
  findSubscriptionsForSeatOwner(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly Subscription[]>>;
  findSubscriptionSnapshotForAccessEvaluation(input: BrandScopedLookup<SubscriptionId>): Promise<RepositoryResult<Subscription>>;
}
