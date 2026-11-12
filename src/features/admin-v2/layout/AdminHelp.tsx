import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronRight, Mail, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminRouteMetadata } from "../../../app/pages/admin/adminNavigation";
import { Drawer } from "../shared/AdminV2Primitives";
import { adminGuideFor, replayAdminGuide } from "./AdminGuide";
import "./admin-help.css";

/* Set VITE_ADMIN_SUPPORT_EMAIL to show a contact line; without it the section is omitted rather than shown dead. */
const SUPPORT_EMAIL = ((import.meta.env.VITE_ADMIN_SUPPORT_EMAIL as string | undefined) ?? "").trim();

const summaries: Record<string, string> = {
  overview: "Your starting point. See what needs your attention and follow the setup path from curriculum to release.",
  curriculum: "Define the academic structure — institutions, years, semesters and subjects — that courses are mapped to.",
  courses: "Create brand courses, link each one to an approved subject and assign its instructor.",
  instructors: "Manage the instructor directory, their brands and the courses they teach, and give them a sign-in.",
  roles: "See who has which responsibility and connect an Instructor sign-in to its doctor profile.",
  students: "Manage student accounts, their placement, devices and sessions.",
  payments: "Review manual payment orders and approve or reject them.",
  subscriptions: "Start purchases, manage seats and cancel subscriptions.",
  security: "Monitor devices, sessions and audit events, and act on a student's access.",
};

const tasks: Array<{ label: string; detail: string; to: string }> = [
  { label: "Add a student", detail: "Create an account and give them a setup code", to: "/admin/students" },
  { label: "Approve a payment", detail: "Review orders waiting for a decision", to: "/admin/payments?status=pending_review" },
  { label: "Create a course", detail: "Link it to a subject and an instructor", to: "/admin/courses" },
  { label: "Connect an Instructor sign-in", detail: "Link a login to a doctor profile", to: "/admin/roles" },
  { label: "Start a purchase", detail: "Subscribe students to an offering", to: "/admin/subscriptions" },
  { label: "Revoke a device or sessions", detail: "Act on a student's access", to: "/admin/security" },
];

export function AdminHelpButton({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const guide = adminGuideFor(pathname);
  const meta = getAdminRouteMetadata(pathname);
  const summary = (guide && summaries[guide.id]) ?? meta.description;
  const close = () => setOpen(false);

  return <>
    <button type="button" className="admin-v2__help" aria-haspopup="dialog" onClick={() => setOpen(true)}><span>?</span><div><strong>Need help?</strong><small>Instructions for this page</small></div><ChevronRight aria-hidden="true" /></button>
    {open && createPortal(<Drawer title={`Help: ${meta.label}`} subtitle="How to use this page" onClose={close}>
      <div className="admin-help">
        <p className="admin-help__summary">{summary}</p>

        {guide ? <section aria-labelledby="admin-help-steps">
          <header><h3 id="admin-help-steps">On this page</h3><button type="button" className="admin-help__replay" onClick={() => { close(); replayAdminGuide(); }}><PlayCircle size={15} /> Replay the tour</button></header>
          <ol>{guide.steps.map((step) => <li key={step.title}><strong>{step.title}</strong><span>{step.description}</span></li>)}</ol>
        </section> : <section><h3>On this page</h3><p className="admin-help__muted">Step-by-step help for this screen is coming soon. Use the sidebar to move between sections.</p></section>}

        <section aria-labelledby="admin-help-tasks">
          <h3 id="admin-help-tasks">Common tasks</h3>
          <ul className="admin-help__tasks">{tasks.map((task) => <li key={task.label}><Link to={task.to} onClick={close}><span><b>{task.label}</b><small>{task.detail}</small></span><ArrowRight size={15} aria-hidden="true" /></Link></li>)}</ul>
        </section>

        {SUPPORT_EMAIL && <section aria-labelledby="admin-help-contact">
          <h3 id="admin-help-contact">Still stuck?</h3>
          <a className="admin-help__contact" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`GreenLearn admin help: ${meta.label}`)}`}><Mail size={16} /> {SUPPORT_EMAIL}</a>
        </section>}
      </div>
    </Drawer>, document.body)}
  </>;
}

