import type { AdminPlatformContext, AdminAdminActionItem, AdminAuditLogItem, AdminSecurityEventItem } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
import { adminCoreError, type AdminCoreError } from "../../core/errors";
import type { AdminRequestContext } from "../../core/context";
import type { AdminReadModels } from "./in-memory-admin-read-models";

export interface AdminOverviewResult { readonly platform: AdminPlatformContext; readonly counts: { readonly pendingPaymentReviews: number; readonly pendingRefunds: number; readonly suspiciousSecurityEvents: number; readonly activeSubscriptions: number; readonly expiredSubscriptions: number; readonly activeGrants: number; readonly revokedGrants: number; readonly contentAwaitingRelease: number; readonly assessmentsAwaitingReview: number }; readonly recent: { readonly auditLogs: readonly AdminAuditLogItem[]; readonly adminActions: readonly AdminAdminActionItem[]; readonly securityEvents: readonly AdminSecurityEventItem[] }; }
export async function getAdminOverview(context: AdminRequestContext, readModels: AdminReadModels): Promise<Result<AdminOverviewResult, AdminCoreError>> {
  if (!context.platform.isActive) return fail(adminCoreError("platform_mismatch", "The resolved platform is not active.", context.correlationId));
  const model = readModels.getOverview(context.platform.platformId);
  if (!model || model.platform.platformId !== context.platform.platformId || model.platform.platformCode !== context.platform.platformCode) return fail(adminCoreError("target_not_found", "No admin overview is available for the resolved platform.", context.correlationId));
  return ok({ platform: model.platform, counts: model.counts, recent: { auditLogs: model.recent.auditLogs.filter((item) => item.platform.platformId === context.platform.platformId), adminActions: model.recent.adminActions.filter((item) => item.platform.platformId === context.platform.platformId), securityEvents: model.recent.securityEvents.filter((item) => item.platform.platformId === context.platform.platformId) } });
}