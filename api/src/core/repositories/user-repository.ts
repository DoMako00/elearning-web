import type { User } from "../../domain";
import type {
  AppUserId,
  AuthIdentityId,
  BrandScopedQuery,
  BrandScopedLookup,
} from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface UserRepository {
  findUserById(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<User>>;
  findUserByAuthIdentity(input: {
    readonly authIdentityId: AuthIdentityId;
    readonly brand: BrandScopedQuery["brand"];
    readonly correlationId?: string;
  }): Promise<RepositoryResult<User>>;
  findUsersByBrandScope(input: BrandScopedQuery): Promise<RepositoryResult<readonly User[]>>;
}

