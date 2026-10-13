import { Activity, ArrowUpRight, BookOpen, CalendarDays, CircleAlert, CircleDollarSign, CreditCard, FileText, GraduationCap, LibraryBig, LockKeyhole, ShieldCheck, Users, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { relativeTime } from "../data/adminV2.audit";
import type { AdminV2Data, AuditEvent, BrandFilter } from "../types/adminV2.types";

const money = (valueMinor: number | null) => valueMinor === null ? "Unavailable" : new Intl.NumberFormat("en", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(valueMinor / 100);

export function OverviewPage() {
  const { data, brand, overview } = useAdminV2();
  const scoped = useMemo(() => scopeData(data, brand), [brand, data]);
  const activity = overview?.securityEvents.slice(0, 8) ?? [];
  const activeStudents = overview?.counts.activeStudents ?? 0;
  const activeCourses = overview?.counts.publishedCourses ?? 0;
  const activeSubscriptions = overview?.counts.activeSubscriptions ?? 0;
  const approvedPayments = scoped.payments.filter((payment) => payment.status === "Approved");
  const approvedRevenue = money(overview?.counts.approvedRevenueMinor ?? null);
  const pendingPaymentCount = overview?.counts.pendingPaymentReviews ?? 0;
  const rejectedPaymentCount = scoped.payments.filter((payment) => payment.status === "Rejected").length;
  const paymentCounts = {
    approved: approvedPayments.length,
    pending: pendingPaymentCount,
    rejected: rejectedPaymentCount,
  };
  const attention = [
    { label: "Pending payments", value: pendingPaymentCount, route: "/admin/payments", tone: "warning", icon: WalletCards },
    { label: "Content awaiting release", value: overview?.counts.contentAwaitingRelease ?? 0, route: "/admin/content", tone: "neutral", icon: FileText },
    { label: "Courses missing curriculum", value: scoped.courses.filter((course) => course.scope === "Curriculum" && !course.curriculumUnitId).length, route: "/admin/courses", tone: "warning", icon: BookOpen },
    { label: "Suspended Students", value: scoped.students.filter((student) => student.status === "Suspended").length, route: "/admin/students", tone: "danger", icon: LockKeyhole },
  ];
  const levelBars = Array.from(new Set(scoped.students.map((student) => student.academicLevel))).slice(0, 5).map((level) => ({ label: level.replace("Year ", "Y"), value: scoped.students.filter((student) => student.academicLevel === level).length }));
  const maxLevel = Math.max(...levelBars.map((item) => item.value), 1);

  return <section className="admin-v2__page admin-v2__overview-page">
    <AdminV2DomainStatus />
    <div className="admin-v2__overview-kpis">
      <OverviewMetric icon={Users} label="Total Students" value={String(overview?.counts.totalStudents ?? 0)} note={`${activeStudents} active`} tone="green" />
      <OverviewMetric icon={BookOpen} label="Published Courses" value={String(activeCourses)} note="Persisted course records" tone="green" />
      <OverviewMetric icon={CalendarDays} label="Active Subscriptions" value={String(activeSubscriptions)} note="Server-reported current term" tone="green" />
      <OverviewMetric icon={CircleDollarSign} label="Approved Revenue" value={approvedRevenue} note="Not available from the current API" tone="green" />
    </div>
    <div className="admin-v2__overview-main-grid">
      <section className="admin-v2__overview-card admin-v2__overview-enrollment"><OverviewHeader title="Enrollment Overview" detail="Current protected-content entitlements" /><div className="admin-v2__overview-big-stat"><div><strong>{(overview?.counts.activeGrants ?? 0).toLocaleString()}</strong><span>Active AccessGrants</span></div><span className="admin-v2__overview-context">{overview?.counts.totalStudents ?? 0} Student records</span></div><div className="admin-v2__overview-bars" aria-label="Active students by academic level">{levelBars.length ? levelBars.map((item) => <div className="admin-v2__overview-bar" key={item.label}><span>{item.label}</span><i><b style={{ height: `${Math.max(10, item.value / maxLevel * 100)}%` }} /></i><strong>{item.value}</strong></div>) : <OverviewEmpty label="No persisted student placement records yet." />}</div><div className="admin-v2__overview-card-footer"><span>Placement counts from persisted Student records</span><Link to="/admin/students">View students <ArrowUpRight size={13} /></Link></div></section>
      <section className="admin-v2__overview-card"><OverviewHeader title="Platform Activity" detail="Persisted operational counts" /><div className="admin-v2__overview-highlight"><span className="admin-v2__overview-icon"><Activity size={19} /></span><div><strong>{overview?.counts.activeSessions ?? 0}</strong><span>Active sessions</span></div></div><div className="admin-v2__overview-list"><OverviewStat label="Active devices" value={String(overview?.counts.activeDevices ?? 0)} /><OverviewStat label="Course access grants" value={String(overview?.counts.activeGrants ?? 0)} /><OverviewStat label="Recent persisted events" value={String(activity.length)} /></div><div className="admin-v2__overview-card-footer"><span>Not production traffic analytics</span><Link to="/admin/security">Review security <ArrowUpRight size={13} /></Link></div></section>
      <section className="admin-v2__overview-card"><OverviewHeader title="Orders Summary" detail="Manual payment review" /><div className="admin-v2__overview-highlight"><span className="admin-v2__overview-icon"><CreditCard size={19} /></span><div><strong>{scoped.payments.length}</strong><span>Orders returned by the Admin API</span></div></div><div className="admin-v2__overview-list"><OverviewStat label="Approved" value={String(paymentCounts.approved)} tone="success" /><OverviewStat label="Pending review" value={String(paymentCounts.pending)} tone="warning" /><OverviewStat label="Rejected" value={String(paymentCounts.rejected)} tone="danger" /></div><div className="admin-v2__overview-card-footer"><span>{approvedRevenue} approved</span><Link to="/admin/payments">View payments <ArrowUpRight size={13} /></Link></div></section>
      <section className="admin-v2__overview-card admin-v2__overview-activity"><OverviewHeader title="Recent Activity" action={<Link to="/admin/security">View audit <ArrowUpRight size={13} /></Link>} />{activity.length ? <div className="admin-v2__overview-activity-list">{activity.slice(0, 5).map((event) => <ActivityRow key={event.id} event={event} />)}</div> : <OverviewEmpty label="No persisted activity has been recorded yet." />}</section>
    </div>
    <div className="admin-v2__overview-bottom-grid">
      <section className="admin-v2__overview-card admin-v2__overview-attention"><OverviewHeader title="Needs Attention" detail="Derived from persisted Admin records" action={<span className="admin-v2__overview-count">{attention.filter((item) => item.value > 0).length}</span>} /><div className="admin-v2__overview-attention-list">{attention.map((item) => { const Icon = item.icon; return <Link key={item.label} to={item.route} className={`admin-v2__overview-attention-row is-${item.tone}`}><span><Icon size={16} /></span><strong>{item.label}<small>{item.value ? "Requires review" : "Nothing pending"}</small></strong><b>{item.value}</b><ArrowUpRight size={14} /></Link>; })}</div></section>
      <section className="admin-v2__overview-card admin-v2__overview-payment"><OverviewHeader title="Payment Status" detail="Manual payment orders" /><div className="admin-v2__payment-summary"><div className="admin-v2__payment-donut" style={{ "--approved": `${paymentCounts.approved / Math.max(scoped.payments.length, 1) * 100}%`, "--pending": `${paymentCounts.pending / Math.max(scoped.payments.length, 1) * 100}%` } as CSSProperties}><div><strong>{scoped.payments.length}</strong><span>orders</span></div></div><div className="admin-v2__payment-legend"><PaymentLegend label="Approved" value={paymentCounts.approved} tone="success" /><PaymentLegend label="Pending review" value={paymentCounts.pending} tone="warning" /><PaymentLegend label="Rejected" value={paymentCounts.rejected} tone="danger" /></div></div><div className="admin-v2__overview-card-footer"><span>Revenue unavailable</span><Link to="/admin/payments">View transactions <ArrowUpRight size={13} /></Link></div></section>
      <section className="admin-v2__overview-card admin-v2__overview-links"><OverviewHeader title="Quick Links" detail="Implemented Admin workspaces" /><div className="admin-v2__overview-link-grid"><QuickLink icon={GraduationCap} label="Manage Students" to="/admin/students" /><QuickLink icon={CalendarDays} label="Subscriptions" to="/admin/subscriptions" /><QuickLink icon={BookOpen} label="Curriculum" to="/admin/curriculum" /><QuickLink icon={LibraryBig} label="Courses" to="/admin/courses" /><QuickLink icon={FileText} label="Content" to="/admin/content" /><QuickLink icon={ShieldCheck} label="Security" to="/admin/security" /></div></section>
    </div>
  </section>;
}

function scopeData(data: AdminV2Data, brand: BrandFilter) {
  const matches = <T extends { brand?: string }>(items: T[]) => items.filter((item) => brand === "all" || item.brand === brand);
  const courses = matches(data.courses);
  const courseIds = new Set(courses.map((course) => course.id));
  const students = matches(data.students);
  const studentIds = new Set(students.map((student) => student.id));
  const subscriptions = matches(data.subscriptions);
  const payments = matches(data.payments);
  const enrollments = data.enrollments.filter((item) => studentIds.has(item.studentId) && courseIds.has(item.courseId));
  const lessonIds = new Set(data.lessons.filter((lesson) => courseIds.has(lesson.courseId)).map((lesson) => lesson.id));
  return { ...data, courses, students, subscriptions, payments, enrollments, devices: data.devices.filter((device) => studentIds.has(device.studentId)), sessions: data.sessions.filter((session) => studentIds.has(session.studentId)), contentResources: data.contentResources.filter((resource) => lessonIds.has(resource.lessonId)) };
}

function OverviewMetric({ icon: Icon, label, value, note, tone }: { icon: ComponentType<{ size?: number }>; label: string; value: string; note: string; tone: string }) { return <article className={`admin-v2__overview-metric is-${tone}`}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div><i className="admin-v2__overview-spark" aria-label="Trend history is not available from the backend API." /></article>; }
function OverviewHeader({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) { return <header className="admin-v2__overview-card-header"><div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</header>; }
function OverviewStat({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="admin-v2__overview-stat"><span className={tone ? `is-${tone}` : ""} /><strong>{label}</strong><b>{value}</b></div>; }
function PaymentLegend({ label, value, tone }: { label: string; value: number; tone: string }) { return <div><span className={`is-${tone}`} /><strong>{label}</strong><b>{value}</b></div>; }
function ActivityRow({ event }: { event: AuditEvent }) { const icon = /payment|subscription/i.test(event.action) ? CreditCard : /student/i.test(event.action) ? GraduationCap : /content|course/i.test(event.action) ? BookOpen : Activity; const Icon = icon; return <div className="admin-v2__overview-activity-row"><span className={`is-${event.status.toLowerCase()}`}><Icon size={14} /></span><div><strong>{event.action}</strong><small>{event.targetLabel}</small></div><time>{relativeTime(event.timestamp)}</time></div>; }
function OverviewEmpty({ label }: { label: string }) { return <div className="admin-v2__overview-empty"><CircleAlert size={17} /><span>{label}</span></div>; }
function QuickLink({ icon: Icon, label, to }: { icon: ComponentType<{ size?: number }>; label: string; to: string }) { return <Link to={to} className="admin-v2__overview-quick-link"><Icon size={16} /><span>{label}</span><ArrowUpRight size={13} /></Link>; }
