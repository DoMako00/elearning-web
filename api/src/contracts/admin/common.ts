import type { AdminError } from "./errors";
import type { AdminPlatformContext } from "./platform";

export type EntityId = string;
export type ISODateTime = string;
export type ISODate = string;
export type CurrencyCode = string;
export type CorrelationId = string;
export type IdempotencyKey = string;
export type PolicySetId = EntityId;

export type MaskedEmail = string;
export type MaskedPhone = string;
export type RedactedReference = string;
export type RedactedJsonObject = Record<string, unknown>;

export interface PrivateStorageReferenceSummary {
  referenceId: RedactedReference;
  providerLabel?: string;
  isPublic: false;
  redaction: "private_storage_reference";
}

export interface EvidenceReferenceSummary {
  evidenceId: EntityId;
  label: string;
  submittedAt: ISODateTime;
  redaction: "private_evidence_reference";
}

export type AdminLifecycleStatus =
  | "active" | "pending" | "disabled" | "suspended" | "revoked" | "expired"
  | "cancelled" | "failed" | "rejected" | "confirmed" | "under_review"
  | "draft" | "published" | "withdrawn" | "archived" | "allowed" | "denied";

export type AdminSortDirection = "asc" | "desc";

export interface AdminPaginationRequest { page: number; pageSize: number; }
export interface AdminPaginationResponse { page: number; pageSize: number; totalItems: number; totalPages: number; }
export interface AdminSortRequest { field: string; direction: AdminSortDirection; }
export interface AdminDateRangeFilter { from?: ISODateTime; until?: ISODateTime; }

export interface AdminListRequestBase {
  platform: AdminPlatformContext;
  search?: string;
  pagination?: AdminPaginationRequest;
  sort?: AdminSortRequest;
  correlationId: CorrelationId;
}

export interface AdminListResponse<T> {
  data: readonly T[];
  pagination: AdminPaginationResponse;
  correlationId: CorrelationId;
}

export interface AdminDetailResponse<T> { data: T; correlationId: CorrelationId; }

export interface AdminMutationSuccess<T = unknown> {
  success: true;
  data?: T;
  auditEventId?: EntityId;
  adminActionId?: EntityId;
  securityEventId?: EntityId;
  correlationId: CorrelationId;
  requiresRefresh: boolean;
}

export interface AdminMutationFailure {
  success: false;
  error: AdminError;
  correlationId: CorrelationId;
  requiresRefresh: boolean;
}

export type AdminCommandResponse<T = unknown> = AdminMutationSuccess<T> | AdminMutationFailure;
