import type {
  AdminOverview,
  AdminOverviewActivity,
  AdminOverviewBreakdownItem,
  AdminOverviewDashboard,
  AdminOverviewMetric,
  AdminPendingReview,
} from "./adminApi.types";

const percentage = (value: number, total: number) => total ? Number(((value / total) * 100).toFixed(1)) : 0;
const trend = (value: number) => value > 0 ? 100 : 0;
const sparkline = (value: number) => {
  const base = Math.max(value, 1);
  return [0.24, 0.32, 0.28, 0.46, 0.52, 0.72, 1].map((factor) => Math.round(base * factor));
};

const metric = (id: AdminOverviewMetric["id"], label: string, value: number, comparisonLabel: string): AdminOverviewMetric => ({
  id,
  label,
  value,
  format: "integer",
  trendDirection: "up",
  trendPercentage: trend(value),
  comparisonLabel,
  sparkline: sparkline(value),
  accessibleTrend: value > 0 ? `${label} has live persisted records.` : `${label} has no persisted records yet.`,
});

const breakdown = (id: string, label: string, value: number, tone: AdminOverviewBreakdownItem["tone"], total: number): AdminOverviewBreakdownItem => ({
  id,
  label,
  value,
  percentage: percentage(value, total),
  tone,
});

function activityFromOverview(overview: AdminOverview): AdminOverviewActivity[] {
  const brand = overview.platform.platformDisplayName;
  return [
    ...overview.recentAdminActions.slice(0, 2).map((item) => ({
      id: `action-${item.id}`,
      kind: "instructor" as const,
      title: item.actionType,
      detail: `${item.outcome} · ${brand}`,
      relativeTime: "Recent",
    })),
    ...overview.recentAuditLogs.slice(0, 2).map((item) => ({
      id: `audit-${item.id}`,
      kind: "content" as const,
      title: item.action,
      detail: `${item.entityType} · ${brand}`,
      relativeTime: "Recent",
    })),
    ...overview.recentSecurityEvents.slice(0, 1).map((item) => ({
      id: `security-${item.id}`,
      kind: "student" as const,
      title: item.eventType,
      detail: `${item.severity} · ${brand}`,
      relativeTime: "Recent",
    })),
  ];
}

function pendingReviewsFromOverview(overview: AdminOverview): AdminPendingReview[] {
  const items: AdminPendingReview[] = [];
  if (overview.contentAwaitingReleaseCount > 0) {
    items.push({
      id: `${overview.platform.platformCode}-content-release`,
      title: "Content awaiting release",
      detail: `${overview.platform.platformDisplayName} · publish queue`,
      typeLabel: "Content",
      tone: "warning",
      relativeTime: "Now",
    });
  }
  if (overview.assessmentsAwaitingReviewCount > 0) {
    items.push({
      id: `${overview.platform.platformCode}-assessment-review`,
      title: "Assessments awaiting review",
      detail: `${overview.platform.platformDisplayName} · review queue`,
      typeLabel: "Assessment",
      tone: "warning",
      relativeTime: "Now",
    });
  }
  if (overview.pendingPaymentReviewsCount > 0) {
    items.push({
      id: `${overview.platform.platformCode}-payment-review`,
      title: "Payments awaiting review",
      detail: `${overview.platform.platformDisplayName} · finance queue`,
      typeLabel: "Payment",
      tone: "neutral",
      relativeTime: "Now",
    });
  }
  return items;
}

export function aggregateLiveAdminOverviews(overviews: readonly AdminOverview[]): AdminOverview {
  const totals = overviews.reduce((acc, item) => ({
    pendingPaymentReviewsCount: acc.pendingPaymentReviewsCount + item.pendingPaymentReviewsCount,
    pendingRefundsCount: acc.pendingRefundsCount + item.pendingRefundsCount,
    suspiciousSecurityEventsCount: acc.suspiciousSecurityEventsCount + item.suspiciousSecurityEventsCount,
    activeSubscriptionsCount: acc.activeSubscriptionsCount + item.activeSubscriptionsCount,
    expiredSubscriptionsCount: acc.expiredSubscriptionsCount + item.expiredSubscriptionsCount,
    activeGrantsCount: acc.activeGrantsCount + item.activeGrantsCount,
    revokedGrantsCount: acc.revokedGrantsCount + item.revokedGrantsCount,
    contentAwaitingReleaseCount: acc.contentAwaitingReleaseCount + item.contentAwaitingReleaseCount,
    assessmentsAwaitingReviewCount: acc.assessmentsAwaitingReviewCount + item.assessmentsAwaitingReviewCount,
    recentAuditLogs: [...acc.recentAuditLogs, ...item.recentAuditLogs],
    recentAdminActions: [...acc.recentAdminActions, ...item.recentAdminActions],
    recentSecurityEvents: [...acc.recentSecurityEvents, ...item.recentSecurityEvents],
  }), {
    pendingPaymentReviewsCount: 0,
    pendingRefundsCount: 0,
    suspiciousSecurityEventsCount: 0,
    activeSubscriptionsCount: 0,
    expiredSubscriptionsCount: 0,
    activeGrantsCount: 0,
    revokedGrantsCount: 0,
    contentAwaitingReleaseCount: 0,
    assessmentsAwaitingReviewCount: 0,
    recentAuditLogs: [] as AdminOverview["recentAuditLogs"],
    recentAdminActions: [] as AdminOverview["recentAdminActions"],
    recentSecurityEvents: [] as AdminOverview["recentSecurityEvents"],
  });

  return {
    platform: {
      platformId: "all-brands",
      platformCode: "medway",
      platformDisplayName: "All Brands",
    },
    ...totals,
  };
}

export function liveOverviewToDashboard(overview: AdminOverview): AdminOverviewDashboard {
  const reviewTotal = overview.contentAwaitingReleaseCount + overview.assessmentsAwaitingReviewCount;
  const paymentTotal = overview.pendingPaymentReviewsCount + overview.pendingRefundsCount;
  const grantTotal = overview.activeGrantsCount + overview.revokedGrantsCount;
  const subscriptionTotal = overview.activeSubscriptionsCount + overview.expiredSubscriptionsCount;
  const operationalTotal = Math.max(reviewTotal + paymentTotal + grantTotal + subscriptionTotal + overview.suspiciousSecurityEventsCount, 1);
  const enrollmentPoints = sparkline(subscriptionTotal + overview.activeGrantsCount).map((value, index) => ({
    label: ["W1", "W2", "W3", "W4", "W5", "W6", "Now"][index] ?? `P${index + 1}`,
    current: value,
    previous: Math.max(0, value - 1),
  }));
  const trafficSources = [
    breakdown("active-subscriptions", "Active subscriptions", overview.activeSubscriptionsCount, "success", operationalTotal),
    breakdown("active-grants", "Active grants", overview.activeGrantsCount, "success", operationalTotal),
    breakdown("content-review", "Content queue", overview.contentAwaitingReleaseCount, "warning", operationalTotal),
    breakdown("security-events", "Security events", overview.suspiciousSecurityEventsCount, "danger", operationalTotal),
  ];
  const orderStatuses = [
    breakdown("payment-reviews", "Payment reviews", overview.pendingPaymentReviewsCount, "warning", Math.max(paymentTotal, 1)),
    breakdown("pending-refunds", "Pending refunds", overview.pendingRefundsCount, "danger", Math.max(paymentTotal, 1)),
    breakdown("clear", "Clear", Math.max(0, 1 - paymentTotal), "success", Math.max(paymentTotal, 1)),
  ];
  const paymentSegments = [
    breakdown("review", "Pending review", overview.pendingPaymentReviewsCount, "warning", Math.max(paymentTotal, 1)),
    breakdown("refund", "Pending refund", overview.pendingRefundsCount, "danger", Math.max(paymentTotal, 1)),
    breakdown("clear", "No pending action", Math.max(0, 1 - paymentTotal), "success", Math.max(paymentTotal, 1)),
  ];

  return {
    metrics: [
      metric("students", "Active Grants", overview.activeGrantsCount, "live access records"),
      metric("courses", "Active Subscriptions", overview.activeSubscriptionsCount, "live commerce records"),
      metric("instructors", "Review Queue", reviewTotal, "content and assessments"),
      metric("revenue", "Payment Queue", paymentTotal, "pending actions"),
    ],
    enrollment: {
      total: overview.activeSubscriptionsCount + overview.activeGrantsCount,
      trendPercentage: trend(overview.activeSubscriptionsCount + overview.activeGrantsCount),
      points: enrollmentPoints,
    },
    traffic: {
      total: operationalTotal === 1 ? 0 : operationalTotal,
      trendPercentage: trend(operationalTotal === 1 ? 0 : operationalTotal),
      sparkline: sparkline(operationalTotal === 1 ? 0 : operationalTotal),
      sources: trafficSources,
    },
    orders: {
      total: paymentTotal,
      trendPercentage: trend(paymentTotal),
      statuses: orderStatuses,
    },
    recentActivity: activityFromOverview(overview).slice(0, 5),
    pendingReviews: pendingReviewsFromOverview(overview).slice(0, 3),
    paymentStatus: {
      totalRevenue: paymentTotal,
      currency: "EGP",
      segments: paymentSegments,
    },
  };
}
