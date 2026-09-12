import type { Seat } from "../../domain";
import type { BrandScopedLookup, SeatId, SubscriptionId, AppUserId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface SeatRepository {
  findSeatById(input: BrandScopedLookup<SeatId>): Promise<RepositoryResult<Seat>>;
  findSeatsForSubscription(input: BrandScopedLookup<SubscriptionId>): Promise<RepositoryResult<readonly Seat[]>>;
  findSeatForUserBrand(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<Seat>>;
  findActiveSeatForUserBrand(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<Seat>>;
}
