import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { EntityId, ISODateTime, MaskedEmail, MaskedPhone, RedactedReference, AdminListRequestBase, AdminListResponse, AdminDetailResponse } from "./common";
import type { AdminPlatformContext } from "./platform";

export type AdminStudentStatus = "pending" | "active" | "disabled" | "suspended";
export type AdminStudentRiskFlag = "none" | "multiple_active_sessions" | "device_replacement_abuse" | "concurrent_playback_conflict" | "payment_risk" | "grant_mismatch" | "suspicious_access_denials";

export interface AdminStudentListItem {
  id: EntityId; platform: AdminPlatformContext; displayName: string | null; emailMasked: MaskedEmail | null;
  phoneMasked?: MaskedPhone | null; academicTermOrYear?: string | null; university?: string | null;
  academicInstitution?: string | null; academicLevel?: string | null; academicLevelId?: EntityId | null;
  academicSemester?: string | null; program?: string | null; expectedGraduationDate?: string | null;
  studentIdMasked?: string | null; status: AdminStudentStatus; activeSubscriptionCount: number | null;
  activeGrantCount: number | null; activeDeviceCount: number | null; activeSessionCount: number | null;
  lastSeenAt?: ISODateTime | null; riskFlags: readonly AdminStudentRiskFlag[];
}

export interface AdminDeviceSummary {
  id: EntityId; platform: AdminPlatformContext; userId: EntityId; deviceLabel?: string; deviceType?: string;
  trustStatus: "recognized" | "pending" | "revoked" | "suspicious"; firstSeenAt?: ISODateTime | null;
  lastSeenAt?: ISODateTime | null; revokedAt?: ISODateTime | null; fingerprintReference: RedactedReference;
}

export interface AdminSessionSummary {
  id: EntityId; platform: AdminPlatformContext; userId: EntityId; deviceId?: EntityId | null;
  status: "active" | "expired" | "revoked"; issuedAt: ISODateTime; expiresAt: ISODateTime;
  revokedAt?: ISODateTime | null; lastActivityAt?: ISODateTime | null;
}

export interface AdminStudentAccessSummary { activeSubscriptionCount: number | null; activeSeatCount: number | null; activeGrantCount: number | null; expiredGrantCount: number | null; revokedGrantCount: number | null; enrollmentCount: number | null; }
export interface AdminStudentLearningSummary { enrollmentCount: number | null; completedLessonCount: number | null; attemptCount: number | null; playbackSessionCount: number | null; lastLearningActivityAt?: ISODateTime | null; }

export interface AdminStudentDetail {
  id: EntityId; platform: AdminPlatformContext; displayName: string | null; emailMasked: MaskedEmail | null;
  phoneMasked?: MaskedPhone | null; status: AdminStudentStatus; academicTermOrYear?: string | null;
  university?: string | null; academicInstitution?: string | null; academicLevel?: string | null; academicLevelId?: EntityId | null;
  academicSemester?: string | null; program?: string | null; expectedGraduationDate?: string | null; studentIdMasked?: string | null; createdAt: ISODateTime; updatedAt?: ISODateTime | null;
  access: AdminStudentAccessSummary; learning: AdminStudentLearningSummary;
  devices: readonly AdminDeviceSummary[]; sessions: readonly AdminSessionSummary[]; riskFlags: readonly AdminStudentRiskFlag[];
}

export interface SearchStudentsRequest extends AdminListRequestBase { status?: AdminStudentStatus; riskFlag?: AdminStudentRiskFlag; }
export type SearchStudentsResponse = AdminListResponse<AdminStudentListItem>;
export interface GetStudentRequest { platform: AdminPlatformContext; studentId: EntityId; correlationId: string; }
export type GetStudentResponse = AdminDetailResponse<AdminStudentDetail>;

export interface SuspendStudentCommand extends AdminCommandIntent<{ status: "suspended" }> { metadata: AdminSensitiveCommandMetadata; }
export interface RestoreStudentCommand extends AdminCommandIntent<{ status: "active" }> { metadata: AdminSensitiveCommandMetadata; }
export interface RevokeStudentSessionsCommand extends AdminCommandIntent<{ revokeAll: true }> { metadata: AdminSensitiveCommandMetadata; }
export interface RevokeDeviceCommand extends AdminCommandIntent<{ status: "revoked" }> { metadata: AdminSensitiveCommandMetadata; }
export interface DeviceReplacementDecisionCommand extends AdminCommandIntent<{ decision: "approve" | "reject" }> { metadata: AdminSensitiveCommandMetadata; }
