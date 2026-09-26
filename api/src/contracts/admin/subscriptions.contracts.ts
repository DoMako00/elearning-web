import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { AdminCommercialOwner, AdminPolicySnapshotSummary } from "./commercial.contracts";
import type { EntityId, ISODateTime, CurrencyCode, AdminListRequestBase, AdminListResponse, AdminDetailResponse } from "./common";
import type { AdminPlatformContext } from "./platform";

export type AdminSubscriptionStatus = "pending" | "active" | "past_due" | "suspended" | "cancelled" | "expired";
export type AdminSubscriptionKind = "individual" | "duo" | "group";
export type AdminSeatStatus = "available" | "assigned" | "revoked";
export type AdminSeatReplacementStatus = "requested" | "approved" | "rejected" | "completed";

export interface AdminSeatSummary { id: EntityId; platform: AdminPlatformContext; subscriptionId: EntityId; status: AdminSeatStatus; assignedUserId?: EntityId | null; assignedAt?: ISODateTime | null; revokedAt?: ISODateTime | null; }
export interface AdminSeatReplacementSummary { id: EntityId; platform: AdminPlatformContext; subscriptionId: EntityId; userId: EntityId; status: AdminSeatReplacementStatus; reasonRedacted?: string; requestedAt: ISODateTime; completedAt?: ISODateTime | null; }
export interface AdminSubscriptionTermsSummary { planId: EntityId; currency: CurrencyCode; policySnapshot?: AdminPolicySnapshotSummary; termsReferenceRedacted?: string; }
export interface AdminSubscriptionListItem { id: EntityId; platform: AdminPlatformContext; owner: AdminCommercialOwner; kind: AdminSubscriptionKind; status: AdminSubscriptionStatus; startsAt: ISODateTime; endsAt?: ISODateTime | null; renewsAt?: ISODateTime | null; activeSeatCount: number; }
export interface AdminSubscriptionDetail extends AdminSubscriptionListItem { terms: AdminSubscriptionTermsSummary; seats: readonly AdminSeatSummary[]; replacements: readonly AdminSeatReplacementSummary[]; }

export interface SearchSubscriptionsRequest extends AdminListRequestBase { status?: AdminSubscriptionStatus; kind?: AdminSubscriptionKind; }
export type SearchSubscriptionsResponse = AdminListResponse<AdminSubscriptionListItem>;
export interface GetSubscriptionRequest { platform: AdminPlatformContext; subscriptionId: EntityId; correlationId: string; }
export type GetSubscriptionResponse = AdminDetailResponse<AdminSubscriptionDetail>;

/** Subscription is not access; seats are not devices or shared credentials. */
export interface SeatReplacementDecisionCommand extends AdminCommandIntent<{ decision: "approve" | "reject" }> { metadata: AdminSensitiveCommandMetadata; }
export interface EvaluateSubscriptionEntitlementCommand extends AdminCommandIntent<{ evaluate: true }> { metadata: AdminSensitiveCommandMetadata; }
