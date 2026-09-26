import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { AdminPolicySnapshotSummary } from "./commercial.contracts";
import type { EntityId, ISODateTime, AdminListRequestBase, AdminListResponse, AdminDetailResponse } from "./common";
import type { AdminPlatformContext } from "./platform";

export type AdminGrantSourceType = "subscription" | "seat" | "promotion" | "admin_exception";
export type AdminGrantScopeType = "product" | "package" | "program" | "subject" | "lesson" | "resource" | "asset";
export type AdminAccessGrantStatus = "active" | "expired" | "revoked" | "suspended" | "pending";

export interface AdminGrantSourceSummary { type: AdminGrantSourceType; id: EntityId; displayLabel?: string; status: string; }
export interface AdminGrantScopeSummary { type: AdminGrantScopeType; id: EntityId; displayLabel?: string; }
export interface AdminAccessGrantListItem { id: EntityId; platform: AdminPlatformContext; recipientUserId: EntityId; source: AdminGrantSourceSummary; scope: AdminGrantScopeSummary; status: AdminAccessGrantStatus; validFrom: ISODateTime; validUntil?: ISODateTime | null; revokedAt?: ISODateTime | null; }
export interface AdminAccessGrantDetail extends AdminAccessGrantListItem { policySnapshot?: AdminPolicySnapshotSummary; decisionSnapshotRedacted?: Record<string, unknown>; }

export interface SearchAccessGrantsRequest extends AdminListRequestBase { status?: AdminAccessGrantStatus; scopeType?: AdminGrantScopeType; }
export type SearchAccessGrantsResponse = AdminListResponse<AdminAccessGrantListItem>;
export interface GetAccessGrantRequest { platform: AdminPlatformContext; grantId: EntityId; correlationId: string; }
export type GetAccessGrantResponse = AdminDetailResponse<AdminAccessGrantDetail>;
export interface AdminEntitlementCheckRequest { platform: AdminPlatformContext; userId: EntityId; sourceId?: EntityId; scope: AdminGrantScopeSummary; correlationId: string; }
export interface AdminEntitlementCheckResponse { platform: AdminPlatformContext; eligible: boolean; reasonCode: string; policySnapshot?: AdminPolicySnapshotSummary; correlationId: string; }
export interface AdminProtectedAccessCheckRequest { platform: AdminPlatformContext; userId: EntityId; resourceId: EntityId; grantId?: EntityId; sessionId?: EntityId; deviceId?: EntityId; correlationId: string; }
export interface AdminProtectedAccessCheckResponse { platform: AdminPlatformContext; decision: "allow" | "deny"; reasonCode: string; accessDecisionId?: EntityId; protectedAuthorizationId?: EntityId; correlationId: string; }

/** Enrollment is not entitlement; unsupported scopes must be rejected by the backend. */
export interface CreateAdminExceptionGrantCommand extends AdminCommandIntent<{ recipientUserId: EntityId; scope: AdminGrantScopeSummary; validFrom: ISODateTime; validUntil?: ISODateTime | null; }> { metadata: AdminSensitiveCommandMetadata; }
export interface RevokeAccessGrantCommand extends AdminCommandIntent<{ status: "revoked" }> { metadata: AdminSensitiveCommandMetadata; }
export interface SuspendAccessGrantCommand extends AdminCommandIntent<{ status: "suspended" }> { metadata: AdminSensitiveCommandMetadata; }
