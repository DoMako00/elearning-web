import type { AdminCommandIntent, AdminSensitiveCommandMetadata } from "./commands";
import type { AdminPolicySnapshotSummary } from "./commercial.contracts";
import type { EntityId, ISODateTime, AdminListRequestBase, AdminListResponse, AdminDetailResponse } from "./common";
import type { AdminPlatformContext } from "./platform";

export type AdminQuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer" | "matching" | "ordering" | "numeric" | "clinical_scenario" | "free_text";
export type AdminQuestionImplementationStatus = "active" | "future_placeholder" | "disabled";
export type AdminAttemptStatus = "created" | "started" | "in_progress" | "submitted" | "expired" | "awaiting_review" | "scored" | "moderated" | "invalidated" | "cancelled";
export type AdminAssessmentStatus = "draft" | "published" | "withdrawn" | "archived";
export type AdminAssessmentKind = "lesson_quiz" | "scheduled_exam";

export interface AdminQuizSummary { id: EntityId; platform: AdminPlatformContext; lessonId?: EntityId | null; title: string; assessmentId: EntityId; status: AdminAssessmentStatus; }
export interface AdminQuestionBankItemSummary { id: EntityId; platform: AdminPlatformContext; questionType: AdminQuestionType; implementationStatus: AdminQuestionImplementationStatus; titleRedacted?: string; version: number; }
export interface AdminAssessmentListItem { id: EntityId; platform: AdminPlatformContext; title: string; kind: AdminAssessmentKind; status: AdminAssessmentStatus; policySnapshot?: AdminPolicySnapshotSummary; questionCount?: number; }
export interface AdminAssessmentDetail extends AdminAssessmentListItem { quizId?: EntityId | null; availableFrom?: ISODateTime | null; availableUntil?: ISODateTime | null; questionBankItems: readonly AdminQuestionBankItemSummary[]; }
export interface AdminAttemptListItem { id: EntityId; platform: AdminPlatformContext; assessmentId: EntityId; studentUserId: EntityId; enrollmentId?: EntityId | null; status: AdminAttemptStatus; startedAt?: ISODateTime | null; submittedAt?: ISODateTime | null; score?: number | null; }
export interface AdminAttemptDetail extends AdminAttemptListItem { policySnapshot?: AdminPolicySnapshotSummary; assessmentVersion?: string; answerCount: number; reviewState?: string; }

export interface SearchAssessmentsRequest extends AdminListRequestBase { status?: AdminAssessmentStatus; kind?: AdminAssessmentKind; }
export type SearchAssessmentsResponse = AdminListResponse<AdminAssessmentListItem>;
export interface GetAssessmentRequest { platform: AdminPlatformContext; assessmentId: EntityId; correlationId: string; }
export type GetAssessmentResponse = AdminDetailResponse<AdminAssessmentDetail>;
export interface SearchAttemptsRequest extends AdminListRequestBase { status?: AdminAttemptStatus; assessmentId?: EntityId; studentUserId?: EntityId; }
export type SearchAttemptsResponse = AdminListResponse<AdminAttemptListItem>;
export interface GetAttemptRequest { platform: AdminPlatformContext; attemptId: EntityId; correlationId: string; }
export type GetAttemptResponse = AdminDetailResponse<AdminAttemptDetail>;

/** Attempt transitions are backend-policy controlled; these contracts do not grade or authorize. */
export interface PublishAssessmentCommand extends AdminCommandIntent<{ status: "published" }> { metadata: AdminSensitiveCommandMetadata; }
export interface WithdrawAssessmentCommand extends AdminCommandIntent<{ status: "withdrawn" }> { metadata: AdminSensitiveCommandMetadata; }
export interface InvalidateAttemptCommand extends AdminCommandIntent<{ status: "invalidated" }> { metadata: AdminSensitiveCommandMetadata; }
export interface ManualAttemptReviewCommand extends AdminCommandIntent<{ reviewOutcome: "accept" | "reject" | "needs_moderation" }> { metadata: AdminSensitiveCommandMetadata; }
export interface ReleaseAssessmentFeedbackCommand extends AdminCommandIntent<{ release: true }> { metadata: AdminSensitiveCommandMetadata; }
