import { createAdminError, createNotImplementedError } from "./adminApi.errors";
import { getSupabaseAccessToken } from "../../auth/api/supabaseAuth";
import type { AdminApi, AdminReadDetail, AdminReadList } from "./adminApi";
import type {
  AdminAccessDecisionSummary, AdminAccessGrantDetail, AdminAccessGrantListItem, AdminAdminActionItem, AdminAssessmentDetail,
  AdminAssessmentListItem, AdminAttemptDetail, AdminAttemptListItem, AdminAuditLogItem, AdminCommandIntent, AdminCommandResponse,
  AdminContentTreeNode, AdminDetailResponse, AdminError, AdminLessonDetail, AdminMediaAssetDetail, AdminMediaAssetListItem,
  AdminOverview, AdminPaymentDetail, AdminPaymentListItem, AdminPlatformContext, AdminPlaybackSessionSummary, AdminPolicySetSummary,
  AdminRefundDetail, AdminRefundListItem, AdminRoleSummary, AdminSecurityEventItem, AdminSeatSummary, AdminStudentDetail,
  AdminStudentListItem, AdminSubscriptionDetail, AdminSubscriptionListItem, AdminUserSummary, CorrelationId,
} from "./adminApi.types";

export interface HttpAdminApiConfig { readonly baseUrl: string; readonly fetchImpl?: typeof fetch; }

type BackendOverviewResponse = {
  ok?: boolean;
  correlationId?: unknown;
  brand?: { brandId?: unknown; brandCode?: unknown; brandDisplayName?: unknown };
  data?: { counts?: Partial<Record<"pendingPaymentReviews" | "pendingRefunds" | "suspiciousSecurityEvents" | "activeSubscriptions" | "expiredSubscriptions" | "activeGrants" | "revokedGrants" | "contentAwaitingRelease" | "assessmentsAwaitingReview", unknown>>; recent?: { auditLogs?: unknown; adminActions?: unknown; securityEvents?: unknown } };
  error?: { message?: unknown; code?: unknown; correlationId?: unknown };
};

const unsupportedMessage = "HTTP admin adapter currently supports overview only.";
const safeCorrelationId = (value: unknown, fallback: CorrelationId): CorrelationId => typeof value === "string" && /^[A-Za-z0-9._:-]{1,96}$/.test(value) ? value : fallback;
const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
const arrayValue = <T>(value: unknown): readonly T[] => Array.isArray(value) ? value as readonly T[] : [];
const failure = (correlationId: CorrelationId, message = unsupportedMessage, code: AdminError["code"] = "not_implemented") => ({ success: false as const, error: createAdminError(code, message, correlationId), correlationId, requiresRefresh: false });

function mapOverview(response: BackendOverviewResponse, fallbackCorrelationId: CorrelationId): AdminDetailResponse<AdminOverview> | ReturnType<typeof failure> {
  const correlationId = safeCorrelationId(response.correlationId, fallbackCorrelationId);
  const brand = response.brand;
  if (!response.ok || !brand || typeof brand.brandId !== "string" || (brand.brandCode !== "medway" && brand.brandCode !== "elite" && brand.brandCode !== "nexus") || typeof brand.brandDisplayName !== "string" || !response.data?.counts) {
    return failure(correlationId, typeof response.error?.message === "string" ? response.error.message : "The admin overview response was invalid.", "validation_failed");
  }
  const platform: AdminPlatformContext = { platformId: brand.brandId, platformCode: brand.brandCode, platformDisplayName: brand.brandDisplayName };
  const counts = response.data.counts;
  const recent = response.data.recent;
  return { data: { platform, pendingPaymentReviewsCount: numberValue(counts.pendingPaymentReviews), pendingRefundsCount: numberValue(counts.pendingRefunds), suspiciousSecurityEventsCount: numberValue(counts.suspiciousSecurityEvents), activeSubscriptionsCount: numberValue(counts.activeSubscriptions), expiredSubscriptionsCount: numberValue(counts.expiredSubscriptions), activeGrantsCount: numberValue(counts.activeGrants), revokedGrantsCount: numberValue(counts.revokedGrants), contentAwaitingReleaseCount: numberValue(counts.contentAwaitingRelease), assessmentsAwaitingReviewCount: numberValue(counts.assessmentsAwaitingReview), recentAuditLogs: arrayValue(recent?.auditLogs), recentAdminActions: arrayValue(recent?.adminActions), recentSecurityEvents: arrayValue(recent?.securityEvents) }, correlationId };
}

/** Overview-only development/staging adapter. Backend auth, trusted brand resolution, permissions, and persistence remain future work. */
export function createHttpAdminApi(config: HttpAdminApiConfig): AdminApi {
  const readFailure = <T>(correlationId: CorrelationId): AdminReadList<T> | AdminReadDetail<T> => Promise.resolve(failure(correlationId));
  const commandFailure = (command: AdminCommandIntent): Promise<AdminCommandResponse> => Promise.resolve({ ...failure(command.metadata.correlationId), error: createNotImplementedError(command.metadata.correlationId) });
  return {
    async getOverview(platform, correlationId) {
      const baseUrl = config.baseUrl.trim().replace(/\/$/, "");
      if (!baseUrl) return failure(correlationId, "API mode requires VITE_API_BASE_URL.");
      const fetchImpl = config.fetchImpl ?? globalThis.fetch;
      if (!fetchImpl) return failure(correlationId, "The HTTP client is unavailable.");
      try {
        const accessToken = await getSupabaseAccessToken();
        const headers: Record<string, string> = { "x-correlation-id": correlationId };
        if (accessToken) headers.authorization = `Bearer ${accessToken}`;
        const response = await fetchImpl(`${baseUrl}/v1/admin/overview?brand=${encodeURIComponent(platform.platformCode)}`, { method: "GET", headers });
        let body: BackendOverviewResponse;
        try { body = await response.json() as BackendOverviewResponse; }
        catch { return failure(correlationId, "The admin overview response was not valid JSON.", "validation_failed"); }
        const responseCorrelationId = safeCorrelationId(body.correlationId ?? body.error?.correlationId, correlationId);
        if (!response.ok) return failure(responseCorrelationId, typeof body.error?.message === "string" ? body.error.message : "The admin overview request failed.", response.status === 400 ? "validation_failed" : "unknown_error");
        return mapOverview(body, responseCorrelationId);
      } catch { return failure(correlationId, "The admin overview service could not be reached.", "unknown_error"); }
    },
    async searchStudents(request) { const baseUrl=config.baseUrl.trim().replace(/\/$/,""); if(!baseUrl)return failure(request.correlationId,"API mode requires VITE_API_BASE_URL.") as Awaited<ReturnType<AdminApi["searchStudents"]>>; try { const token=await getSupabaseAccessToken(); const query=new URLSearchParams({brand:request.platform.platformCode,page:String(request.pagination?.page??1),pageSize:String(request.pagination?.pageSize??25)}); if(request.search?.trim())query.set("search",request.search.trim()); if(request.status)query.set("status",request.status); const response=await (config.fetchImpl??globalThis.fetch)(`${baseUrl}/v1/admin/students?${query}`,{headers:{"x-correlation-id":request.correlationId,...(token?{authorization:`Bearer ${token}`}:{})}}); const body=await response.json() as {ok?:boolean;correlationId?:unknown;data?:unknown;error?:{message?:unknown}}; if(!response.ok||!body.ok||!body.data)return failure(typeof body.correlationId==="string"?body.correlationId:request.correlationId,typeof body.error?.message==="string"?body.error.message:"The students request failed.",response.status===400?"validation_failed":"unknown_error") as Awaited<ReturnType<AdminApi["searchStudents"]>>; return {...body.data as import("./adminApi.types").AdminListResponse<AdminStudentListItem>,correlationId:typeof body.correlationId==="string"?body.correlationId:request.correlationId}; } catch { return failure(request.correlationId,"The students service could not be reached.","unknown_error") as Awaited<ReturnType<AdminApi["searchStudents"]>>; } },
    async getStudent(request) { const baseUrl=config.baseUrl.trim().replace(/\/$/,""); if(!baseUrl)return failure(request.correlationId,"API mode requires VITE_API_BASE_URL.") as Awaited<ReturnType<AdminApi["getStudent"]>>; try { const token=await getSupabaseAccessToken(); const response=await (config.fetchImpl??globalThis.fetch)(`${baseUrl}/v1/admin/students/${encodeURIComponent(request.id)}?brand=${encodeURIComponent(request.platform.platformCode)}`,{headers:{"x-correlation-id":request.correlationId,...(token?{authorization:`Bearer ${token}`}:{})}}); const body=await response.json() as {ok?:boolean;correlationId?:unknown;data?:unknown;error?:{message?:unknown}}; if(!response.ok||!body.ok||!body.data)return failure(typeof body.correlationId==="string"?body.correlationId:request.correlationId,typeof body.error?.message==="string"?body.error.message:"The student request failed.",response.status===404?"target_not_found":"unknown_error") as Awaited<ReturnType<AdminApi["getStudent"]>>; return {data:body.data as AdminStudentDetail,correlationId:typeof body.correlationId==="string"?body.correlationId:request.correlationId}; } catch { return failure(request.correlationId,"The student service could not be reached.","unknown_error") as Awaited<ReturnType<AdminApi["getStudent"]>>; } },
    listPayments(request) { return readFailure<AdminPaymentListItem>(request.correlationId) as AdminReadList<AdminPaymentListItem>; }, getPayment(request) { return readFailure<AdminPaymentDetail>(request.correlationId) as AdminReadDetail<AdminPaymentDetail>; },
    listRefunds(request) { return readFailure<AdminRefundListItem>(request.correlationId) as AdminReadList<AdminRefundListItem>; }, getRefund(request) { return readFailure<AdminRefundDetail>(request.correlationId) as AdminReadDetail<AdminRefundDetail>; },
    listSubscriptions(request) { return readFailure<AdminSubscriptionListItem>(request.correlationId) as AdminReadList<AdminSubscriptionListItem>; }, getSubscription(request) { return readFailure<AdminSubscriptionDetail>(request.correlationId) as AdminReadDetail<AdminSubscriptionDetail>; },
    listSeats(request) { return readFailure<AdminSeatSummary>(request.correlationId) as AdminReadList<AdminSeatSummary>; }, listAccessGrants(request) { return readFailure<AdminAccessGrantListItem>(request.correlationId) as AdminReadList<AdminAccessGrantListItem>; }, getAccessGrant(request) { return readFailure<AdminAccessGrantDetail>(request.correlationId) as AdminReadDetail<AdminAccessGrantDetail>; },
    getContentTree(request) { return readFailure<AdminContentTreeNode>(request.correlationId) as AdminReadList<AdminContentTreeNode>; }, getLesson(request) { return readFailure<AdminLessonDetail>(request.correlationId) as AdminReadDetail<AdminLessonDetail>; },
    listMediaAssets(request) { return readFailure<AdminMediaAssetListItem>(request.correlationId) as AdminReadList<AdminMediaAssetListItem>; }, getMediaAsset(request) { return readFailure<AdminMediaAssetDetail>(request.correlationId) as AdminReadDetail<AdminMediaAssetDetail>; }, listAccessDecisions(request) { return readFailure<AdminAccessDecisionSummary>(request.correlationId) as AdminReadList<AdminAccessDecisionSummary>; }, listPlaybackSessions(request) { return readFailure<AdminPlaybackSessionSummary>(request.correlationId) as AdminReadList<AdminPlaybackSessionSummary>; },
    listAssessments(request) { return readFailure<AdminAssessmentListItem>(request.correlationId) as AdminReadList<AdminAssessmentListItem>; }, getAssessment(request) { return readFailure<AdminAssessmentDetail>(request.correlationId) as AdminReadDetail<AdminAssessmentDetail>; }, listAttempts(request) { return readFailure<AdminAttemptListItem>(request.correlationId) as AdminReadList<AdminAttemptListItem>; }, getAttempt(request) { return readFailure<AdminAttemptDetail>(request.correlationId) as AdminReadDetail<AdminAttemptDetail>; },
    listAuditLogs(request) { return readFailure<AdminAuditLogItem>(request.correlationId) as AdminReadList<AdminAuditLogItem>; }, listSecurityEvents(request) { return readFailure<AdminSecurityEventItem>(request.correlationId) as AdminReadList<AdminSecurityEventItem>; }, listAdminActions(request) { return readFailure<AdminAdminActionItem>(request.correlationId) as AdminReadList<AdminAdminActionItem>; }, listAdminUsers(request) { return readFailure<AdminUserSummary>(request.correlationId) as AdminReadList<AdminUserSummary>; }, listRoles(request) { return readFailure<AdminRoleSummary>(request.correlationId) as AdminReadList<AdminRoleSummary>; }, listPolicySets(request) { return readFailure<AdminPolicySetSummary>(request.correlationId) as AdminReadList<AdminPolicySetSummary>; },
    suspendStudent(command) { return commandFailure(command); }, restoreStudent(command) { return commandFailure(command); }, revokeStudentSessions(command) { return commandFailure(command); }, revokeDevice(command) { return commandFailure(command); }, reviewPayment(command) { return commandFailure(command); }, decideRefund(command) { return commandFailure(command); }, processRefund(command) { return commandFailure(command); }, decideSeatReplacement(command) { return commandFailure(command); }, createAdminExceptionGrant(command) { return commandFailure(command); }, revokeAccessGrant(command) { return commandFailure(command); }, publishLesson(command) { return commandFailure(command); }, withdrawLesson(command) { return commandFailure(command); }, manualReleaseOverride(command) { return commandFailure(command); }, revokePlaybackSession(command) { return commandFailure(command); }, withdrawMediaAsset(command) { return commandFailure(command); }, openMediaIncident(command) { return commandFailure(command); }, invalidateAttempt(command) { return commandFailure(command); }, assignAdminRole(command) { return commandFailure(command); }, revokeAdminRole(command) { return commandFailure(command); },
  };
}
