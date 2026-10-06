import type { AdminOverview } from "./adminApi.types";

/**
 * Combine only values returned by the API. The live dashboard does not infer
 * historical trends or synthesize counts from a current snapshot.
 */
export function aggregateLiveAdminOverviews(
  overviews: readonly AdminOverview[],
): AdminOverview {
  const first = overviews[0];
  if (!first) {
    throw new Error("At least one Admin overview is required.");
  }

  return {
    platform: {
      platformId: "all-brands",
      platformCode: first.platform.platformCode,
      platformDisplayName: "All Brands",
    },
    pendingPaymentReviewsCount: overviews.reduce(
      (total, overview) => total + overview.pendingPaymentReviewsCount,
      0,
    ),
    pendingRefundsCount: overviews.reduce(
      (total, overview) => total + overview.pendingRefundsCount,
      0,
    ),
    suspiciousSecurityEventsCount: overviews.reduce(
      (total, overview) => total + overview.suspiciousSecurityEventsCount,
      0,
    ),
    activeSubscriptionsCount: overviews.reduce(
      (total, overview) => total + overview.activeSubscriptionsCount,
      0,
    ),
    expiredSubscriptionsCount: overviews.reduce(
      (total, overview) => total + overview.expiredSubscriptionsCount,
      0,
    ),
    activeGrantsCount: overviews.reduce(
      (total, overview) => total + overview.activeGrantsCount,
      0,
    ),
    revokedGrantsCount: overviews.reduce(
      (total, overview) => total + overview.revokedGrantsCount,
      0,
    ),
    contentAwaitingReleaseCount: overviews.reduce(
      (total, overview) => total + overview.contentAwaitingReleaseCount,
      0,
    ),
    assessmentsAwaitingReviewCount: overviews.reduce(
      (total, overview) => total + overview.assessmentsAwaitingReviewCount,
      0,
    ),
    recentAuditLogs: overviews.flatMap((overview) => overview.recentAuditLogs),
    recentAdminActions: overviews.flatMap(
      (overview) => overview.recentAdminActions,
    ),
    recentSecurityEvents: overviews.flatMap(
      (overview) => overview.recentSecurityEvents,
    ),
  };
}
