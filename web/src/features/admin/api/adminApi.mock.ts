import { createMissingIdempotencyKeyError, createMissingReasonError, createPlatformMismatchError, createTargetNotFoundError } from "./adminApi.errors";
import type { AdminApi, AdminReadDetail, AdminReadList } from "./adminApi";
import { adminFixtureBundles, type AdminFixtureBundle } from "./adminApi.fixtures";
import type {
  AdminCommandIntent, AdminCommandResponse, AdminDetailResponse, AdminListResponse, AdminMutationFailure, AdminPlatformContext, AdminReadRequest,
  AdminStudentListItem, AdminPaymentListItem, AdminRefundListItem, AdminSubscriptionListItem, AdminMediaAssetListItem,
  AdminAssessmentListItem, AdminAttemptListItem,

} from "./adminApi.types";

/** This mock simulates backend responses; it is not an authorization engine. */
/** A real backend must revalidate platform, permission, target, lifecycle, policy, reason, idempotency, and audit requirements. */

const failure = (error: AdminMutationFailure["error"]): AdminMutationFailure => ({ success: false, error, correlationId: error.correlationId, requiresRefresh: false });
const bundleFor = (platform: AdminPlatformContext): AdminFixtureBundle | undefined => adminFixtureBundles.find((bundle) => bundle.platform.platformId === platform.platformId && bundle.platform.platformCode === platform.platformCode);
const allBundles = () => adminFixtureBundles;
const page = <T>(items: readonly T[], request: AdminReadRequest, correlationId: string): AdminListResponse<T> => {
  const pageNumber = request.pagination?.page ?? 1;
  const pageSize = request.pagination?.pageSize ?? 25;
  const start = Math.max(0, (pageNumber - 1) * pageSize);
  const data = items.slice(start, start + pageSize);
  return { data, pagination: { page: pageNumber, pageSize, totalItems: items.length, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) }, correlationId };
};
const match = (value: string | undefined, search: string | undefined) => !search || value?.toLowerCase().includes(search.toLowerCase());
const targetExistsOnOtherPlatform = (targetId: string, platform: AdminPlatformContext) => allBundles().some((bundle) => bundle.platform.platformId !== platform.platformId && bundleContainsId(bundle, targetId));
const bundleContainsId = (bundle: AdminFixtureBundle, id: string) => {
  const collections: readonly (readonly { id: string }[])[] = [bundle.students, bundle.devices, bundle.sessions, bundle.payments, bundle.refunds, bundle.subscriptions, bundle.seats, bundle.accessGrants, bundle.contentTree, bundle.lessons, bundle.mediaAssets, bundle.accessDecisions, bundle.playbackSessions, bundle.assessments, bundle.attempts, bundle.auditLogs, bundle.securityEvents, bundle.adminActions, bundle.roles, bundle.adminUsers, bundle.policySets];
  return collections.some((collection) => collection.some((item) => item.id === id));
};
const targetFailure = (platform: AdminPlatformContext, targetId: string, correlationId: string): AdminMutationFailure | undefined => {
  const bundle = bundleFor(platform);
  if (!bundle) return failure(createPlatformMismatchError(correlationId));
  if (bundleContainsId(bundle, targetId)) return undefined;
  return failure(targetExistsOnOtherPlatform(targetId, platform) ? createPlatformMismatchError(correlationId) : createTargetNotFoundError(correlationId));
};
const commandValidation = (command: AdminCommandIntent): AdminMutationFailure | undefined => {
  const { metadata, target } = command;
  if (!metadata.platform) return failure(createPlatformMismatchError(metadata.correlationId));
  if (!metadata.reason.trim()) return failure(createMissingReasonError(metadata.correlationId));
  if (!metadata.idempotencyKey.trim()) return failure(createMissingIdempotencyKeyError(metadata.correlationId));
  return targetFailure(metadata.platform, target.targetId, metadata.correlationId);
};
const success = (correlationId: string, security = false): AdminCommandResponse => ({ success: true, auditEventId: `mock-audit-${correlationId}`, adminActionId: `mock-admin-action-${correlationId}`, ...(security ? { securityEventId: `mock-security-${correlationId}` } : {}), correlationId, requiresRefresh: true });

export function createMockAdminApi(): AdminApi {
  const list = <T>(items: readonly T[], request: AdminReadRequest): AdminReadList<T> => Promise.resolve(page(items, request, request.correlationId));
  const detail = <T extends { id: string }>(items: readonly T[], request: { platform: AdminPlatformContext; id: string; correlationId: string }): AdminReadDetail<T> => {
    const bundle = bundleFor(request.platform);
    if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId)));
    const item = items.find((candidate) => candidate.id === request.id);
    if (item) return Promise.resolve({ data: item, correlationId: request.correlationId } satisfies AdminDetailResponse<T>);
    return Promise.resolve(failure(targetExistsOnOtherPlatform(request.id, request.platform) ? createPlatformMismatchError(request.correlationId) : createTargetNotFoundError(request.correlationId)));
  };

  return {
    getOverview(platform, correlationId) {
      const bundle = bundleFor(platform);
      if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(correlationId)));
      return Promise.resolve({ data: { platform, pendingPaymentReviewsCount: bundle.payments.filter((item) => item.status === "pending_review").length, pendingRefundsCount: bundle.refunds.filter((item) => item.status === "requested").length, suspiciousSecurityEventsCount: bundle.securityEvents.filter((item) => item.severity !== "info").length, activeSubscriptionsCount: bundle.subscriptions.filter((item) => item.status === "active").length, expiredSubscriptionsCount: bundle.subscriptions.filter((item) => item.status === "expired").length, activeGrantsCount: bundle.accessGrants.filter((item) => item.status === "active").length, revokedGrantsCount: bundle.accessGrants.filter((item) => item.status === "revoked").length, contentAwaitingReleaseCount: bundle.lessons.filter((item) => item.status === "draft").length, assessmentsAwaitingReviewCount: bundle.attempts.filter((item) => item.status === "awaiting_review").length, recentAuditLogs: bundle.auditLogs.slice(0, 5), recentAdminActions: bundle.adminActions.slice(0, 5), recentSecurityEvents: bundle.securityEvents.slice(0, 5) }, correlationId });
    },
    searchStudents(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminStudentListItem[] = bundle.students.filter((item) => match(item.displayName, request.search) && (!request.status || item.status === request.status) && (!request.riskFlag || item.riskFlags.includes(request.riskFlag))); return list(items, request); },
    getStudent(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.students, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listPayments(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminPaymentListItem[] = bundle.payments.filter((item) => match(item.id, request.search) && (!request.status || item.status === request.status)); return list(items, request); },
    getPayment(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.payments, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listRefunds(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminRefundListItem[] = bundle.refunds.filter((item) => match(item.id, request.search) && (!request.status || item.status === request.status)); return list(items, request); },
    getRefund(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.refunds, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listSubscriptions(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminSubscriptionListItem[] = bundle.subscriptions.filter((item) => match(item.id, request.search) && (!request.status || item.status === request.status) && (!request.kind || item.kind === request.kind)); return list(items, request); },
    getSubscription(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.subscriptions, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listSeats(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.seats.filter((item) => match(item.id, request.search) && (!request.status || item.status === request.status)), request); },
    listAccessGrants(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.accessGrants.filter((item) => match(item.id, request.search) && (!request.status || item.status === request.status) && (!request.scopeType || item.scope.type === request.scopeType)), request); },
    getAccessGrant(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.accessGrants, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    getContentTree(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.contentTree.filter((item) => !request.nodeType || item.nodeType === request.nodeType), request); },
    getLesson(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.lessons, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listMediaAssets(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminMediaAssetListItem[] = bundle.mediaAssets.filter((item) => match(item.title, request.search) && (!request.assetType || item.assetType === request.assetType) && (!request.status || item.status === request.status)); return list(items, request); },
    getMediaAsset(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.mediaAssets, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listAccessDecisions(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.accessDecisions.filter((item) => (!request.result || item.result === request.result) && (!request.reasonCode || item.reasonCode === request.reasonCode)), request); },
    listPlaybackSessions(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.playbackSessions.filter((item) => (!request.status || item.status === request.status)), request); },
    listAssessments(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminAssessmentListItem[] = bundle.assessments.filter((item) => match(item.title, request.search) && (!request.status || item.status === request.status) && (!request.kind || item.kind === request.kind)); return list(items, request); },
    getAssessment(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.assessments, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listAttempts(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); const items: AdminAttemptListItem[] = bundle.attempts.filter((item) => (!request.status || item.status === request.status) && (!request.assessmentId || item.assessmentId === request.assessmentId) && (!request.studentUserId || item.studentUserId === request.studentUserId)); return list(items, request); },
    getAttempt(request) { const bundle = bundleFor(request.platform); return bundle ? detail(bundle.attempts, request) : Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); },
    listAuditLogs(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.auditLogs.filter((item) => (!request.entityType || item.entityType === request.entityType) && (!request.actorId || item.actorId === request.actorId)), request); },
    listSecurityEvents(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.securityEvents.filter((item) => (!request.eventType || item.eventType === request.eventType) && (!request.severity || item.severity === request.severity)), request); },
    listAdminActions(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.adminActions.filter((item) => !request.outcome || item.outcome === request.outcome), request); },
    listAdminUsers(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.adminUsers, request); },
    listRoles(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.roles, request); },
    listPolicySets(request) { const bundle = bundleFor(request.platform); if (!bundle) return Promise.resolve(failure(createPlatformMismatchError(request.correlationId))); return list(bundle.policySets, request); },
    suspendStudent(command) { return runCommand(command, false); }, restoreStudent(command) { return runCommand(command, false); }, revokeStudentSessions(command) { return runCommand(command, true); }, revokeDevice(command) { return runCommand(command, true); }, reviewPayment(command) { return runCommand(command, false); }, decideRefund(command) { return runCommand(command, false); }, processRefund(command) { return runCommand(command, false); }, decideSeatReplacement(command) { return runCommand(command, true); }, createAdminExceptionGrant(command) { return runCommand(command, true); }, revokeAccessGrant(command) { return runCommand(command, true); }, publishLesson(command) { return runCommand(command, false); }, withdrawLesson(command) { return runCommand(command, false); }, manualReleaseOverride(command) { return runCommand(command, false); }, revokePlaybackSession(command) { return runCommand(command, true); }, withdrawMediaAsset(command) { return runCommand(command, true); }, openMediaIncident(command) { return runCommand(command, true); }, invalidateAttempt(command) { return runCommand(command, true); }, assignAdminRole(command) { return runCommand(command, true); }, revokeAdminRole(command) { return runCommand(command, true); },
  };
}

function runCommand(command: AdminCommandIntent, security: boolean): Promise<AdminCommandResponse> {
  const validation = commandValidation(command);
  return Promise.resolve(validation ?? success(command.metadata.correlationId, security));
}
