import type { AuthVerificationInput, VerifiedAuthIdentity } from "../auth";
import type { BrandResolutionInput, BrandScope } from "../brand-scope";
import type {
  AdminProfileId,
  AppUserId,
  DeviceId,
  SessionId,
  StudentProfileId,
} from "../persistence";
import type { ActorType } from "./request-context";

export type AuthenticationMode = "required" | "allow_anonymous";

export interface RequestContextInput {
  readonly requestId: string;
  readonly correlationId: string;
  readonly auth: AuthVerificationInput;
  readonly requestedBrandCode?: string;
  readonly requestedBrandId?: string;
  readonly targetBrandCode?: string;
  readonly targetBrandId?: string;
  readonly authenticationMode?: AuthenticationMode;
  readonly expectedActorType?: Exclude<ActorType, "anonymous">;
  readonly verifiedIdentity?: VerifiedAuthIdentity;
  readonly resolvedBrand?: BrandScope;
  readonly actorUserId?: AppUserId;
  readonly adminProfileId?: AdminProfileId;
  readonly studentProfileId?: StudentProfileId;
  readonly sessionId?: SessionId;
  readonly deviceId?: DeviceId;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly reason?: string;
  readonly idempotencyKey?: string;
}

export function brandInputFromRequest(input: RequestContextInput): BrandResolutionInput {
  return {
    requestedBrandCode: input.requestedBrandCode,
    requestedBrandId: input.requestedBrandId,
    correlationId: input.correlationId,
  };
}
