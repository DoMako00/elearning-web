import type { BrandCode, BrandId, BrandScope } from "../brand-scope/brand-scope";

export type AppUserId = string & { readonly __appUserId: unique symbol };
export type AuthIdentityId = string & { readonly __authIdentityId: unique symbol };
export type AdminProfileId = string & { readonly __adminProfileId: unique symbol };
export type StudentProfileId = string & { readonly __studentProfileId: unique symbol };
export type SessionId = string & { readonly __sessionId: unique symbol };
export type DeviceId = string & { readonly __deviceId: unique symbol };
export type SubscriptionId = string & { readonly __subscriptionId: unique symbol };
export type SeatId = string & { readonly __seatId: unique symbol };
export type AccessGrantId = string & { readonly __accessGrantId: unique symbol };
export type ContentNodeId = string & { readonly __contentNodeId: unique symbol };
export type ResourceId = string & { readonly __resourceId: unique symbol };
export type OrderId = string & { readonly __orderId: unique symbol };
export type PaymentId = string & { readonly __paymentId: unique symbol };
export type RefundId = string & { readonly __refundId: unique symbol };
export type EvidenceId = string & { readonly __evidenceId: unique symbol };
export type MediaAssetId = string & { readonly __mediaAssetId: unique symbol };

export interface RepositoryRequestMetadata {
  readonly requestId?: string;
  readonly correlationId?: string;
}

export interface BrandScopedLookup<TId> extends RepositoryRequestMetadata {
  readonly id: TId;
  readonly brand: BrandScope;
}

export interface BrandScopedQuery extends RepositoryRequestMetadata {
  readonly brand: BrandScope;
}

export interface RepositoryTargetReference {
  readonly targetType: string;
  readonly targetId: string;
  readonly brandId?: BrandId;
  readonly brandCode?: BrandCode;
}

export interface RepositoryPageRequest {
  readonly limit?: number;
  readonly cursor?: string;
}

export interface RepositoryPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

export interface RepositoryActorReference {
  readonly actorType: "user" | "admin" | "system" | "integration";
  readonly actorId: string | null;
  readonly authIdentityId?: AuthIdentityId;
}

export type BrandScopeInput = BrandScope;

