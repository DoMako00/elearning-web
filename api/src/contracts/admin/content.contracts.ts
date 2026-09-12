import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { EntityId, ISODateTime, AdminListRequestBase, AdminListResponse, AdminDetailResponse } from "./common";
import type { AdminPlatformContext } from "./platform";
import type { AdminPolicySnapshotSummary } from "./commercial.contracts";

export type AdminHierarchyNodeType = "program" | "academic_year" | "semester" | "subject" | "module" | "chapter" | "lesson";
export type AdminLessonResourceType = "video" | "document" | "quiz" | "link" | "file";
export type AdminContentStatus = "draft" | "active" | "published" | "withdrawn" | "archived";
export type AdminReleaseMode = "immediate" | "absolute_calendar" | "relative_to_entitlement" | "manual";
export type AdminReleaseStatus = "draft" | "active" | "expired" | "withdrawn";

export interface AdminContentTreeNode { id: EntityId; platform: AdminPlatformContext; nodeType: AdminHierarchyNodeType; title: string; code?: string; status: AdminContentStatus; sequence?: number; children?: readonly AdminContentTreeNode[]; }
export interface AdminLessonResourceSummary { id: EntityId; platform: AdminPlatformContext; lessonId: EntityId; resourceType: AdminLessonResourceType; title: string; status: AdminContentStatus; sequence: number; }
export interface AdminReleaseRuleSummary { id: EntityId; platform: AdminPlatformContext; targetId: EntityId; releaseMode: AdminReleaseMode; status: AdminReleaseStatus; availableFrom?: ISODateTime | null; availableUntil?: ISODateTime | null; timezone?: string | null; policySnapshot?: AdminPolicySnapshotSummary; }
export interface AdminLessonDetail { id: EntityId; platform: AdminPlatformContext; title: string; status: AdminContentStatus; hierarchyPath: readonly AdminContentTreeNode[]; resources: readonly AdminLessonResourceSummary[]; releaseRules: readonly AdminReleaseRuleSummary[]; }

export interface GetContentTreeRequest extends AdminListRequestBase { nodeType?: AdminHierarchyNodeType; parentId?: EntityId | null; }
export type GetContentTreeResponse = AdminListResponse<AdminContentTreeNode>;
export interface GetLessonRequest { platform: AdminPlatformContext; lessonId: EntityId; correlationId: string; }
export type GetLessonResponse = AdminDetailResponse<AdminLessonDetail>;

/** Catalog visibility does not authorize delivery; release and grant checks remain separate. */
export interface PublishLessonCommand extends AdminCommandIntent<{ status: "published" }> { metadata: AdminSensitiveCommandMetadata; }
export interface WithdrawLessonCommand extends AdminCommandIntent<{ status: "withdrawn" }> { metadata: AdminSensitiveCommandMetadata; }
export interface SetReleaseRuleCommand extends AdminCommandIntent<{ releaseMode: AdminReleaseMode; availableFrom?: ISODateTime | null; availableUntil?: ISODateTime | null; timezone?: string | null; }> { metadata: AdminSensitiveCommandMetadata; }
export interface ManualReleaseOverrideCommand extends AdminCommandIntent<{ decision: "release" | "hold"; until?: ISODateTime | null; }> { metadata: AdminSensitiveCommandMetadata; }
export interface AttachLessonResourceCommand extends AdminCommandIntent<{ resourceType: AdminLessonResourceType; title: string; sequence: number; }> { metadata: AdminSensitiveCommandMetadata; }
export interface ReplaceLessonResourceMetadataCommand extends AdminCommandIntent<{ title?: string; sequence?: number; }> { metadata: AdminSensitiveCommandMetadata; }
