import type { AdminAdminActionItem, AdminAuditLogItem, AdminPlatformContext, AdminSecurityEventItem } from "../../contracts/admin";

export interface AdminOverviewCounts { readonly pendingPaymentReviews: number; readonly pendingRefunds: number; readonly suspiciousSecurityEvents: number; readonly activeSubscriptions: number; readonly expiredSubscriptions: number; readonly activeGrants: number; readonly revokedGrants: number; readonly contentAwaitingRelease: number; readonly assessmentsAwaitingReview: number; }
export interface AdminOverviewReadModel { readonly platform: AdminPlatformContext; readonly counts: AdminOverviewCounts; readonly recent: { readonly auditLogs: readonly AdminAuditLogItem[]; readonly adminActions: readonly AdminAdminActionItem[]; readonly securityEvents: readonly AdminSecurityEventItem[] }; }
export interface AdminReadModels { getOverview(platformId: string): AdminOverviewReadModel | undefined; }
export class InMemoryAdminReadModels implements AdminReadModels {
  constructor(private readonly overviewByPlatform: ReadonlyMap<string, AdminOverviewReadModel>) {}
  getOverview(platformId: string) { return this.overviewByPlatform.get(platformId); }
}
const platform = (platformId: string, platformCode: "medway" | "elite", platformDisplayName: string): AdminPlatformContext => ({ platformId, platformCode, platformDisplayName });
const sample = (p: AdminPlatformContext, prefix: string, counts: AdminOverviewCounts): AdminOverviewReadModel => ({ platform: p, counts, recent: { auditLogs: [{ id: `${prefix}-audit-001`, platform: p, occurredAt: "2026-01-01T10:00:00.000Z", actorType: "admin", actorId: `${prefix}-admin-001`, action: "overview_read", entityType: "platform", entityId: p.platformId, correlationId: `${prefix}-correlation-001` }], adminActions: [{ id: `${prefix}-action-001`, platform: p, adminUserId: `${prefix}-admin-001`, actionType: "read_overview", targetEntityType: "platform", targetEntityId: p.platformId, authorizationReference: `${prefix}-authorization-redacted-001`, occurredAt: "2026-01-01T10:00:00.000Z", outcome: "succeeded" }], securityEvents: [{ id: `${prefix}-security-001`, platform: p, eventType: "admin_security", occurredAt: "2026-01-01T10:00:00.000Z", userId: `${prefix}-user-001`, sessionId: null, severity: "info", metadataReference: `${prefix}-security-redacted-001` }] } });
export function createInMemoryAdminReadModels(): InMemoryAdminReadModels {
  const medway = platform("platform-medway", "medway", "Medway");
  const elite = platform("platform-elite", "elite", "Elite");
  return new InMemoryAdminReadModels(new Map([
    [medway.platformId, sample(medway, "med", { pendingPaymentReviews: 2, pendingRefunds: 1, suspiciousSecurityEvents: 2, activeSubscriptions: 3, expiredSubscriptions: 1, activeGrants: 4, revokedGrants: 1, contentAwaitingRelease: 2, assessmentsAwaitingReview: 1 })],
    [elite.platformId, sample(elite, "elite", { pendingPaymentReviews: 1, pendingRefunds: 0, suspiciousSecurityEvents: 1, activeSubscriptions: 1, expiredSubscriptions: 0, activeGrants: 1, revokedGrants: 0, contentAwaitingRelease: 1, assessmentsAwaitingReview: 0 })],
  ]));
}