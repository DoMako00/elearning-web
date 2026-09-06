import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { CurrencyCode, EntityId, EvidenceReferenceSummary, ISODateTime, AdminListRequestBase, AdminListResponse, AdminDetailResponse, PrivateStorageReferenceSummary } from "./common";
import type { AdminPlatformContext } from "./platform";

export type AdminPaymentStatus = "initiated" | "pending_review" | "confirmed" | "failed" | "reversed";
export type AdminPaymentMethod = "card" | "bank_transfer" | "cash" | "wallet" | "other";
export type AdminPaymentEvidenceStatus = "submitted" | "under_review" | "accepted" | "rejected" | "correction_requested";
export type AdminRefundStatus = "requested" | "approved" | "rejected" | "completed" | "failed";
export type AdminOrderStatus = "draft" | "submitted" | "confirmed" | "cancelled" | "expired";

export type AdminCommercialOwner =
  | { type: "user"; userId: EntityId; displayName: string }
  | { type: "organization"; organizationId: EntityId; displayName: string };

export interface AdminPolicyReference { policySetId: EntityId; policyVersion: number; policyKey: string; }
export interface AdminPolicySnapshotSummary { policySetId: EntityId; policyVersion: number; effectiveFrom: ISODateTime; effectiveTo: ISODateTime | null; status: string; }

export interface AdminOrderListItem { id: EntityId; platform: AdminPlatformContext; owner: AdminCommercialOwner; planId: EntityId; status: AdminOrderStatus; currency: CurrencyCode; createdAt: ISODateTime; }
export interface AdminPaymentListItem { id: EntityId; platform: AdminPlatformContext; orderId: EntityId; status: AdminPaymentStatus; method: AdminPaymentMethod; amount: number; currency: CurrencyCode; confirmedAt?: ISODateTime | null; }
export interface AdminPaymentEvidenceSummary { platform: AdminPlatformContext; paymentId: EntityId; status: AdminPaymentEvidenceStatus; claimedAmount: number | null; currency: CurrencyCode | null; submittedAt: ISODateTime | null; reference?: EvidenceReferenceSummary; storage?: PrivateStorageReferenceSummary; }
export interface AdminPaymentTransactionSummary { id: EntityId; platform: AdminPlatformContext; paymentId: EntityId; transactionType: string; status: "pending" | "succeeded" | "failed"; amount: number; currency: CurrencyCode; processedAt?: ISODateTime | null; providerReferenceRedacted?: string | null; }
export interface AdminPaymentDetail { id: EntityId; platform: AdminPlatformContext; orderId: EntityId; status: AdminPaymentStatus; method: AdminPaymentMethod; amount: number; currency: CurrencyCode; evidence: readonly AdminPaymentEvidenceSummary[]; transactions: readonly AdminPaymentTransactionSummary[]; }
export interface AdminRefundListItem { id: EntityId; platform: AdminPlatformContext; paymentId: EntityId; status: AdminRefundStatus; amount: number; currency: CurrencyCode; requestedAt: ISODateTime; }
export interface AdminRefundDetail extends AdminRefundListItem { reasonCode: string; policySnapshot?: AdminPolicySnapshotSummary; processedAt?: ISODateTime | null; }

export interface SearchOrdersRequest extends AdminListRequestBase { status?: AdminOrderStatus; }
export type SearchOrdersResponse = AdminListResponse<AdminOrderListItem>;
export interface SearchPaymentsRequest extends AdminListRequestBase { status?: AdminPaymentStatus; }
export type SearchPaymentsResponse = AdminListResponse<AdminPaymentListItem>;
export interface GetPaymentRequest { platform: AdminPlatformContext; paymentId: EntityId; correlationId: string; }
export type GetPaymentResponse = AdminDetailResponse<AdminPaymentDetail>;

/** Payment evidence and confirmation are not access authorization. */
export interface PaymentReviewCommand extends AdminCommandIntent<{ decision: "approve" | "reject" | "request_correction" }> { metadata: AdminSensitiveCommandMetadata; }
export interface PaymentReconcileCommand extends AdminCommandIntent<{ reconciliationStatus: "matched" | "unmatched" | "quarantined" }> { metadata: AdminSensitiveCommandMetadata; }
export interface RefundDecisionCommand extends AdminCommandIntent<{ decision: "approve" | "reject" }> { metadata: AdminSensitiveCommandMetadata; }
export interface RefundProcessCommand extends AdminCommandIntent<{ process: true }> { metadata: AdminSensitiveCommandMetadata; }
