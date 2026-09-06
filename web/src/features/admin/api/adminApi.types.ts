/**
 * These frontend-local types temporarily mirror api/src/contracts/admin/.
 * The frontend has no safe shared/generated contract package boundary yet.
 * Replace this file with imports from a shared/generated package later.
 * These types do not authorize anything; backend runtime must validate
 * platform, permission, target relationship, lifecycle, policy, reason,
 * idempotency, and audit requirements.
 */

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

// Compatibility note: Medway and Elite are brands inside one application platform. New admin code should use AdminBrand* terminology.
export type AdminBrandCode = "medway" | "elite";
/** Frontend display context only. It is deliberately not valid for any brand-owned entity. */
export type AdminBrandView = "all" | AdminBrandCode;
export interface AdminBrandContext { brandId: EntityId; brandCode: AdminBrandCode; brandDisplayName: string; platformId?: EntityId; platformCode?: AdminBrandCode; }
export interface AdminBrandScoped { brandId: EntityId; brandCode: AdminBrandCode; }
export interface AdminBrandScopedEntity extends AdminBrandScoped { id: EntityId; }
export interface AdminBrandIdentity extends AdminBrandContext { logoReference?: RedactedReference; themeReference?: RedactedReference; primaryColor?: string; accentColor?: string; }
/** @deprecated Compatibility alias. Medway/Elite are brands, not separate technical platforms. */
export type AdminPlatformCode = AdminBrandCode;
/** @deprecated Compatibility shape retained while existing adapter DTOs migrate to brand fields. */
export interface AdminPlatformContext { platformId: EntityId; platformCode: AdminPlatformCode; platformDisplayName: string; }
export interface AdminPlatformScoped { platform: AdminPlatformContext; }
export interface AdminPlatformScopedEntity extends AdminPlatformScoped { id: EntityId; }

export interface PrivateStorageReferenceSummary { referenceId: RedactedReference; providerLabel?: string; isPublic: false; redaction: "private_storage_reference"; }
export interface EvidenceReferenceSummary { evidenceId: EntityId; label: string; submittedAt: ISODateTime; redaction: "private_evidence_reference"; }

export type AdminPermissionCode =
  | "admin.students.read" | "admin.students.suspend" | "admin.students.restore" | "admin.sessions.revoke" | "admin.devices.revoke"
  | "admin.payments.read" | "admin.payments.review" | "admin.refunds.read" | "admin.refunds.decide" | "admin.subscriptions.read"
  | "admin.seats.manage" | "admin.grants.read" | "admin.grants.issue_exception" | "admin.grants.revoke" | "admin.content.read"
  | "admin.content.publish" | "admin.content.withdraw" | "admin.media.read" | "admin.media.manage" | "admin.assessments.read"
  | "admin.assessments.review" | "admin.audit.read" | "admin.security.read" | "admin.roles.read" | "admin.roles.manage"
  | "admin.policies.read" | "admin.policies.manage";

export interface AdminCommandMetadata { platform: AdminPlatformContext; reason: string; correlationId: CorrelationId; idempotencyKey?: IdempotencyKey; policySetId?: PolicySetId; expectedVersion?: string | number; }
export interface AdminSensitiveCommandMetadata extends AdminCommandMetadata { idempotencyKey: IdempotencyKey; }
export interface AdminTargetRef { targetType: string; targetId: EntityId; targetLabel?: string; }
export interface AdminCommandIntent<TPayload = Record<string, unknown>> { metadata: AdminSensitiveCommandMetadata; target: AdminTargetRef; payload: TPayload; }

export type AdminErrorCode =
  | "unauthenticated" | "platform_required" | "platform_mismatch" | "admin_user_missing_or_inactive" | "permission_denied"
  | "target_not_found" | "target_platform_mismatch" | "validation_failed" | "reason_required" | "idempotency_key_required"
  | "policy_validation_failed" | "lifecycle_transition_denied" | "sensitive_data_redacted" | "unsupported_scope"
  | "not_implemented" | "conflict" | "unknown_error";
export interface AdminError { code: AdminErrorCode; message: string; correlationId: CorrelationId; details?: RedactedJsonObject; }

export interface AdminPaginationRequest { page: number; pageSize: number; }
export interface AdminPaginationResponse { page: number; pageSize: number; totalItems: number; totalPages: number; }
export interface AdminSortRequest { field: string; direction: "asc" | "desc"; }
export interface AdminDateRangeFilter { from?: ISODateTime; until?: ISODateTime; }
export interface AdminListRequestBase { platform: AdminPlatformContext; correlationId: CorrelationId; search?: string; pagination?: AdminPaginationRequest; sort?: AdminSortRequest; }
export interface AdminListResponse<T> { data: readonly T[]; pagination: AdminPaginationResponse; correlationId: CorrelationId; }
export interface AdminDetailResponse<T> { data: T; correlationId: CorrelationId; }
export interface AdminMutationSuccess<T = unknown> { success: true; data?: T; auditEventId?: EntityId; adminActionId?: EntityId; securityEventId?: EntityId; correlationId: CorrelationId; requiresRefresh: boolean; }
export interface AdminMutationFailure { success: false; error: AdminError; correlationId: CorrelationId; requiresRefresh: boolean; }
export type AdminCommandResponse<T = unknown> = AdminMutationSuccess<T> | AdminMutationFailure;
export type AdminReadResponse<T> = T | AdminMutationFailure;

export type AdminStudentStatus = "pending" | "active" | "disabled" | "suspended";
export type AdminStudentRiskFlag = "none" | "multiple_active_sessions" | "device_replacement_abuse" | "concurrent_playback_conflict" | "payment_risk" | "grant_mismatch" | "suspicious_access_denials";
export interface AdminStudentListItem { id: EntityId; platform: AdminPlatformContext; displayName: string; emailMasked: MaskedEmail; phoneMasked?: MaskedPhone | null; academicTermOrYear?: string | null; university?: string | null; studentIdMasked?: string | null; status: AdminStudentStatus; activeSubscriptionCount: number; activeGrantCount: number; activeDeviceCount: number; activeSessionCount: number; lastSeenAt?: ISODateTime | null; riskFlags: readonly AdminStudentRiskFlag[]; }
export interface AdminDeviceSummary { id: EntityId; platform: AdminPlatformContext; userId: EntityId; deviceLabel?: string; deviceType?: string; trustStatus: "recognized" | "pending" | "revoked" | "suspicious"; firstSeenAt?: ISODateTime | null; lastSeenAt?: ISODateTime | null; revokedAt?: ISODateTime | null; fingerprintReference: RedactedReference; }
export interface AdminSessionSummary { id: EntityId; platform: AdminPlatformContext; userId: EntityId; deviceId?: EntityId | null; status: "active" | "expired" | "revoked"; issuedAt: ISODateTime; expiresAt: ISODateTime; revokedAt?: ISODateTime | null; lastActivityAt?: ISODateTime | null; }
export interface AdminStudentAccessSummary { activeSubscriptionCount: number; activeSeatCount: number; activeGrantCount: number; expiredGrantCount: number; revokedGrantCount: number; enrollmentCount: number; }
export interface AdminStudentLearningSummary { enrollmentCount: number; completedLessonCount: number; attemptCount: number; playbackSessionCount: number; lastLearningActivityAt?: ISODateTime | null; }
export interface AdminStudentDetail extends AdminStudentListItem { createdAt: ISODateTime; updatedAt?: ISODateTime | null; access: AdminStudentAccessSummary; learning: AdminStudentLearningSummary; devices: readonly AdminDeviceSummary[]; sessions: readonly AdminSessionSummary[]; }

export type AdminOrderStatus = "draft" | "submitted" | "confirmed" | "cancelled" | "expired";
export type AdminPaymentStatus = "initiated" | "pending_review" | "confirmed" | "failed" | "reversed";
export type AdminPaymentMethod = "card" | "bank_transfer" | "cash" | "wallet" | "other";
export type AdminPaymentEvidenceStatus = "submitted" | "under_review" | "accepted" | "rejected" | "correction_requested";
export type AdminRefundStatus = "requested" | "approved" | "rejected" | "completed" | "failed";
export type AdminCommercialOwner = { type: "user"; userId: EntityId; displayName: string } | { type: "organization"; organizationId: EntityId; displayName: string };
export interface AdminPolicyReference { policySetId: EntityId; policyVersion: number; policyKey: string; }
export interface AdminPolicySnapshotSummary { policySetId?: EntityId; policyVersion?: number; effectiveFrom: ISODateTime; effectiveTo?: ISODateTime | null; status: string; id?: EntityId; platform?: AdminPlatformContext; name?: string; version?: number; documentReference?: RedactedReference; }
export interface AdminOrderListItem { id: EntityId; platform: AdminPlatformContext; owner: AdminCommercialOwner; planId: EntityId; status: AdminOrderStatus; currency: CurrencyCode; createdAt: ISODateTime; }
export interface AdminPaymentListItem { id: EntityId; platform: AdminPlatformContext; orderId: EntityId; status: AdminPaymentStatus; method: AdminPaymentMethod; amount: number; currency: CurrencyCode; confirmedAt?: ISODateTime | null; }
export interface AdminPaymentEvidenceSummary { platform: AdminPlatformContext; paymentId: EntityId; status: AdminPaymentEvidenceStatus; claimedAmount: number | null; currency: CurrencyCode | null; submittedAt: ISODateTime | null; reference?: EvidenceReferenceSummary; storage?: PrivateStorageReferenceSummary; }
export interface AdminPaymentTransactionSummary { id: EntityId; platform: AdminPlatformContext; paymentId: EntityId; transactionType: string; status: "pending" | "succeeded" | "failed"; amount: number; currency: CurrencyCode; processedAt?: ISODateTime | null; providerReferenceRedacted?: string | null; }
export interface AdminPaymentDetail extends AdminPaymentListItem { evidence: readonly AdminPaymentEvidenceSummary[]; transactions: readonly AdminPaymentTransactionSummary[]; }
export interface AdminRefundListItem { id: EntityId; platform: AdminPlatformContext; paymentId: EntityId; status: AdminRefundStatus; amount: number; currency: CurrencyCode; requestedAt: ISODateTime; }
export interface AdminRefundDetail extends AdminRefundListItem { reasonCode: string; policySnapshot?: AdminPolicySnapshotSummary; processedAt?: ISODateTime | null; }

export type AdminSubscriptionStatus = "pending" | "active" | "past_due" | "suspended" | "cancelled" | "expired";
export type AdminSubscriptionKind = "individual" | "duo" | "group";
export type AdminSeatStatus = "available" | "assigned" | "revoked";
export type AdminSeatReplacementStatus = "requested" | "approved" | "rejected" | "completed";
export interface AdminSubscriptionTermsSummary { planId: EntityId; currency: CurrencyCode; policySnapshot?: AdminPolicySnapshotSummary; termsReferenceRedacted?: RedactedReference; }
export interface AdminSeatSummary { id: EntityId; platform: AdminPlatformContext; subscriptionId: EntityId; status: AdminSeatStatus; assignedUserId?: EntityId | null; assignedAt?: ISODateTime | null; revokedAt?: ISODateTime | null; }
export interface AdminSeatReplacementSummary { id: EntityId; platform: AdminPlatformContext; subscriptionId: EntityId; userId: EntityId; status: AdminSeatReplacementStatus; requestedAt: ISODateTime; completedAt?: ISODateTime | null; }
export interface AdminSubscriptionListItem { id: EntityId; platform: AdminPlatformContext; owner: AdminCommercialOwner; kind: AdminSubscriptionKind; status: AdminSubscriptionStatus; startsAt: ISODateTime; endsAt?: ISODateTime | null; renewsAt?: ISODateTime | null; activeSeatCount: number; }
export interface AdminSubscriptionDetail extends AdminSubscriptionListItem { terms: AdminSubscriptionTermsSummary; seats: readonly AdminSeatSummary[]; replacements: readonly AdminSeatReplacementSummary[]; }

export type AdminGrantSourceType = "subscription" | "seat" | "promotion" | "admin_exception";
export type AdminGrantScopeType = "product" | "package" | "program" | "subject" | "lesson" | "resource" | "asset";
export type AdminAccessGrantStatus = "active" | "expired" | "revoked" | "suspended" | "pending";
export interface AdminGrantSourceSummary { type: AdminGrantSourceType; id: EntityId; displayLabel?: string; status: string; }
export interface AdminGrantScopeSummary { type: AdminGrantScopeType; id: EntityId; displayLabel?: string; }
export interface AdminAccessGrantListItem { id: EntityId; platform: AdminPlatformContext; recipientUserId: EntityId; source: AdminGrantSourceSummary; scope: AdminGrantScopeSummary; status: AdminAccessGrantStatus; validFrom: ISODateTime; validUntil?: ISODateTime | null; revokedAt?: ISODateTime | null; }
export interface AdminAccessGrantDetail extends AdminAccessGrantListItem { policySnapshot?: AdminPolicySnapshotSummary; decisionSnapshotRedacted?: RedactedJsonObject; }
export interface AdminEntitlementCheckResponse { platform: AdminPlatformContext; eligible: boolean; reasonCode: string; policySnapshot?: AdminPolicySnapshotSummary; correlationId: CorrelationId; }
export interface AdminProtectedAccessCheckResponse { platform: AdminPlatformContext; decision: "allow" | "deny"; reasonCode: string; accessDecisionId?: EntityId; protectedAuthorizationId?: EntityId; correlationId: CorrelationId; }

export type AdminHierarchyNodeType = "program" | "academic_year" | "semester" | "subject" | "module" | "chapter" | "lesson";
export type AdminLessonResourceType = "video" | "document" | "quiz" | "link" | "file";
export type AdminContentStatus = "draft" | "active" | "published" | "withdrawn" | "archived";
export type AdminReleaseMode = "immediate" | "absolute_calendar" | "relative_to_entitlement" | "manual";
export type AdminReleaseStatus = "draft" | "active" | "expired" | "withdrawn";
export interface AdminContentTreeNode { id: EntityId; platform: AdminPlatformContext; nodeType: AdminHierarchyNodeType; title: string; code?: string; status: AdminContentStatus; sequence?: number; children?: readonly AdminContentTreeNode[]; }
export interface AdminLessonResourceSummary { id: EntityId; platform: AdminPlatformContext; lessonId: EntityId; resourceType: AdminLessonResourceType; title: string; status: AdminContentStatus; sequence: number; privateStorageReference?: PrivateStorageReferenceSummary; }
export interface AdminReleaseRuleSummary { id: EntityId; platform: AdminPlatformContext; targetId: EntityId; releaseMode: AdminReleaseMode; status: AdminReleaseStatus; availableFrom?: ISODateTime | null; availableUntil?: ISODateTime | null; timezone?: string | null; policySnapshot?: AdminPolicySnapshotSummary; }
export interface AdminLessonDetail { id: EntityId; platform: AdminPlatformContext; title: string; status: AdminContentStatus; hierarchyPath: readonly AdminContentTreeNode[]; resources: readonly AdminLessonResourceSummary[]; releaseRules: readonly AdminReleaseRuleSummary[]; }

export type AdminMediaAssetType = "video" | "document";
export type AdminDocumentDeliveryMode = "view_only" | "download_allowed" | "watermarked_view" | "watermarked_download";
export type AdminMediaAssetStatus = "draft" | "active" | "withdrawn" | "revoked" | "archived";
export type AdminPlaybackSessionStatus = "active" | "expired" | "revoked" | "ended";
export type AdminAccessDecisionResult = "allow" | "deny";
export type AdminAccessDecisionReasonCode = "access_granted" | "unauthenticated" | "platform_mismatch" | "app_user_missing_or_inactive" | "session_invalid" | "device_revoked" | "subscription_expired_or_inactive" | "seat_missing_or_unassigned" | "grant_missing" | "grant_inactive" | "scope_mismatch" | "content_unreleased" | "resource_policy_denied" | "concurrency_denied" | "view_limit_denied" | "download_policy_denied";
export interface AdminMediaAssetListItem { id: EntityId; platform: AdminPlatformContext; assetType: AdminMediaAssetType; resourceId: EntityId; title: string; status: AdminMediaAssetStatus; policySnapshot?: AdminPolicySnapshotSummary; }
export interface AdminMediaAssetDetail extends AdminMediaAssetListItem { contentHashRedacted?: RedactedReference; deliveryMode?: AdminDocumentDeliveryMode; privateStorageReference?: PrivateStorageReferenceSummary; }
export interface AdminPlaybackSessionSummary { id: EntityId; platform: AdminPlatformContext; userId: EntityId; assetId: EntityId; status: AdminPlaybackSessionStatus; issuedAt: ISODateTime; expiresAt: ISODateTime; endedAt?: ISODateTime | null; }
export interface AdminProtectedContentAuthorizationSummary { id: EntityId; platform: AdminPlatformContext; accessDecisionId: EntityId; result: AdminAccessDecisionResult; policySnapshot?: AdminPolicySnapshotSummary; expiresAt?: ISODateTime | null; deliveryUrl?: never; accessToken?: never; }
export interface AdminWatermarkPayloadSummary { platform: AdminPlatformContext; playbackSessionId?: EntityId; templateReference: RedactedReference; issuedAt: ISODateTime; redaction: "minimum_necessary"; payload?: never; }
export interface AdminAccessDecisionSummary { id: EntityId; platform: AdminPlatformContext; userId: EntityId; resourceId: EntityId; result: AdminAccessDecisionResult; reasonCode: AdminAccessDecisionReasonCode; evaluatedAt: ISODateTime; grantId?: EntityId | null; }
export interface AdminMediaIncidentSummary { id: EntityId; platform: AdminPlatformContext; assetId?: EntityId | null; playbackSessionId?: EntityId | null; status: "open" | "investigating" | "resolved" | "dismissed"; reason: string; openedAt: ISODateTime; }

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

export interface AdminAuditLogItem { id: EntityId; platform: AdminPlatformContext; occurredAt: ISODateTime; actorType: "user" | "admin" | "system" | "integration"; actorId?: EntityId | null; action: string; entityType: string; entityId: EntityId; beforeReference?: RedactedReference | null; afterReference?: RedactedReference | null; correlationId: CorrelationId; }
export interface AdminSecurityEventItem { id: EntityId; platform: AdminPlatformContext; eventType: "authentication" | "otp" | "device" | "session" | "access_denied" | "admin_security"; occurredAt: ISODateTime; userId?: EntityId | null; sessionId?: EntityId | null; severity: "info" | "warning" | "critical"; metadataReference?: RedactedReference | null; }
export interface AdminAdminActionItem { id: EntityId; platform: AdminPlatformContext; adminUserId: EntityId; actionType: string; targetEntityType: string; targetEntityId: EntityId; authorizationReference: RedactedReference; occurredAt: ISODateTime; outcome: "succeeded" | "denied" | "failed"; }
export interface AdminAnalyticsEventItem { id: EntityId; platform: AdminPlatformContext; eventName: string; occurredAt: ISODateTime; userId?: EntityId | null; resourceType?: string | null; resourceId?: EntityId | null; payloadReference?: RedactedReference | null; }
export interface AdminRoleSummary { id: EntityId; platform: AdminPlatformContext; code: string; name: string; permissionCodes: readonly AdminPermissionCode[]; status: "active" | "inactive"; }
export interface AdminPermissionSummary { id: EntityId; platform: AdminPlatformContext; code: AdminPermissionCode; description: string; status: "active" | "inactive"; }
export interface AdminUserSummary { id: EntityId; platform: AdminPlatformContext; appUserId: EntityId; displayName: string; emailMasked: MaskedEmail; status: "active" | "suspended" | "revoked"; elevatedAccessExpiresAt?: ISODateTime | null; roleIds: readonly EntityId[]; }
export interface AdminRoleAssignmentSummary { id: EntityId; platform: AdminPlatformContext; adminUserId: EntityId; roleId: EntityId; startsAt: ISODateTime; endsAt?: ISODateTime | null; status: "active" | "expired" | "revoked"; }
export interface AdminPolicySetSummary { id: EntityId; platform: AdminPlatformContext; name: string; version: number; effectiveFrom: ISODateTime; effectiveTo?: ISODateTime | null; status: "draft" | "active" | "inactive" | "archived"; documentReference: RedactedReference; }

export type AdminOverviewTone = "success" | "warning" | "danger" | "neutral";
export type AdminOverviewMetricId = "students" | "courses" | "instructors" | "revenue";
export interface AdminOverviewMetric { id: AdminOverviewMetricId; label: string; value: number; format: "integer" | "currency"; currency?: CurrencyCode; trendDirection: "up" | "down"; trendPercentage: number; comparisonLabel: string; sparkline: readonly number[]; accessibleTrend: string; }
export interface AdminEnrollmentPoint { label: string; current: number; previous: number; }
export interface AdminOverviewBreakdownItem { id: string; label: string; value: number; percentage: number; tone: AdminOverviewTone; }
export interface AdminOverviewActivity { id: string; kind: "student" | "course" | "instructor" | "payment" | "content"; title: string; detail: string; relativeTime: string; }
export interface AdminPendingReview { id: string; title: string; detail: string; typeLabel: string; tone: AdminOverviewTone; relativeTime: string; }
export interface AdminOverviewDashboard {
  metrics: readonly AdminOverviewMetric[];
  enrollment: { total: number; trendPercentage: number; points: readonly AdminEnrollmentPoint[] };
  traffic: { total: number; trendPercentage: number; sparkline: readonly number[]; sources: readonly AdminOverviewBreakdownItem[] };
  orders: { total: number; trendPercentage: number; statuses: readonly AdminOverviewBreakdownItem[] };
  recentActivity: readonly AdminOverviewActivity[];
  pendingReviews: readonly AdminPendingReview[];
  paymentStatus: { totalRevenue: number; currency: CurrencyCode; segments: readonly AdminOverviewBreakdownItem[] };
}
export interface AdminOverview { platform: AdminPlatformContext; dashboard?: AdminOverviewDashboard; pendingPaymentReviewsCount: number; pendingRefundsCount: number; suspiciousSecurityEventsCount: number; activeSubscriptionsCount: number; expiredSubscriptionsCount: number; activeGrantsCount: number; revokedGrantsCount: number; contentAwaitingReleaseCount: number; assessmentsAwaitingReviewCount: number; recentAuditLogs: readonly AdminAuditLogItem[]; recentAdminActions: readonly AdminAdminActionItem[]; recentSecurityEvents: readonly AdminSecurityEventItem[]; }

export type AdminReadRequest = AdminListRequestBase;
export type GetByIdRequest = { platform: AdminPlatformContext; id: EntityId; correlationId: CorrelationId };
export interface SearchStudentsRequest extends AdminListRequestBase { status?: AdminStudentStatus; riskFlag?: AdminStudentRiskFlag; }
export interface SearchPaymentsRequest extends AdminListRequestBase { status?: AdminPaymentStatus; }
export interface SearchRefundsRequest extends AdminListRequestBase { status?: AdminRefundStatus; }
export interface SearchSubscriptionsRequest extends AdminListRequestBase { status?: AdminSubscriptionStatus; kind?: AdminSubscriptionKind; }
export interface SearchSeatsRequest extends AdminListRequestBase { status?: AdminSeatStatus; }
export interface SearchAccessGrantsRequest extends AdminListRequestBase { status?: AdminAccessGrantStatus; scopeType?: AdminGrantScopeType; }
export interface GetContentTreeRequest extends AdminListRequestBase { nodeType?: AdminHierarchyNodeType; parentId?: EntityId | null; }
export interface SearchMediaAssetsRequest extends AdminListRequestBase { assetType?: AdminMediaAssetType; status?: AdminMediaAssetStatus; }
export interface SearchAccessDecisionsRequest extends AdminListRequestBase { result?: AdminAccessDecisionResult; reasonCode?: AdminAccessDecisionReasonCode; }
export interface SearchPlaybackSessionsRequest extends AdminListRequestBase { status?: AdminPlaybackSessionStatus; }
export interface SearchAssessmentsRequest extends AdminListRequestBase { status?: AdminAssessmentStatus; kind?: AdminAssessmentKind; }
export interface SearchAttemptsRequest extends AdminListRequestBase { status?: AdminAttemptStatus; assessmentId?: EntityId; studentUserId?: EntityId; }
export interface SearchAuditLogsRequest extends AdminListRequestBase { entityType?: string; actorId?: EntityId; }
export interface SearchSecurityEventsRequest extends AdminListRequestBase { eventType?: AdminSecurityEventItem["eventType"]; severity?: AdminSecurityEventItem["severity"]; }
export interface SearchAdminActionsRequest extends AdminListRequestBase { outcome?: AdminAdminActionItem["outcome"]; }

export interface SuspendStudentCommand extends AdminCommandIntent<{ status: "suspended" }> {}
export interface RestoreStudentCommand extends AdminCommandIntent<{ status: "active" }> {}
export interface RevokeStudentSessionsCommand extends AdminCommandIntent<{ revokeAll: true }> {}
export interface RevokeDeviceCommand extends AdminCommandIntent<{ status: "revoked" }> {}
export interface PaymentReviewCommand extends AdminCommandIntent<{ decision: "approve" | "reject" | "request_correction" }> {}
export interface PaymentReconcileCommand extends AdminCommandIntent<{ reconciliationStatus: "matched" | "unmatched" | "quarantined" }> {}
export interface RefundDecisionCommand extends AdminCommandIntent<{ decision: "approve" | "reject" }> {}
export interface RefundProcessCommand extends AdminCommandIntent<{ process: true }> {}
export interface SeatReplacementDecisionCommand extends AdminCommandIntent<{ decision: "approve" | "reject" }> {}
export interface CreateAdminExceptionGrantCommand extends AdminCommandIntent<{ recipientUserId: EntityId; scope: AdminGrantScopeSummary; validFrom: ISODateTime; validUntil?: ISODateTime | null }> {}
export interface RevokeAccessGrantCommand extends AdminCommandIntent<{ status: "revoked" }> {}
export interface PublishLessonCommand extends AdminCommandIntent<{ status: "published" }> {}
export interface WithdrawLessonCommand extends AdminCommandIntent<{ status: "withdrawn" }> {}
export interface ManualReleaseOverrideCommand extends AdminCommandIntent<{ decision: "release" | "hold"; until?: ISODateTime | null }> {}
export interface RevokePlaybackSessionCommand extends AdminCommandIntent<{ status: "revoked" }> {}
export interface WithdrawMediaAssetCommand extends AdminCommandIntent<{ status: "withdrawn" }> {}
export interface OpenMediaIncidentCommand extends AdminCommandIntent<{ assetId?: EntityId; playbackSessionId?: EntityId }> {}
export interface InvalidateAttemptCommand extends AdminCommandIntent<{ status: "invalidated" }> {}
export interface AssignAdminRoleCommand extends AdminCommandIntent<{ adminUserId: EntityId; roleId: EntityId; startsAt: ISODateTime; endsAt?: ISODateTime | null }> {}
export interface RevokeAdminRoleCommand extends AdminCommandIntent<{ status: "revoked" }> {}
