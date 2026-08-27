import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  Crown,
  Info,
  Mail,
  Minus,
  Plus,
  ShieldCheck,
  UserRoundCog,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AdminBrandCode } from "../api";
import type { AdminInstructorFixture } from "./adminInstructors.fixtures";

type DetailTab = "overview" | "schedule" | "performance" | "activity";

const tabs: readonly { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "performance", label: "Performance" },
  { id: "activity", label: "Activity" },
];

const brandLabel = (brandCode: AdminBrandCode) => brandCode === "medway" ? "Medway" : "Elite";

export function AdminInstructorDetailPanel({
  instructor,
  drawer,
  onClose,
  onFeedback,
  onToggleBrand,
  onOpenAssignBrand,
  onOpenAssignCourse,
}: {
  instructor: AdminInstructorFixture;
  drawer: boolean;
  onClose: () => void;
  onFeedback: (message: string) => void;
  onToggleBrand: (brandCode: AdminBrandCode) => void;
  onOpenAssignBrand: () => void;
  onOpenAssignCourse: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [showAllCourses, setShowAllCourses] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setActiveTab("overview");
    setShowAllCourses(false);
  }, [instructor.id]);

  useEffect(() => {
    if (!drawer) return;
    closeRef.current?.focus();
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, [drawer]);

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const activeAssignments = instructor.brandAssignments.filter((assignment) => assignment.status === "active");
  const visibleCourses = showAllCourses ? instructor.courseAssignments : instructor.courseAssignments.slice(0, 4);

  return <aside
    ref={panelRef}
    className={`admin-instructor-detail${drawer ? " is-drawer" : ""}`}
    aria-label={`${instructor.displayName} instructor details`}
    {...(drawer ? { role: "dialog", "aria-modal": true } : {})}
  >
    <header className="admin-instructor-detail__identity">
      <span className="admin-instructor-avatar admin-instructor-avatar--large" aria-hidden="true">{instructor.initials}<i className={`is-${instructor.presence}`} /></span>
      <div>
        <span className={`admin-instructor-global-status is-${instructor.status}`}><i />{instructor.status === "active" ? "Active" : "Inactive"}</span>
        <h2>{instructor.displayName}</h2>
        <p>{instructor.academicTitle}</p>
        <a href={`mailto:${instructor.email}`} onClick={(event) => { event.preventDefault(); onFeedback("Email is unavailable in the frontend preview."); }}>{instructor.email}</a>
        <small>Instructor ID: {instructor.reference}</small>
      </div>
      <button ref={closeRef} className="admin-instructor-detail__close" type="button" aria-label="Close instructor details" onClick={onClose}><X aria-hidden="true" /></button>
    </header>

    <div className="admin-instructor-tabs" role="tablist" aria-label="Instructor details">
      {tabs.map((tab, index) => <button
        key={tab.id}
        ref={(element) => { tabRefs.current[index] = element; }}
        id={`instructor-tab-${tab.id}`}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`instructor-panel-${tab.id}`}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => setActiveTab(tab.id)}
        onKeyDown={(event) => onTabKeyDown(event, index)}
      >{tab.label}</button>)}
    </div>

    <div className="admin-instructor-detail__body">
      {activeTab === "overview" && <section id="instructor-panel-overview" role="tabpanel" aria-labelledby="instructor-tab-overview" tabIndex={0}>
        <div className="admin-instructor-section-heading"><div><h3>Brand Affiliations</h3><p>Independent teaching relationships</p></div><span>{activeAssignments.length}/2 active</span></div>
        <div className="admin-affiliation-grid">
          {(["medway", "elite"] as const).map((brandCode) => {
            const current = instructor.brandAssignments.find((assignment) => assignment.brandCode === brandCode);
            const isActive = current?.status === "active";
            const Icon = brandCode === "medway" ? ShieldCheck : Crown;
            return <article key={brandCode} className={`admin-affiliation-card is-${brandCode}${isActive ? " is-active" : ""}`}>
              <span><Icon aria-hidden="true" /></span>
              <div><strong>{brandLabel(brandCode)}</strong><small>{current ? `${current.teachingRole} · ${current.status}` : "Not assigned"}</small></div>
              <button type="button" aria-label={`${isActive ? "Deactivate" : "Assign"} ${brandLabel(brandCode)} affiliation preview`} onClick={() => onToggleBrand(brandCode)}>{isActive ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}</button>
              {isActive && <Check className="admin-affiliation-card__check" aria-label="Active affiliation" />}
            </article>;
          })}
        </div>
        <div className="admin-instructor-scope-note"><Info aria-hidden="true" /><p><strong>Global identity, independent teaching scope</strong><span>This identity is shared globally. Each brand affiliation is independent; courses and teaching activity remain scoped to their respective brand.</span></p></div>

        <div className="admin-instructor-section-heading admin-instructor-section-heading--courses"><div><h3>Current Course Assignments</h3><p>Every course retains its brand owner</p></div>{instructor.courseAssignments.length > 4 && <button type="button" onClick={() => setShowAllCourses((value) => !value)}>{showAllCourses ? "Show less" : "View all"}</button>}</div>
        {visibleCourses.length > 0 ? <ul className="admin-instructor-course-list">{visibleCourses.map((item) => <li key={item.id}>
          <span className={`is-${item.brandCode}`}><BookOpen aria-hidden="true" /></span>
          <div><strong>{item.courseName}</strong><small>{item.courseCode} · {item.teachingRole}</small></div>
          <em className={`is-${item.brandCode}`}>{brandLabel(item.brandCode)}</em>
          <span className={`admin-course-state is-${item.active ? "active" : "inactive"}`}>{item.active ? "Active" : "Inactive"}</span>
        </li>)}</ul> : <div className="admin-instructor-empty"><BookOpen aria-hidden="true" /><strong>No course assignments</strong><span>Assign an active brand affiliation before adding a course.</span></div>}
      </section>}

      {activeTab === "schedule" && <section id="instructor-panel-schedule" role="tabpanel" aria-labelledby="instructor-tab-schedule" tabIndex={0}>
        <div className="admin-instructor-section-heading"><div><h3>Teaching Schedule</h3><p>Frontend-local, grouped by brand</p></div></div>
        {instructor.schedule.length > 0 ? <ul className="admin-instructor-preview-list">{instructor.schedule.map((item) => <li key={item.id}><span className={`is-${item.brandCode}`}><CalendarDays aria-hidden="true" /></span><div><strong>{item.courseName}</strong><small>{item.dayLabel} · {item.timeLabel} · {item.deliveryMode}</small></div><em className={`is-${item.brandCode}`}>{brandLabel(item.brandCode)}</em></li>)}</ul> : <PreviewEmpty icon={CalendarDays} title="No scheduled teaching" copy="This global identity has no brand-scoped schedule preview." />}
      </section>}

      {activeTab === "performance" && <section id="instructor-panel-performance" role="tabpanel" aria-labelledby="instructor-tab-performance" tabIndex={0}>
        <div className="admin-instructor-section-heading"><div><h3>Performance Preview</h3><p>Metrics remain isolated by brand</p></div></div>
        {instructor.performance.length > 0 ? <div className="admin-instructor-performance">{instructor.performance.map((item) => <article key={item.brandCode}><header><span className={`is-${item.brandCode}`}>{brandLabel(item.brandCode)}</span><BarChart3 aria-hidden="true" /></header><dl><div><dt>Active students</dt><dd>{item.activeStudents}</dd></div><div><dt>Completion</dt><dd>{item.courseCompletionRate}%</dd></div><div><dt>Rating</dt><dd>{item.averageRating || "—"}</dd></div></dl></article>)}</div> : <PreviewEmpty icon={BarChart3} title="No performance preview" copy="Performance appears only after brand-scoped teaching activity exists." />}
      </section>}

      {activeTab === "activity" && <section id="instructor-panel-activity" role="tabpanel" aria-labelledby="instructor-tab-activity" tabIndex={0}>
        <div className="admin-instructor-section-heading"><div><h3>Recent Activity</h3><p>Brand-labelled preview events</p></div></div>
        {instructor.activity.length > 0 ? <ul className="admin-instructor-preview-list">{instructor.activity.map((item) => <li key={item.id}><span className={`is-${item.brandCode}`}><UserRoundCog aria-hidden="true" /></span><div><strong>{item.title}</strong><small>{item.detail} · {item.relativeTime}</small></div><em className={`is-${item.brandCode}`}>{brandLabel(item.brandCode)}</em></li>)}</ul> : <PreviewEmpty icon={UserRoundCog} title="No recent activity" copy="No brand-scoped activity is available for this fixture." />}
      </section>}
    </div>

    <footer className="admin-instructor-actions">
      <button type="button" onClick={onOpenAssignBrand}><ShieldCheck aria-hidden="true" /><span>Assign to Brand</span></button>
      <button type="button" onClick={onOpenAssignCourse}><BookOpen aria-hidden="true" /><span>Assign to Course</span></button>
      <button type="button" onClick={() => setActiveTab("schedule")}><CalendarDays aria-hidden="true" /><span>View Schedule</span></button>
      <button type="button" onClick={() => onFeedback("Messaging is unavailable in the frontend preview.")}><Mail aria-hidden="true" /><span>Contact Preview</span></button>
    </footer>
  </aside>;
}

function PreviewEmpty({ icon: Icon, title, copy }: { icon: typeof CalendarDays; title: string; copy: string }) {
  return <div className="admin-instructor-empty admin-instructor-empty--detail"><Icon aria-hidden="true" /><strong>{title}</strong><span>{copy}</span></div>;
}
