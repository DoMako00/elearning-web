import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { AdminPolicySnapshotSummary } from "./commercial.contracts";
import type { EntityId, ISODateTime, RedactedReference, AdminListRequestBase, AdminListResponse, AdminDetailResponse } from "./common";
import type { AdminPlatformContext } from "./platform";

export type AdminMediaAssetType = "video" | "document";
export type AdminDocumentDeliveryMode = "view_only" | "download_allowed" | "watermarked_view" | "watermarked_download";
export type AdminMediaAssetStatus = "draft" | "active" | "withdrawn" | "revoked" | "archived";
export type AdminPlaybackSessionStatus = "active" | "expired" | "revoked" | "ended";
export type AdminAccessDecisionResult = "allow" | "deny";
export type AdminAccessDecisionReasonCode =
  | "unauthenticated" | "platform_mismatch" | "app_user_missing_or_inactive" | "session_invalid"
  | "device_revoked" | "subscription_expired_or_inactive" | "seat_missing_or_unassigned"
  | "grant_missing" | "grant_inactive" | "scope_mismatch" | "content_unreleased"
  | "resource_policy_denied" | "concurrency_denied" | "view_limit_denied" | "download_policy_denied";

export interface AdminMediaAssetListItem { id: EntityId; platform: AdminPlatformContext; assetType: AdminMediaAssetType; resourceId: EntityId; title: string; status: AdminMediaAssetStatus; policySnapshot?: AdminPolicySnapshotSummary; }
export interface AdminMediaAssetDetail extends AdminMediaAssetListItem { contentHashRedacted?: RedactedReference; deliveryMode?: AdminDocumentDeliveryMode; storageReference?: never; permanentUrl?: never; }
export interface AdminPlaybackSessionSummary { id: EntityId; platform: AdminPlatformContext; userId: EntityId; assetId: EntityId; status: AdminPlaybackSessionStatus; issuedAt: ISODateTime; expiresAt: ISODateTime; endedAt?: ISODateTime | null; }
export interface AdminProtectedContentAuthorizationSummary { id: EntityId; platform: AdminPlatformContext; accessDecisionId: EntityId; result: AdminAccessDecisionResult; policySnapshot?: AdminPolicySnapshotSummary; expiresAt?: ISODateTime | null; deliveryUrl?: never; accessToken?: never; }
export interface AdminWatermarkPayloadSummary { platform: AdminPlatformContext; playbackSessionId?: EntityId; templateReference: RedactedReference; issuedAt: ISODateTime; redaction: "minimum_necessary"; payload?: never; }
export interface AdminAccessDecisionSummary { id: EntityId; platform: AdminPlatformContext; userId: EntityId; resourceId: EntityId; result: AdminAccessDecisionResult; reasonCode: AdminAccessDecisionReasonCode; evaluatedAt: ISODateTime; grantId?: EntityId | null; }
export interface AdminMediaIncidentSummary { id: EntityId; platform: AdminPlatformContext; assetId?: EntityId | null; playbackSessionId?: EntityId | null; status: "open" | "investigating" | "resolved" | "dismissed"; reason: string; openedAt: ISODateTime; }

export interface SearchMediaAssetsRequest extends AdminListRequestBase { assetType?: AdminMediaAssetType; status?: AdminMediaAssetStatus; }
export type SearchMediaAssetsResponse = AdminListResponse<AdminMediaAssetListItem>;
export interface GetMediaAssetRequest { platform: AdminPlatformContext; assetId: EntityId; correlationId: string; }
export type GetMediaAssetResponse = AdminDetailResponse<AdminMediaAssetDetail>;

/** No permanent media URL, raw storage reference, access token, or capture-prevention claim is a contract field. */
export interface RevokePlaybackSessionCommand extends AdminCommandIntent<{ status: "revoked" }> { metadata: AdminSensitiveCommandMetadata; }
export interface WithdrawMediaAssetCommand extends AdminCommandIntent<{ status: "withdrawn" }> { metadata: AdminSensitiveCommandMetadata; }
export interface OpenMediaIncidentCommand extends AdminCommandIntent<{ assetId?: EntityId; playbackSessionId?: EntityId; }> { metadata: AdminSensitiveCommandMetadata; }
export interface ApplyMediaIncidentActionCommand extends AdminCommandIntent<{ action: "withdraw_asset" | "revoke_playback" | "suspend_grant" | "close" }> { metadata: AdminSensitiveCommandMetadata; }
