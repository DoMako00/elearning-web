import type { BrandCode, BrandId, BrandScope } from "../brand-scope";
import type {
  AdminProfileId,
  AppUserId,
  AuthIdentityId,
  DeviceId,
  SessionId,
  StudentProfileId,
} from "../persistence";

/** Canonical future request actors. The current AdminRequestContext remains a compatibility boundary. */
export type ActorType = "anonymous" | "student" | "admin" | "system";

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly actorAuthId: AuthIdentityId | null;
  readonly actorUserId: AppUserId | null;
  readonly actorType: ActorType;
  readonly activeBrandCode: BrandCode;
  readonly activeBrandId?: BrandId;
  readonly brand: BrandScope;
  readonly adminProfileId?: AdminProfileId;
  readonly studentProfileId?: StudentProfileId;
  readonly sessionId?: SessionId;
  readonly deviceId?: DeviceId;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly ip?: string;
  readonly userAgent?: string;
  readonly reason?: string;
  readonly idempotencyKey?: string;
}
