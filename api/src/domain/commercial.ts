import type { AuditedEntity, EntityId, Instant, LifecycleStatus, PlatformScopedEntity, VersionedPolicyReference } from "./shared";

export interface Product extends AuditedEntity, PlatformScopedEntity {
  readonly code: string;
  readonly title: string;
  readonly productType: "program" | "subject" | "course" | "resource" | "membership";
  readonly status: LifecycleStatus;
}

export interface Package extends AuditedEntity, PlatformScopedEntity {
  readonly code: string;
  readonly title: string;
  readonly productIds: readonly EntityId[];
  readonly status: LifecycleStatus;
}

export interface Offer extends AuditedEntity, PlatformScopedEntity {
  readonly packageId: EntityId;
  readonly code: string;
  readonly audienceType: "individual" | "organization" | "both";
  readonly status: LifecycleStatus;
}

/** Immutable effective-dated terms selected by an order or subscription. */
export interface Plan extends AuditedEntity, PlatformScopedEntity {
  readonly offerId: EntityId;
  readonly version: number;
  readonly billingMode: "one_time" | "recurring";
  readonly effectiveFrom: Instant;
  readonly effectiveTo: Instant | null;
  readonly currency: string;
  readonly priceDefinitionReference: string;
  readonly policyReferences: readonly VersionedPolicyReference[];
  readonly termsReference: string;
  readonly status: LifecycleStatus;
}

export interface Promotion extends AuditedEntity, PlatformScopedEntity {
  readonly code: string;
  readonly eligibilityPolicyReference: VersionedPolicyReference;
  readonly benefitDefinitionReference: string;
  readonly startsAt: Instant;
  readonly endsAt: Instant | null;
  readonly status: LifecycleStatus;
}

export interface PolicySet extends AuditedEntity, PlatformScopedEntity {
  readonly name: string;
  readonly version: number;
  readonly effectiveFrom: Instant;
  readonly effectiveTo: Instant | null;
  readonly documentReference: string;
  readonly status: LifecycleStatus;
}

export interface Order extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId | null;
  readonly organizationReference: string | null;
  readonly planId: EntityId;
  readonly promotionId: EntityId | null;
  readonly status: "draft" | "submitted" | "confirmed" | "cancelled" | "expired";
  readonly termsSnapshot: Readonly<Record<string, unknown>>;
  readonly submittedAt: Instant | null;
}

export interface Payment extends AuditedEntity, PlatformScopedEntity {
  readonly orderId: EntityId;
  readonly method: "card" | "bank_transfer" | "cash" | "wallet" | "other";
  readonly amount: number;
  readonly currency: string;
  readonly status: "initiated" | "pending_review" | "confirmed" | "failed" | "reversed";
  readonly confirmedAt: Instant | null;
}

export interface Transaction extends AuditedEntity, PlatformScopedEntity {
  readonly paymentId: EntityId;
  readonly providerReference: string | null;
  readonly transactionType: "authorization" | "capture" | "manual_confirmation" | "reversal" | "refund";
  readonly status: "pending" | "succeeded" | "failed";
  readonly amount: number;
  readonly currency: string;
  readonly processedAt: Instant | null;
}

export interface Refund extends AuditedEntity, PlatformScopedEntity {
  readonly paymentId: EntityId;
  readonly amount: number;
  readonly reasonCode: string;
  readonly policyReference: VersionedPolicyReference;
  readonly status: "requested" | "approved" | "rejected" | "completed" | "failed";
  readonly processedAt: Instant | null;
}

export interface Subscription extends AuditedEntity, PlatformScopedEntity {
  readonly orderId: EntityId;
  readonly planId: EntityId;
  readonly ownerUserId: EntityId | null;
  readonly organizationReference: string | null;
  readonly status: "pending" | "active" | "past_due" | "suspended" | "cancelled" | "expired";
  readonly startsAt: Instant;
  readonly renewsAt: Instant | null;
  readonly endsAt: Instant | null;
  readonly termsSnapshot: Readonly<Record<string, unknown>>;
}

export interface Seat extends AuditedEntity, PlatformScopedEntity {
  readonly subscriptionId: EntityId;
  readonly status: "available" | "assigned" | "revoked";
  readonly assignedUserId: EntityId | null;
  readonly assignedAt: Instant | null;
  readonly revokedAt: Instant | null;
}
