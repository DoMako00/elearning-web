import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, CreditCard, FileCheck2, GraduationCap, ShieldCheck, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import "./admin-overview.css";

type Step = { title: string; detail: string; to: string; icon: LucideIcon; chip?: { label: string; alert?: boolean } };

export function OverviewPage() {
  const { overview, domainLoading, domainError } = useAdminV2();
  const counts = overview?.counts;
  const show = (value: number | undefined) => value === undefined ? (domainLoading ? "…" : "—") : value.toLocaleString();

  const metrics: Array<{ label: string; value: string; note: string; to: string; icon: LucideIcon }> = [
    { label: "Student accounts", value: show(counts?.totalStudents), note: counts ? `${counts.activeStudents.toLocaleString()} active` : "Records unavailable", to: "/admin/students", icon: UsersRound },
    { label: "Published courses", value: show(counts?.publishedCourses), note: "In the course catalogue", to: "/admin/courses", icon: BookOpen },
    { label: "Content to review", value: show(counts?.contentAwaitingRelease), note: "Instructor submissions", to: "/admin/content", icon: FileCheck2 },
    { label: "Payments to review", value: show(counts?.pendingPaymentReviews), note: "Pending decisions", to: "/admin/payments", icon: CreditCard },
  ];

  const awaitingContent = counts?.contentAwaitingRelease ?? 0;
  const awaitingPayments = counts?.pendingPaymentReviews ?? 0;
  const steps: Step[] = [
    { title: "Set the curriculum", detail: "Confirm the university, year, semester and approved subjects.", to: "/admin/curriculum", icon: BookOpen },
    { title: "Set up a course", detail: "Create the brand course, map it to a subject and assign its instructor.", to: "/admin/courses", icon: GraduationCap, chip: counts ? { label: `${counts.publishedCourses.toLocaleString()} published` } : undefined },
    { title: "Review lesson files", detail: "Approve or return instructor videos and PDFs before students see them.", to: "/admin/content", icon: FileCheck2, chip: counts ? { label: awaitingContent ? `${awaitingContent.toLocaleString()} waiting` : "Up to date", alert: awaitingContent > 0 } : undefined },
    { title: "Manage people and access", detail: "Create instructor credentials and manage student accounts and seats.", to: "/admin/instructors", icon: UsersRound, chip: counts ? { label: `${counts.totalStudents.toLocaleString()} students` } : undefined },
  ];

  const attention = [
    awaitingContent > 0 && { label: `${awaitingContent.toLocaleString()} lesson ${awaitingContent === 1 ? "file" : "files"} awaiting approval`, to: "/admin/content", icon: FileCheck2 },
    awaitingPayments > 0 && { label: `${awaitingPayments.toLocaleString()} ${awaitingPayments === 1 ? "payment" : "payments"} to review`, to: "/admin/payments", icon: CreditCard },
  ].filter((item): item is { label: string; to: string; icon: LucideIcon } => Boolean(item));

  const shortcuts: Array<{ title: string; to: string; icon: LucideIcon }> = [
    { title: "Instructor accounts", to: "/admin/instructors", icon: UserRound },
    { title: "Student access", to: "/admin/students", icon: GraduationCap },
    { title: "Payments", to: "/admin/payments", icon: CreditCard },
    { title: "Security", to: "/admin/security", icon: ShieldCheck },
  ];

  return (
    <section className={`admin-v2__page admin-overview-v2${domainError ? " has-status" : ""}`} aria-label="Super Admin overview">
      {domainError && <AdminV2DomainStatus />}

      <div className="admin-overview-v2__metrics">
        {metrics.map(({ label, value, note, to, icon: Icon }) => <Link key={label} to={to} className="admin-overview-v2__metric">
          <span className="admin-overview-v2__metric-icon"><Icon size={20} aria-hidden="true" /></span>
          <span className="admin-overview-v2__metric-copy"><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>)}
      </div>

      <div className="admin-overview-v2__main">
        <section className="admin-overview-v2__card admin-overview-v2__flow" aria-labelledby="admin-overview-flow">
          <header><h2 id="admin-overview-flow">Run a course, setup to release</h2><p>Day-to-day teaching stays with the instructor. You configure access and approve materials.</p></header>
          <ol>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return <li key={step.title}><Link to={step.to}>
                <span className="admin-overview-v2__step-no">{index + 1}</span>
                <span className="admin-overview-v2__step-icon"><Icon size={18} aria-hidden="true" /></span>
                <span className="admin-overview-v2__step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span>
                {step.chip && <em className={step.chip.alert ? "is-alert" : ""}>{step.chip.label}</em>}
                <ArrowRight size={16} aria-hidden="true" />
              </Link></li>;
            })}
          </ol>
        </section>

        <div className="admin-overview-v2__side">
          <section className="admin-overview-v2__card admin-overview-v2__attention" aria-labelledby="admin-overview-attention">
            <header><h2 id="admin-overview-attention">Needs your attention</h2></header>
            {attention.length ? <ul>{attention.map(({ label, to, icon: Icon }) => <li key={to}><Link to={to}><Icon size={17} aria-hidden="true" /><span>{label}</span><ArrowRight size={15} aria-hidden="true" /></Link></li>)}</ul>
              : <p className="admin-overview-v2__clear"><CheckCircle2 size={18} aria-hidden="true" />{counts ? "Nothing is waiting on you." : domainLoading ? "Checking for pending work…" : "Pending work is unavailable right now."}</p>}
          </section>

          <section className="admin-overview-v2__card admin-overview-v2__shortcuts" aria-labelledby="admin-overview-shortcuts">
            <header><h2 id="admin-overview-shortcuts">Platform operations</h2></header>
            <ul>{shortcuts.map(({ title, to, icon: Icon }) => <li key={to}><Link to={to}><Icon size={17} aria-hidden="true" /><span>{title}</span><ArrowUpRight size={15} aria-hidden="true" /></Link></li>)}</ul>
          </section>
        </div>
      </div>
    </section>
  );
}

export default OverviewPage;
