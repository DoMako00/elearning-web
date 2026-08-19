import type { AdminAdminActionItem, AdminAuditLogItem, AdminBrandContext, AdminPlatformContext, AdminSecurityEventItem } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
import { adminCoreError, type AdminCoreError } from "../../core/errors";
import type { AdminRequestContext } from "../../core/context";
import type { AdminReadModels } from "./in-memory-admin-read-models";

export interface AdminOverviewResult { readonly brand: AdminBrandContext; /** @deprecated Compatibility projection for existing consumers. */ readonly platform: AdminPlatformContext; readonly counts: { readonly pendingPaymentReviews: number; readonly pendingRefunds: number; readonly suspiciousSecurityEvents: number; readonly activeSubscriptions: number; readonly expiredSubscriptions: number; readonly activeGrants: number; readonly revokedGrants: number; readonly contentAwaitingRelease: number; readonly assessmentsAwaitingReview: number }; readonly recent: { readonly auditLogs: readonly AdminAuditLogItem[]; readonly adminActions: readonly AdminAdminActionItem[]; readonly securityEvents: readonly AdminSecurityEventItem[] }; }
export async function getAdminOverview(context: AdminRequestContext, readModels: AdminReadModels): Promise<Result<AdminOverviewResult, AdminCoreError>> {
  if (!context.brand.isActive) return fail(adminCoreError("brand_mismatch", "The resolved brand is not active.", context.correlationId));
  const model = readModels.getOverview(context.brand.brandId);
  if (!model || model.brand.brandId !== context.brand.brandId || model.brand.brandCode !== context.brand.brandCode) return fail(adminCoreError("target_brand_mismatch", "No admin overview is available for the resolved brand.", context.correlationId));
  return ok({ brand: model.brand, platform: model.platform, counts: model.counts, recent: { auditLogs: model.recent.auditLogs.filter((item) => item.platform.platformId === context.brand.brandId), adminActions: model.recent.adminActions.filter((item) => item.platform.platformId === context.brand.brandId), securityEvents: model.recent.securityEvents.filter((item) => item.platform.platformId === context.brand.brandId) } });
}