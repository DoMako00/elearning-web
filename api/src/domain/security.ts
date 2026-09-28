import type { Seat, Subscription } from "./commercial";
import type { User } from "./identity";
import type { DocumentAsset, Lesson, VideoAsset } from "./learning";
import { assertRule, assertSamePlatform, isActiveDuring, type AuditedEntity, type EntityId, type Instant, type PlatformScopedEntity, type VersionedPolicyReference } from "./shared";

export interface Device extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly fingerprintReference: string;
  readonly deviceType: "browser" | "mobile" | "tablet" | "desktop" | "other";
  readonly trustStatus: "recognized" | "untrusted" | "revoked";
  readonly firstSeenAt: Instant;
  readonly lastSeenAt: Instant;
  readonly revokedAt: Instant | null;
}

export interface DeviceReplacement extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly replacedDeviceId: EntityId;
  readonly replacementDeviceId: EntityId;
  readonly authorizationChallengeId: EntityId;
  readonly policyReference: VersionedPolicyReference;
  readonly status: "requested" | "approved" | "rejected" | "completed";
  readonly completedAt: Instant | null;
}

export interface AppSession extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly deviceId: EntityId | null;
  readonly issuedAt: Instant;
  readonly expiresAt: Instant;
  readonly revokedAt: Instant | null;
  readonly status: "active" | "expired" | "revoked";
}

export interface AccessGrant extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly scopeType: "product" | "package" | "program" | "subject" | "lesson" | "resource" | "asset";
  readonly scopeId: EntityId;
  readonly sourceType: "subscription" | "seat" | "administrative_exception";
  readonly sourceId: EntityId;
  readonly status: "active" | "suspended" | "expired" | "revoked";
  readonly validFrom: Instant;
  readonly validUntil: Instant | null;
  readonly revokedAt: Instant | null;
  readonly decisionSnapshot: Readonly<Record<string, unknown>>;
}

export interface PlaybackSession extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly appSessionId: EntityId;
  readonly deviceId: EntityId | null;
  readonly accessGrantId: EntityId;
  readonly assetId: EntityId;
  readonly issuedAt: Instant;
  readonly expiresAt: Instant;
  readonly status: "active" | "expired" | "revoked";
}

export type AccessDecisionReason = "access_granted" | "user_inactive" | "session_invalid" | "device_revoked" | "grant_missing" | "grant_inactive" | "scope_mismatch" | "content_unreleased" | "asset_inactive";

export interface AccessDecision extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly resourceType: "lesson" | "video_asset" | "document_asset";
  readonly resourceId: EntityId;
  readonly decision: "allow" | "deny";
  readonly reasonCode: AccessDecisionReason;
  readonly accessGrantId: EntityId | null;
  readonly evaluatedAt: Instant;
}

export interface WatermarkPayload extends PlatformScopedEntity {
  readonly userDisplayName: string;
  readonly sessionId: EntityId;
  readonly issuedAt: Instant;
  readonly templateReference: string;
}

export interface ProtectedContentAuthorization extends PlatformScopedEntity {
  readonly decision: "allow" | "deny";
  readonly reasonCode: AccessDecisionReason;
  readonly accessGrantId: EntityId | null;
  readonly deliveryPolicyReference: VersionedPolicyReference | null;
  readonly watermarkPayload: WatermarkPayload | null;
}

export function validateSubscriptionForGrant(subscription: Subscription, at: Instant) {
  assertRule(subscription.status === "active", "subscription_inactive", "Only active subscriptions can source access grants.");
  assertRule(isActiveDuring(subscription.startsAt, subscription.endsAt, at), "subscription_outside_validity", "The subscription is not currently valid.");
}

export function validateSeatAssignment(subscription: Subscription, seat: Seat, user: User, at: Instant) {
  assertSamePlatform(subscription.platformId, seat, "Seat");
  assertSamePlatform(subscription.platformId, user, "Seat assignee");
  validateSubscriptionForGrant(subscription, at);
  assertRule(seat.subscriptionId === subscription.id, "seat_subscription_mismatch", "The seat must belong to the subscription.");
  assertRule(seat.status === "assigned" && seat.assignedUserId === user.id, "seat_assignment_invalid", "The seat must be actively assigned to the user.");
}

export function issueAccessGrant(input: {
  readonly id: EntityId; readonly now: Instant; readonly subscription: Subscription; readonly user: User;
  readonly scopeType: AccessGrant["scopeType"]; readonly scopeId: EntityId; readonly seat: Seat | null;
}): AccessGrant {
  assertSamePlatform(input.subscription.platformId, input.user, "Grant recipient");
  validateSubscriptionForGrant(input.subscription, input.now);
  if (input.seat) validateSeatAssignment(input.subscription, input.seat, input.user, input.now);
  return { id: input.id, platformId: input.subscription.platformId, userId: input.user.id, scopeType: input.scopeType, scopeId: input.scopeId, sourceType: input.seat ? "seat" : "subscription", sourceId: input.seat?.id ?? input.subscription.id, status: "active", validFrom: input.now, validUntil: input.subscription.endsAt, revokedAt: null, decisionSnapshot: Object.freeze({ subscriptionId: input.subscription.id, seatId: input.seat?.id ?? null, evaluatedAt: input.now }), createdAt: input.now };
}

export function evaluateProtectedContent(input: {
  readonly now: Instant; readonly user: User; readonly appSession: AppSession; readonly device: Device | null;
  readonly grant: AccessGrant | null; readonly lesson: Lesson; readonly asset: VideoAsset | DocumentAsset;
}): ProtectedContentAuthorization {
  const { user, appSession, device, grant, lesson, asset, now } = input;
  assertSamePlatform(user.platformId, appSession, "App session");
  assertSamePlatform(user.platformId, lesson, "Lesson");
  assertSamePlatform(user.platformId, asset, "Asset");
  if (device) assertSamePlatform(user.platformId, device, "Device");
  if (user.status !== "active") return deny(user.platformId, "user_inactive", null);
  if (appSession.userId !== user.id || appSession.status !== "active" || appSession.revokedAt || !isActiveDuring(appSession.issuedAt, appSession.expiresAt, now)) return deny(user.platformId, "session_invalid", grant);
  if (device && (device.userId !== user.id || device.trustStatus === "revoked" || device.revokedAt)) return deny(user.platformId, "device_revoked", grant);
  if (!grant) return deny(user.platformId, "grant_missing", null);
  if (grant.userId !== user.id || grant.status !== "active" || grant.revokedAt || !isActiveDuring(grant.validFrom, grant.validUntil, now)) return deny(user.platformId, "grant_inactive", grant);
  if (!covers(grant, lesson, asset)) return deny(user.platformId, "scope_mismatch", grant);
  if (lesson.status !== "active") return deny(user.platformId, "content_unreleased", grant);
  if (asset.status !== "active") return deny(user.platformId, "asset_inactive", grant);
  return { platformId: user.platformId, decision: "allow", reasonCode: "access_granted", accessGrantId: grant.id, deliveryPolicyReference: asset.deliveryPolicyReference, watermarkPayload: null };
}

function covers(grant: AccessGrant, lesson: Lesson, asset: VideoAsset | DocumentAsset) {
  return (grant.scopeType === "lesson" && grant.scopeId === lesson.id) || (grant.scopeType === "asset" && grant.scopeId === asset.id);
}

function deny(platformId: EntityId, reasonCode: Exclude<AccessDecisionReason, "access_granted">, grant: AccessGrant | null): ProtectedContentAuthorization {
  return { platformId, decision: "deny", reasonCode, accessGrantId: grant?.id ?? null, deliveryPolicyReference: null, watermarkPayload: null };
}
