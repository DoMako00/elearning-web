import { ArrowRight, BarChart3, BookOpen, CreditCard, FileText, GraduationCap, LoaderCircle, Megaphone, Plus, Settings, ShoppingCart, UserPlus, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { useAdminOverview } from "../../../features/admin/hooks/useAdminOverview";
import { brandToPlatform } from "../../../features/admin/hooks/useAdminBrand";
import { AdminStatCard, AdminTrendSparkline } from "../../../features/admin/components/AdminStatCard";
import { AdminEnrollmentChart, AdminPaymentDonut } from "../../../features/admin/components/AdminOverviewCharts";
import { getAdminOverviewDashboard } from "../../../features/admin/api/adminOverview.aggregate";
import type { AdminBrandContext, AdminBrandView, AdminOverviewActivity, AdminOverviewDashboard, AdminOverviewMetricId } from "../../../features/admin/api";

const number = new Intl.NumberFormat("en-EG");
const metricIcons: Record<AdminOverviewMetricId, LucideIcon> = { students: UsersRound, courses: BookOpen, instructors: UserRound, revenue: CreditCard };
const activityIcons: Record<AdminOverviewActivity["kind"], LucideIcon> = { student: GraduationCap, course: BookOpen, instructor: UserPlus, payment: CreditCard, content: FileText };
const quickLinks = [
  { label: "Add New Course", icon: BookOpen, path: "/admin/courses" }, { label: "Add New Instructor", icon: UserPlus, path: "/admin/instructors" },
  { label: "Manage Students", icon: GraduationCap, path: "/admin/students" }, { label: "Create Announcement", icon: Megaphone },
  { label: "Reports & Analytics", icon: BarChart3 }, { label: "System Settings", icon: Settings },
] as const;

function CardHeader({ title, count, action = "This Month" }: { title: string; count?: number; action?: string }) {
  return <header className="admin-card-header"><h2>{title}{count !== undefined && <span>{count}</span>}</h2>{action && <button type="button" aria-label={`${action} for ${title}`}>{action}</button>}</header>;
}

function BreakdownList({ items }: { items: AdminOverviewDashboard["orders"]["statuses"] }) {
  return <ul className="admin-breakdown-list">{items.map((item) => <li key={item.id}><span><i className={`is-${item.tone}`} />{item.label}</span><strong>{number.format(item.value)}</strong><small>{item.percentage}%</small></li>)}</ul>;
}

function OverviewContent({ dashboard }: { dashboard: AdminOverviewDashboard }) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  return <>
    <div className="admin-metric-grid">{dashboard.metrics.map((metric) => <AdminStatCard key={metric.id} metric={metric} icon={metricIcons[metric.id]} />)}</div>
    <div className="admin-overview-middle">
      <article className="admin-dashboard-card admin-enrollment-card"><CardHeader title="Enrollment Overview" /><div className="admin-card-kpi"><div><strong>{number.format(dashboard.enrollment.total)}</strong><span>New Enrollments</span></div><span className="admin-trend is-up">↑ {dashboard.enrollment.trendPercentage}% <small>vs last month</small></span></div><AdminEnrollmentChart enrollment={dashboard.enrollment} /></article>
      <article className="admin-dashboard-card admin-traffic-card"><CardHeader title="Platform Traffic" /><div className="admin-card-kpi admin-card-kpi--inline"><div><span>Total Visits</span><strong>{number.format(dashboard.traffic.total)}</strong></div><span className="admin-trend is-up">↑ {dashboard.traffic.trendPercentage}%</span><AdminTrendSparkline values={dashboard.traffic.sparkline} /></div><BreakdownList items={dashboard.traffic.sources} /><button className="admin-card-footer-link" type="button" onClick={() => setFeedback("Full analytics is a frontend preview action.")}>View full analytics <ArrowRight aria-hidden="true" /></button></article>
      <article className="admin-dashboard-card admin-orders-card"><CardHeader title="Orders Summary" /><div className="admin-card-kpi admin-card-kpi--inline"><div><span>Total Orders</span><strong>{number.format(dashboard.orders.total)}</strong></div><span className="admin-trend is-up">↑ {dashboard.orders.trendPercentage}%</span><span className="admin-soft-icon"><ShoppingCart aria-hidden="true" /></span></div><BreakdownList items={dashboard.orders.statuses} /><button className="admin-card-footer-link" type="button" onClick={() => navigate("/admin/payments")}>View all orders <ArrowRight aria-hidden="true" /></button></article>
      <article className="admin-dashboard-card admin-activity-card"><CardHeader title="Recent Activity" action="View all" /><ul className="admin-activity-list">{dashboard.recentActivity.map((activity) => { const Icon = activityIcons[activity.kind]; return <li key={activity.id}><span className="admin-list-icon"><Icon aria-hidden="true" /></span><span><strong>{activity.title}</strong><small>{activity.detail}</small></span><time>{activity.relativeTime}</time></li>; })}</ul></article>
    </div>
    <div className="admin-overview-bottom">
      <article className="admin-dashboard-card admin-reviews-card"><CardHeader title="Pending Reviews" count={dashboard.pendingReviews.length} action="View all" /><ul className="admin-review-list">{dashboard.pendingReviews.map((review) => <li key={review.id}><span className="admin-list-icon"><BookOpen aria-hidden="true" /></span><span><strong>{review.title}</strong><small>{review.detail}</small></span><em className={`is-${review.tone}`}>{review.typeLabel}</em><time>{review.relativeTime}</time></li>)}</ul></article>
      <article className="admin-dashboard-card admin-payment-card"><CardHeader title="Payment Status" /><AdminPaymentDonut payment={dashboard.paymentStatus} /><button className="admin-card-footer-link" type="button" onClick={() => navigate("/admin/payments")}>View transactions <ArrowRight aria-hidden="true" /></button></article>
      <article className="admin-dashboard-card admin-quick-card"><CardHeader title="Quick Links" action="" /><div className="admin-quick-links">{quickLinks.map(({ label, icon: Icon, ...item }) => <button key={label} type="button" onClick={() => "path" in item ? navigate(item.path) : setFeedback(`${label} is a frontend preview action.`)}><Icon aria-hidden="true" /><span>{label}</span><Plus aria-hidden="true" /></button>)}</div></article>
    </div>
    <span className="admin-sr-only" role="status" aria-live="polite">{feedback}</span>
  </>;
}

export function AdminOverviewPage() {
  const { brand, brandView } = useOutletContext<{ brand?: AdminBrandContext; brandView: AdminBrandView }>();
  const platform = useMemo(() => brand ? brandToPlatform(brand) : undefined, [brand]);
  const { data, error, loading, retry, correlationId } = useAdminOverview(platform);
  const dashboard = brandView === "all" ? getAdminOverviewDashboard("all") : data?.dashboard;
  const label = brand?.brandDisplayName ?? "All Brands";
  return <section className="admin-page admin-overview" aria-label={`${label} overview`}>
    {loading && <div className="admin-overview-loading" aria-live="polite" aria-busy="true"><LoaderCircle aria-hidden="true" /> Loading {label} overview…</div>}
    {error && <div className="admin-feedback admin-feedback--error" role="alert"><div><strong>{error.message}</strong><span>Correlation ID: {error.correlationId}</span></div><button type="button" onClick={retry}>Retry</button></div>}
    {dashboard && !loading && !error && <OverviewContent dashboard={dashboard} />}
    {!dashboard && !loading && !error && <div className="admin-feedback admin-feedback--error" role="status"><div><strong>Dashboard preview data is unavailable.</strong><span>Correlation ID: {correlationId}</span></div><button type="button" onClick={retry}>Retry</button></div>}
  </section>;
}
