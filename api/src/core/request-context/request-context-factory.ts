import type { AuthVerificationInput, VerifiedAuthIdentity } from "../auth";
import type { BrandResolutionInput, BrandScope } from "../brand-scope";
import type {
  AdminProfileId,
  AppUserId,
  DeviceId,
  SessionId,
  StudentProfileId,
} from "../persistence";
import type { RepositoryResult } from "../persistence";
import type { ActorType, RequestContext } from "./request-context";

export interface RequestContextInput {
  readonly requestId: string;
  readonly correlationId: string;
  readonly auth: AuthVerificationInput;
  readonly verifiedIdentity?: VerifiedAuthIdentity;
  readonly brand: BrandResolutionInput;
  readonly actorType?: ActorType;
  readonly actorUserId?: AppUserId;
  readonly adminProfileId?: AdminProfileId;
  readonly studentProfileId?: StudentProfileId;
  readonly sessionId?: SessionId;
  readonly deviceId?: DeviceId;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly ip?: string;
  readonly userAgent?: string;
  readonly reason?: string;
  readonly idempotencyKey?: string;
}

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

