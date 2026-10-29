import React from "react";
import { Skeleton } from "../ui/Skeleton";
import "../../features/admin-v2/styles/admin-v2.css";
import "../../features/admin-v2/styles/admin-v2-phase2.css";

interface AdminShellSkeletonProps {
  pathname?: string;
  children: React.ReactNode;
}

export const AdminShellSkeleton: React.FC<AdminShellSkeletonProps> = ({
  pathname = "/admin",
  children,
}) => {
  // "/admin/instructors" (Super Admin directory) must not match the instructor portal
  const isInstructor = pathname === "/admin/instructor" || pathname.startsWith("/admin/instructor/");

  // Determine active route label and subtitle
  let routeLabel = "Super Admin overview";
  let routeSubtitle = "Run platform operations, configure courses, and review instructor submissions.";

  if (isInstructor) {
    if (pathname === "/admin/instructor") {
      routeLabel = "Instructor dashboard";
      routeSubtitle = "Follow your teaching workflow from course setup to grading.";
    } else if (pathname === "/admin/instructor/courses") {
      routeLabel = "My courses";
      routeSubtitle = "Build lessons and learning materials for assigned courses.";
    } else if (/^\/admin\/instructor\/courses\/[^/]+$/.test(pathname)) {
      routeLabel = "Course content";
      routeSubtitle = "Build chapters and lessons, then send videos or PDFs for approval.";
    } else if (pathname.includes("/assignments")) {
      routeLabel = "Assignments & grading";
      routeSubtitle = "Publish coursework and grade student submissions.";
    } else if (pathname.includes("/assessments")) {
      routeLabel = "Exams & quizzes";
      routeSubtitle = "Create, publish, and review course assessments.";
    }
  } else {
    if (pathname === "/admin/curriculum") {
      routeLabel = "Curriculum";
      routeSubtitle = "Manage approved academic structures by institution.";
    } else if (pathname === "/admin/courses") {
      routeLabel = "Course setup";
      routeSubtitle = "Create course offerings, map curriculum, and assign instructors.";
    } else if (/^\/admin\/courses\/[^/]+\/builder$/.test(pathname)) {
      routeLabel = "Course builder";
      routeSubtitle = "Organize chapters, lessons, and course attachments.";
    } else if (pathname === "/admin/instructors") {
      routeLabel = "Instructors";
      routeSubtitle = "Manage teaching profiles, account access, and course assignments.";
    } else if (pathname === "/admin/content") {
      routeLabel = "Content approvals";
      routeSubtitle = "Review videos and documents sent by instructors before student release.";
    } else if (pathname === "/admin/roles") {
      routeLabel = "Roles & Permissions";
      routeSubtitle = "Choose who can teach and manage the learning platform.";
    } else if (pathname === "/admin/security") {
      routeLabel = "Security";
      routeSubtitle = "Monitor persisted devices, sessions, and security events.";
    } else if (pathname === "/admin/students") {
      routeLabel = "Students";
      routeSubtitle = "Manage student identity, access, devices, and sessions.";
    } else if (pathname === "/admin/payments") {
      routeLabel = "Payments";
      routeSubtitle = "Review manual payment submissions and approve or reject pending reviews.";
    } else if (pathname === "/admin/subscriptions") {
      routeLabel = "Access & Subscriptions";
      routeSubtitle = "Manage subscription plans, seats, and student lifecycle.";
    } else if (pathname === "/admin/support") {
      routeLabel = "Support Inbox";
      routeSubtitle = "Read and reply to persisted student support conversations.";
    }
  }

  const superAdminNav = [
    { label: "Overview", active: pathname === "/admin" || pathname === "/admin/overview", width: 55 },
    { label: "Curriculum", active: pathname === "/admin/curriculum", width: 68 },
    { label: "Course setup", active: pathname === "/admin/courses", width: 78 },
    { label: "Instructors", active: pathname === "/admin/instructors", width: 70 },
    { label: "Content approvals", active: pathname === "/admin/content", width: 105 },
    { label: "Roles & Permissions", active: pathname === "/admin/roles", width: 110 },
    { label: "Security", active: pathname === "/admin/security", width: 52 },
    { label: "Students", active: pathname === "/admin/students", width: 56 },
    { label: "Payments", active: pathname === "/admin/payments", width: 62 },
    { label: "Subscriptions", active: pathname === "/admin/subscriptions", width: 80 },
    { label: "Support Inbox", active: pathname === "/admin/support", width: 85 },
  ];

  const instructorNav = [
    { label: "Home", active: pathname === "/admin/instructor", width: 40 },
    { label: "My courses", active: pathname.startsWith("/admin/instructor/courses"), width: 72 },
    { label: "Students", active: pathname === "/admin/instructor/students", width: 58 },
    { label: "Subscriptions", active: pathname === "/admin/instructor/subscriptions", width: 84 },
    { label: "Assignments & grading", active: pathname === "/admin/instructor/assignments", width: 125 },
    { label: "Exams & quizzes", active: pathname === "/admin/instructor/assessments", width: 95 },
  ];

  const navigationItems = isInstructor ? instructorNav : superAdminNav;

  return (
    <div
      className={`admin-v2${isInstructor ? " admin-v2--instructor" : ""}`}
      aria-busy="true"
      aria-label="Loading admin workspace"
    >
      {/* ── Left Sidebar ── */}
      <aside className="admin-v2__sidebar">
        {/* Brand */}
        <div className="admin-v2__brand">
          <span className="admin-v2__brand-mark">
            <Skeleton width={20} height={20} borderRadius={4} />
          </span>
          <div className="space-y-1">
            <Skeleton width={85} height={15} borderRadius={3} />
            <Skeleton width={95} height={8} borderRadius={2} />
          </div>
        </div>

        <div className="admin-v2__nav-label">WORKSPACE</div>

        {/* Navigation */}
        <nav aria-label="Loading workspace navigation">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.label}>
                <div className={`admin-v2__nav-link${item.active ? " is-active" : ""}`}>
                  <Skeleton width={17} height={17} borderRadius={4} />
                  <Skeleton width={item.width} height={13} borderRadius={3} />
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-v2__sidebar-footer">
          <div className="admin-v2__help">
            <span className="shrink-0 font-bold">?</span>
            <div className="space-y-1">
              <Skeleton width={60} height={11} borderRadius={2} />
              <Skeleton width={95} height={9} borderRadius={2} />
            </div>
          </div>
          <div className="admin-v2__copyright">
            <Skeleton width={120} height={10} borderRadius={2} />
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <div className="admin-v2__workspace">
        {/* Topbar */}
        <header className="admin-v2__topbar">
          {/* Route Title */}
          <div className="admin-v2__route-title">
            <span className="admin-v2__workspace-kicker">
              {isInstructor ? "INSTRUCTOR WORKSPACE" : "SUPER ADMIN WORKSPACE"}
            </span>
            <h1 className="text-[21px] font-bold text-[#1c2921] leading-tight m-0">
              {routeLabel}
            </h1>
            <p className="text-[11px] text-[#77847c] mt-1 m-0 truncate">
              {routeSubtitle}
            </p>
          </div>

          {/* Search Box */}
          <div className="admin-v2__global-search">
            <Skeleton width={15} height={15} borderRadius={3} />
            <Skeleton width="100%" height={12} borderRadius={3} />
            <kbd>Ctrl K</kbd>
          </div>

          {/* Top Actions */}
          <div className="admin-v2__top-actions">
            {!isInstructor && (
              <div className="admin-v2__brand-switch">
                <Skeleton width={170} height={36} borderRadius={5} />
              </div>
            )}
            <Skeleton width={33} height={33} borderRadius={5} />
            <div className="flex items-center gap-2">
              <Skeleton width={34} height={34} circle />
              <div className="space-y-1">
                <Skeleton width={90} height={11} borderRadius={2} />
                <Skeleton width={60} height={9} borderRadius={2} />
              </div>
            </div>
            <Skeleton width={75} height={33} borderRadius={5} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="admin-v2__main">
          <div className="admin-v2__content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
