import {
  ArrowRight,
  BookOpen,
  CreditCard,
  FileText,
  GraduationCap,
  Plus,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { useAdminOverview } from "../../../features/admin/hooks/useAdminOverview";
import { brandToPlatform } from "../../../features/admin/hooks/useAdminBrand";
import {
  AdminStatCard,
  AdminTrendSparkline,
} from "../../../features/admin/components/AdminStatCard";
import {
  AdminEnrollmentChart,
  AdminPaymentDonut,
} from "../../../features/admin/components/AdminOverviewCharts";
import type {
  AdminBrandContext,
  AdminBrandView,
  AdminOverview,
  AdminOverviewActivity,
  AdminOverviewDashboard,
  AdminOverviewMetricId,
} from "../../../features/admin/api";
import {
  WorkspaceCard,
  WorkspaceMetric,
  WorkspaceState,
} from "../../../features/admin/components/AdminWorkspacePrimitives";

const number = new Intl.NumberFormat("en-EG");

const metricIcons: Record<AdminOverviewMetricId, LucideIcon> = {
  students: UsersRound,
  courses: BookOpen,
  instructors: UserRound,
  revenue: CreditCard,
};

const activityIcons: Record<AdminOverviewActivity["kind"], LucideIcon> = {
  student: GraduationCap,
  course: BookOpen,
  instructor: UserPlus,
  payment: CreditCard,
  content: FileText,
};

const quickLinks = [
  { label: "Add Student", icon: GraduationCap, path: "/admin/students" },
  { label: "Add Course", icon: BookOpen, path: "/admin/courses?action=create" },
  { label: "Add Instructor", icon: UserPlus, path: "/admin/instructors" },
  { label: "Review Payments", icon: CreditCard, path: "/admin/payments" },
  {
    label: "Manage Subscriptions",
    icon: UsersRound,
    path: "/admin/subscriptions",
  },
  { label: "Open Content Library", icon: FileText, path: "/admin/content" },
  { label: "Manage Devices", icon: ShieldCheck, path: "/admin/security" },
  { label: "Configure Curriculum", icon: Settings, path: "/admin/curriculum" },
] as const;

function QuickLinks() {
  return (
    <nav className="admin-overview-destinations" aria-label="Admin quick links">
      {quickLinks.map(({ label, icon: Icon, path }) => (
        <Link key={path} to={path}>
          <Icon aria-hidden="true" />
          {label}
          <ArrowRight aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}

function CardHeader({
  title,
  count,
  action = "This Month",
}: {
  title: string;
  count?: number;
  action?: string;
}) {
  return (
    <header className="admin-card-header">
      <h2>
        {title}
        {count !== undefined && <span>{count}</span>}
      </h2>
      {action && (
        <button type="button" aria-label={`${action} for ${title}`}>
          {action}
        </button>
      )}
    </header>
  );
}

function BreakdownList({
  items,
}: {
  items: AdminOverviewDashboard["orders"]["statuses"];
}) {
  return (
    <ul className="admin-breakdown-list">
      {items.map((item) => (
        <li key={item.id}>
          <span>
            <i className={`is-${item.tone}`} />
            {item.label}
          </span>
          <strong>{number.format(item.value)}</strong>
          <small>{item.percentage}%</small>
        </li>
      ))}
    </ul>
  );
}

function OverviewContent({ dashboard }: { dashboard: AdminOverviewDashboard }) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  return (
    <>
      <div className="admin-metric-grid">
        {dashboard.metrics.map((metric) => (
          <AdminStatCard
            key={metric.id}
            metric={metric}
            icon={metricIcons[metric.id]}
          />
        ))}
      </div>
      <div className="admin-overview-middle">
        <article className="admin-dashboard-card admin-enrollment-card">
          <CardHeader title="Access Overview" />
          <div className="admin-card-kpi">
            <div>
              <strong>{number.format(dashboard.enrollment.total)}</strong>
              <span>Active subscriptions and grants</span>
            </div>
            <span className="admin-trend is-up">
              ↑ {dashboard.enrollment.trendPercentage}%{" "}
              <small>live records</small>
            </span>
          </div>
          <AdminEnrollmentChart enrollment={dashboard.enrollment} />
        </article>
        <article className="admin-dashboard-card admin-traffic-card">
          <CardHeader title="Operational Signals" />
          <div className="admin-card-kpi admin-card-kpi--inline">
            <div>
              <span>Live signals</span>
              <strong>{number.format(dashboard.traffic.total)}</strong>
            </div>
            <span className="admin-trend is-up">
              ↑ {dashboard.traffic.trendPercentage}%
            </span>
            <AdminTrendSparkline values={dashboard.traffic.sparkline} />
          </div>
          <BreakdownList items={dashboard.traffic.sources} />
          <button
            className="admin-card-footer-link"
            type="button"
            onClick={() =>
              setFeedback(
                "Analytics details will connect as persisted event domains expand.",
              )
            }
          >
            View full analytics <ArrowRight aria-hidden="true" />
          </button>
        </article>
        <article className="admin-dashboard-card admin-orders-card">
          <CardHeader title="Payment Queue" />
          <div className="admin-card-kpi admin-card-kpi--inline">
            <div>
              <span>Pending actions</span>
              <strong>{number.format(dashboard.orders.total)}</strong>
            </div>
            <span className="admin-trend is-up">
              ↑ {dashboard.orders.trendPercentage}%
            </span>
            <span className="admin-soft-icon">
              <ShoppingCart aria-hidden="true" />
            </span>
          </div>
          <BreakdownList items={dashboard.orders.statuses} />
          <button
            className="admin-card-footer-link"
            type="button"
            onClick={() => navigate("/admin/payments")}
          >
            View all orders <ArrowRight aria-hidden="true" />
          </button>
        </article>
        <article className="admin-dashboard-card admin-activity-card">
          <CardHeader title="Recent Activity" action="View all" />
          {dashboard.recentActivity.length ? (
            <ul className="admin-activity-list">
              {dashboard.recentActivity.map((activity) => {
                const Icon = activityIcons[activity.kind];
                return (
                  <li key={activity.id}>
                    <span className="admin-list-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{activity.title}</strong>
                      <small>{activity.detail}</small>
                    </span>
                    <time>{activity.relativeTime}</time>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="admin-card-empty">
              <FileText aria-hidden="true" />
              <strong>No recent activity yet</strong>
              <span>
                Audit and admin action events will appear here once operational
                activity is recorded.
              </span>
            </div>
          )}
        </article>
      </div>
      <div className="admin-overview-bottom">
        <article className="admin-dashboard-card admin-reviews-card">
          <CardHeader
            title="Pending Reviews"
            count={dashboard.pendingReviews.length}
            action="View all"
          />
          {dashboard.pendingReviews.length ? (
            <ul className="admin-review-list">
              {dashboard.pendingReviews.map((review) => (
                <li key={review.id}>
                  <span className="admin-list-icon">
                    <BookOpen aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{review.title}</strong>
                    <small>{review.detail}</small>
                  </span>
                  <em className={`is-${review.tone}`}>{review.typeLabel}</em>
                  <time>{review.relativeTime}</time>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-card-empty">
              <BookOpen aria-hidden="true" />
              <strong>No pending reviews</strong>
              <span>
                Course releases, resource approvals, and assessments that need
                attention will show up here.
              </span>
            </div>
          )}
        </article>
        <article className="admin-dashboard-card admin-payment-card">
          <CardHeader title="Payment Status" />
          <AdminPaymentDonut payment={dashboard.paymentStatus} />
          <button
            className="admin-card-footer-link"
            type="button"
            onClick={() => navigate("/admin/payments")}
          >
            View transactions <ArrowRight aria-hidden="true" />
          </button>
        </article>
        <article className="admin-dashboard-card admin-quick-card">
          <CardHeader title="Quick Links" action="" />
          <div className="admin-quick-links">
            {quickLinks.map(({ label, icon: Icon, ...item }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  "path" in item
                    ? navigate(item.path)
                    : setFeedback(`${label} is a frontend preview action.`)
                }
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                <Plus aria-hidden="true" />
              </button>
            ))}
          </div>
        </article>
      </div>
      <span className="admin-sr-only" role="status" aria-live="polite">
        {feedback}
      </span>
    </>
  );
}

function ApiOverviewContent({ overview }: { overview: AdminOverview }) {
  const metrics = [
    {
      title: "Active subscriptions",
      value: overview.activeSubscriptionsCount,
      icon: UsersRound,
    },
    {
      title: "Active access grants",
      value: overview.activeGrantsCount,
      icon: ShieldCheck,
    },
    {
      title: "Pending payment reviews",
      value: overview.pendingPaymentReviewsCount,
      icon: CreditCard,
    },
    {
      title: "Content awaiting release",
      value: overview.contentAwaitingReleaseCount,
      icon: BookOpen,
    },
  ] as const;
  const recentActivity = [
    ...overview.recentAdminActions.map((item) => ({
      id: "action-" + item.id,
      title: item.actionType,
      detail: item.targetEntityType + " · " + item.outcome,
      occurredAt: item.occurredAt,
    })),
    ...overview.recentAuditLogs.map((item) => ({
      id: "audit-" + item.id,
      title: item.action,
      detail: item.entityType,
      occurredAt: item.occurredAt,
    })),
    ...overview.recentSecurityEvents.map((item) => ({
      id: "security-" + item.id,
      title: item.eventType.replaceAll("_", " "),
      detail: item.severity,
      occurredAt: item.occurredAt,
    })),
  ]
    .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt))
    .slice(0, 8);
  return (
    <div className="admin-api-overview">
      <div className="admin-workspace-metrics">
        {metrics.map((metric) => (
          <WorkspaceMetric
            key={metric.title}
            title={metric.title}
            value={number.format(metric.value)}
            icon={metric.icon}
            note="Live persisted records"
          />
        ))}
      </div>
      <WorkspaceCard
        title="Access overview"
        className="admin-api-overview__access"
      >
        <ul className="admin-api-overview__stat-list">
          {[
            { label: "Active subscriptions", value: overview.activeSubscriptionsCount },
            { label: "Expired subscriptions", value: overview.expiredSubscriptionsCount },
            { label: "Active access grants", value: overview.activeGrantsCount },
            { label: "Revoked access grants", value: overview.revokedGrantsCount },
          ].map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <strong>{number.format(item.value)}</strong>
            </li>
          ))}
        </ul>
      </WorkspaceCard>
      <WorkspaceCard
        title="Operational queue"
        className="admin-api-overview__queue"
      >
        <ul className="admin-api-overview__queue-list">
          {[
            {
              label: "Payment reviews",
              value: overview.pendingPaymentReviewsCount,
              path: "/admin/payments",
            },
            {
              label: "Refund reviews",
              value: overview.pendingRefundsCount,
              path: "/admin/payments",
            },
            {
              label: "Assessments to review",
              value: overview.assessmentsAwaitingReviewCount,
              path: "/admin/content",
            },
          ].map((item) => (
            <li key={item.label}>
              <Link to={item.path}>
                <span>{item.label}</span>
                <strong>{number.format(item.value)}</strong>
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </WorkspaceCard>
      <WorkspaceCard
        title="Content readiness"
        className="admin-api-overview__content"
      >
        <div className="admin-api-overview__highlight">
          <BookOpen aria-hidden="true" />
          <strong>{number.format(overview.contentAwaitingReleaseCount)}</strong>
          <span>items awaiting release</span>
        </div>
        <Link className="admin-api-overview__card-link" to="/admin/content">
          Open content <ArrowRight aria-hidden="true" />
        </Link>
      </WorkspaceCard>
      <WorkspaceCard
        title="Recent activity"
        className="admin-api-overview__recent"
      >
        {recentActivity.length ? (
          <ul className="admin-api-overview__activity">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <time dateTime={item.occurredAt}>
                  {new Date(item.occurredAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-api-overview__empty">
            No recent activity is available for this brand context.
          </p>
        )}
      </WorkspaceCard>
      <WorkspaceCard
        title="Security signals"
        className="admin-api-overview__security"
      >
        <div className="admin-api-overview__security-summary">
          <ShieldCheck aria-hidden="true" />
          <span>Suspicious events</span>
          <strong>{number.format(overview.suspiciousSecurityEventsCount)}</strong>
        </div>
        {overview.recentSecurityEvents.length ? (
          <ul className="admin-api-overview__security-list">
            {overview.recentSecurityEvents.slice(0, 4).map((event) => (
              <li key={event.id}>
                <span>{event.eventType.replaceAll("_", " ")}</span>
                <small>{event.severity}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-api-overview__compact-empty">
            No security events recorded.
          </p>
        )}
        <Link className="admin-api-overview__card-link" to="/admin/security">
          Open security <ArrowRight aria-hidden="true" />
        </Link>
      </WorkspaceCard>
      <WorkspaceCard
        title="Quick links"
        className="admin-api-overview__quick"
      >
        <QuickLinks />
      </WorkspaceCard>
      <p className="admin-api-overview__note">
        Counts without a backend read model are not shown. Trends, revenue
        totals, and course or student totals are unavailable in the current API
        contract.
      </p>
    </div>
  );
}

export function AdminOverviewPage() {
  const { brand, availableBrands } = useOutletContext<{
    brand?: AdminBrandContext;
    brandView: AdminBrandView;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const platformTargets = useMemo(
    () =>
      brand ? [brandToPlatform(brand)] : availableBrands.map(brandToPlatform),
    [brand, availableBrands],
  );
  const { data, error, loading, retry, dataSource } =
    useAdminOverview(platformTargets);
  const dashboard = useMemo(() => data?.dashboard, [data]);
  const label = brand?.brandDisplayName ?? "All Brands";
  return (
    <section
      className="admin-page admin-overview"
      aria-label={`${label} overview`}
    >
      {dataSource === "mock" && (
        <div className="admin-workspace-context">
          <span>Overview</span>
          <span className="admin-workspace-preview">
            Local preview data · not production
          </span>
        </div>
      )}
      {dataSource === "api" && data && !loading && !error ? (
        <ApiOverviewContent overview={data} />
      ) : dataSource === "api" ? (
        <WorkspaceCard title={`${label} overview`}>
          <WorkspaceState
            loading={loading}
            error={!!error}
            onRetry={retry}
            title="No overview records available"
          />
        </WorkspaceCard>
      ) : dashboard && !loading && !error ? (
        <OverviewContent dashboard={dashboard} />
      ) : (
        <>
          <div className="admin-workspace-metrics">
            {[
              [UsersRound, "Students"],
              [BookOpen, "Courses"],
              [UserRound, "Instructors"],
              [CreditCard, "Revenue"],
            ].map(([Icon, title]) => (
              <WorkspaceMetric
                key={title as string}
                title={title as string}
                icon={Icon as LucideIcon}
                value="—"
                note={loading ? "Loading records" : "Data unavailable"}
              />
            ))}
          </div>
          <div className="admin-overview-middle">
            <WorkspaceCard title="Access Overview">
              <WorkspaceState
                loading={loading}
                error={!!error}
                onRetry={retry}
                title="Overview unavailable"
              />
            </WorkspaceCard>
            <WorkspaceCard title="Operational Signals">
              <WorkspaceState loading={loading} title="No signals available" />
            </WorkspaceCard>
            <WorkspaceCard title="Payment Queue">
              <WorkspaceState loading={loading} title="Queue unavailable" />
            </WorkspaceCard>
            <WorkspaceCard title="Recent Activity">
              <WorkspaceState loading={loading} title="Activity unavailable" />
            </WorkspaceCard>
          </div>
          <div className="admin-overview-bottom">
            <WorkspaceCard title="Pending Reviews">
              <WorkspaceState loading={loading} title="Reviews unavailable" />
            </WorkspaceCard>
            <WorkspaceCard title="Payment Status">
              <WorkspaceState
                loading={loading}
                title="Payment totals unavailable"
              />
            </WorkspaceCard>
            <WorkspaceCard title="Quick Links">
              <QuickLinks />
            </WorkspaceCard>
          </div>
        </>
      )}
    </section>
  );
}
