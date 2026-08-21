import type { VerifiedAuthIdentity } from "../auth";
import type { BrandScope } from "../brand-scope";
import type { RepositoryResult } from "../persistence";
import type { RequestContext } from "./request-context";
import type { RequestContextInput } from "./request-context-input";

export type { RequestContextInput } from "./request-context-input";

/**
 * Trusted context is created by backend middleware. Frontend state and client brand
 * values are inputs only and cannot create authorization authority.
 */
export interface RequestContextFactory {
  create(input: RequestContextInput): Promise<RepositoryResult<RequestContext>>;
  createFromVerifiedIdentity(
    input: Omit<RequestContextInput, "verifiedIdentity"> & {
      readonly verifiedIdentity: VerifiedAuthIdentity;
      readonly resolvedBrand: BrandScope;
    },
  ): Promise<RepositoryResult<RequestContext>>;
}
