import type {
  AdminAccessDecisionSummary, AdminAccessGrantDetail, AdminAccessGrantListItem, AdminAdminActionItem, AdminAssessmentDetail, AdminAssessmentListItem,
  AdminAuditLogItem, AdminCommandResponse, AdminContentTreeNode, AdminDetailResponse, AdminError, AdminListResponse,
  AdminMediaAssetDetail, AdminMediaAssetListItem, AdminOverview, AdminPaymentDetail, AdminPaymentListItem, AdminPlatformContext,
  AdminPlaybackSessionSummary, AdminRefundDetail, AdminRefundListItem, AdminRoleSummary, AdminSecurityEventItem,
  AdminStudentDetail, AdminStudentListItem, AdminSubscriptionDetail, AdminSubscriptionListItem, AdminSeatSummary, AdminAttemptDetail, AdminAttemptListItem,
  AdminUserSummary, AdminPolicySetSummary, SearchStudentsRequest, SearchPaymentsRequest, SearchRefundsRequest, SearchSubscriptionsRequest, SearchSeatsRequest,
  SearchAccessGrantsRequest, GetContentTreeRequest, SearchMediaAssetsRequest, SearchAccessDecisionsRequest, SearchPlaybackSessionsRequest,
  SearchAssessmentsRequest, SearchAttemptsRequest, SearchAuditLogsRequest, SearchSecurityEventsRequest, SearchAdminActionsRequest, GetByIdRequest,
  SuspendStudentCommand, RestoreStudentCommand, RevokeStudentSessionsCommand, RevokeDeviceCommand, PaymentReviewCommand, RefundDecisionCommand,
  RefundProcessCommand, SeatReplacementDecisionCommand, CreateAdminExceptionGrantCommand, RevokeAccessGrantCommand, PublishLessonCommand,
  WithdrawLessonCommand, ManualReleaseOverrideCommand, RevokePlaybackSessionCommand, WithdrawMediaAssetCommand, OpenMediaIncidentCommand,
  InvalidateAttemptCommand, AssignAdminRoleCommand, RevokeAdminRoleCommand,
} from "./adminApi.types";

export type AdminReadList<T> = Promise<AdminListResponse<T> | { success: false; error: AdminError; correlationId: string; requiresRefresh: boolean }>;
export type AdminReadDetail<T> = Promise<AdminDetailResponse<T> | { success: false; error: AdminError; correlationId: string; requiresRefresh: boolean }>;

export interface AdminApi {
  getOverview(platform: AdminPlatformContext, correlationId: string): AdminReadDetail<AdminOverview>;
  searchStudents(request: SearchStudentsRequest): AdminReadList<AdminStudentListItem>;
  getStudent(request: GetByIdRequest): AdminReadDetail<AdminStudentDetail>;
  listPayments(request: SearchPaymentsRequest): AdminReadList<AdminPaymentListItem>;
  getPayment(request: GetByIdRequest): AdminReadDetail<AdminPaymentDetail>;
  listRefunds(request: SearchRefundsRequest): AdminReadList<AdminRefundListItem>;
  getRefund(request: GetByIdRequest): AdminReadDetail<AdminRefundDetail>;
  listSubscriptions(request: SearchSubscriptionsRequest): AdminReadList<AdminSubscriptionListItem>;
  getSubscription(request: GetByIdRequest): AdminReadDetail<AdminSubscriptionDetail>;
  listSeats(request: SearchSeatsRequest): AdminReadList<AdminSeatSummary>;
  listAccessGrants(request: SearchAccessGrantsRequest): AdminReadList<AdminAccessGrantListItem>;
  getAccessGrant(request: GetByIdRequest): AdminReadDetail<AdminAccessGrantDetail>;
  getContentTree(request: GetContentTreeRequest): AdminReadList<AdminContentTreeNode>;
  getLesson(request: GetByIdRequest): AdminReadDetail<import("./adminApi.types").AdminLessonDetail>;
  listMediaAssets(request: SearchMediaAssetsRequest): AdminReadList<AdminMediaAssetListItem>;
  getMediaAsset(request: GetByIdRequest): AdminReadDetail<AdminMediaAssetDetail>;
  listAccessDecisions(request: SearchAccessDecisionsRequest): AdminReadList<AdminAccessDecisionSummary>;
  listPlaybackSessions(request: SearchPlaybackSessionsRequest): AdminReadList<AdminPlaybackSessionSummary>;
  listAssessments(request: SearchAssessmentsRequest): AdminReadList<AdminAssessmentListItem>;
  getAssessment(request: GetByIdRequest): AdminReadDetail<AdminAssessmentDetail>;
  listAttempts(request: SearchAttemptsRequest): AdminReadList<AdminAttemptListItem>;
  getAttempt(request: GetByIdRequest): AdminReadDetail<AdminAttemptDetail>;
  listAuditLogs(request: SearchAuditLogsRequest): AdminReadList<AdminAuditLogItem>;
  listSecurityEvents(request: SearchSecurityEventsRequest): AdminReadList<AdminSecurityEventItem>;
  listAdminActions(request: SearchAdminActionsRequest): AdminReadList<AdminAdminActionItem>;
  listAdminUsers(request: SearchAdminActionsRequest): AdminReadList<AdminUserSummary>;
  listRoles(request: SearchAdminActionsRequest): AdminReadList<AdminRoleSummary>;
  listPolicySets(request: SearchAdminActionsRequest): AdminReadList<AdminPolicySetSummary>;
  suspendStudent(command: SuspendStudentCommand): Promise<AdminCommandResponse>;
  restoreStudent(command: RestoreStudentCommand): Promise<AdminCommandResponse>;
  revokeStudentSessions(command: RevokeStudentSessionsCommand): Promise<AdminCommandResponse>;
  revokeDevice(command: RevokeDeviceCommand): Promise<AdminCommandResponse>;
  reviewPayment(command: PaymentReviewCommand): Promise<AdminCommandResponse>;
  decideRefund(command: RefundDecisionCommand): Promise<AdminCommandResponse>;
  processRefund(command: RefundProcessCommand): Promise<AdminCommandResponse>;
  decideSeatReplacement(command: SeatReplacementDecisionCommand): Promise<AdminCommandResponse>;
  createAdminExceptionGrant(command: CreateAdminExceptionGrantCommand): Promise<AdminCommandResponse>;
  revokeAccessGrant(command: RevokeAccessGrantCommand): Promise<AdminCommandResponse>;
  publishLesson(command: PublishLessonCommand): Promise<AdminCommandResponse>;
  withdrawLesson(command: WithdrawLessonCommand): Promise<AdminCommandResponse>;
  manualReleaseOverride(command: ManualReleaseOverrideCommand): Promise<AdminCommandResponse>;
  revokePlaybackSession(command: RevokePlaybackSessionCommand): Promise<AdminCommandResponse>;
  withdrawMediaAsset(command: WithdrawMediaAssetCommand): Promise<AdminCommandResponse>;
  openMediaIncident(command: OpenMediaIncidentCommand): Promise<AdminCommandResponse>;
  invalidateAttempt(command: InvalidateAttemptCommand): Promise<AdminCommandResponse>;
  assignAdminRole(command: AssignAdminRoleCommand): Promise<AdminCommandResponse>;
  revokeAdminRole(command: RevokeAdminRoleCommand): Promise<AdminCommandResponse>;
}
