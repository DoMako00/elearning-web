import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { AdminPermissionCode } from "./permissions";
import type { EntityId, ISODateTime, RedactedJsonObject, RedactedReference, AdminListRequestBase, AdminListResponse } from "./common";
import type { AdminPlatformContext } from "./platform";

export interface AdminAuditLogItem { id: EntityId; platform: AdminPlatformContext; occurredAt: ISODateTime; actorType: "user" | "admin" | "system" | "integration"; actorId?: EntityId | null; action: string; entityType: string; entityId: EntityId; beforeReference?: RedactedReference | null; afterReference?: RedactedReference | null; correlationId: string; }
export interface AdminSecurityEventItem { id: EntityId; platform: AdminPlatformContext; eventType: "authentication" | "otp" | "device" | "session" | "access_denied" | "admin_security"; occurredAt: ISODateTime; userId?: EntityId | null; sessionId?: EntityId | null; severity: "info" | "warning" | "critical"; metadataReference?: RedactedReference | null; }
export interface AdminAdminActionItem { id: EntityId; platform: AdminPlatformContext; adminUserId: EntityId; actionType: string; targetEntityType: string; targetEntityId: EntityId; authorizationReference: RedactedReference; occurredAt: ISODateTime; outcome: "succeeded" | "denied" | "failed"; }
export interface AdminAnalyticsEventItem { id: EntityId; platform: AdminPlatformContext; eventName: string; occurredAt: ISODateTime; userId?: EntityId | null; resourceType?: string | null; resourceId?: EntityId | null; payloadReference?: RedactedReference | null; }
export interface AdminRoleSummary { id: EntityId; platform: AdminPlatformContext; code: string; name: string; permissionCodes: readonly AdminPermissionCode[]; status: "active" | "inactive"; }
export interface AdminPermissionSummary { id: EntityId; platform: AdminPlatformContext; code: AdminPermissionCode; description: string; status: "active" | "inactive"; }
export interface AdminUserSummary { id: EntityId; platform: AdminPlatformContext; appUserId: EntityId; displayName: string; emailMasked: string; status: "active" | "suspended" | "revoked"; elevatedAccessExpiresAt?: ISODateTime | null; roleIds: readonly EntityId[]; }
export interface AdminRoleAssignmentSummary { id: EntityId; platform: AdminPlatformContext; adminUserId: EntityId; roleId: EntityId; startsAt: ISODateTime; endsAt?: ISODateTime | null; status: "active" | "expired" | "revoked"; }
export interface AdminPolicySetSummary { id: EntityId; platform: AdminPlatformContext; name: string; version: number; effectiveFrom: ISODateTime; effectiveTo?: ISODateTime | null; status: "draft" | "active" | "inactive" | "archived"; documentReference: RedactedReference; }

export interface SearchAuditLogsRequest extends AdminListRequestBase { entityType?: string; actorId?: EntityId; }
export type SearchAuditLogsResponse = AdminListResponse<AdminAuditLogItem>;
export interface SearchSecurityEventsRequest extends AdminListRequestBase { eventType?: AdminSecurityEventItem["eventType"]; severity?: AdminSecurityEventItem["severity"]; }
export type SearchSecurityEventsResponse = AdminListResponse<AdminSecurityEventItem>;

/** Audit, security, and admin-action records are append-only and redacted. UI permission gates are not security. */
export interface AssignAdminRoleCommand extends AdminCommandIntent<{ adminUserId: EntityId; roleId: EntityId; startsAt: ISODateTime; endsAt?: ISODateTime | null }> { metadata: AdminSensitiveCommandMetadata; }
export interface RevokeAdminRoleCommand extends AdminCommandIntent<{ status: "revoked" }> { metadata: AdminSensitiveCommandMetadata; }
export interface UpdateRolePermissionsCommand extends AdminCommandIntent<{ roleId: EntityId; permissionCodes: readonly AdminPermissionCode[] }> { metadata: AdminSensitiveCommandMetadata; }
export interface CreatePolicySetCommand extends AdminCommandIntent<{ name: string; version: number; effectiveFrom: ISODateTime; effectiveTo?: ISODateTime | null; documentReference: RedactedReference }> { metadata: AdminSensitiveCommandMetadata; }
export interface UpdatePolicySetCommand extends AdminCommandIntent<{ policySetId: EntityId; changes: RedactedJsonObject }> { metadata: AdminSensitiveCommandMetadata; }
