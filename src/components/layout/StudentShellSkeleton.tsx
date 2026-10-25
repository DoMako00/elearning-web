import React from "react";
import { Skeleton } from "../ui/Skeleton";
import { SearchBar } from "../ui/SearchBar";
import "./Sidebar/Sidebar.css";
import "../../app/router/student-shell.css";
import "../../app/router/student-dashboard.css";

interface StudentShellSkeletonProps {
  pathname?: string;
  children: React.ReactNode;
}

export const StudentShellSkeleton: React.FC<StudentShellSkeletonProps> = ({
  pathname = "/",
  children,
}) => {
  const isHome = pathname === "/" || pathname === "";
  const isProfile = pathname.startsWith("/profile");
  const isInstructorProfile = pathname.startsWith("/instructor");
  const isMyCourses = pathname === "/my-courses";
  const isCourseOverview = pathname.startsWith("/my-courses/") && !pathname.includes("/lessons/");
  const isLessonPlayer = pathname.includes("/lessons/");
  const isExplore = pathname.startsWith("/explore");
  const isAssignments = pathname.startsWith("/assignments");
  const isAssessments = pathname.startsWith("/assessments");
  const isCalendar = pathname.startsWith("/calendar");
  const isMessages = pathname.startsWith("/messages");
  const isCommunity = pathname.startsWith("/community");
  const isHelp = pathname.startsWith("/help");
  const isSettings = pathname.startsWith("/settings");

  // Determine breadcrumb labels
  let breadcrumbCategory = "LEARNING SPACE";
  let breadcrumbTitle = "Dashboard";

  if (isProfile) {
    breadcrumbCategory = "STUDENT ACCOUNT";
    breadcrumbTitle = "My Profile";
  } else if (isInstructorProfile) {
    breadcrumbCategory = "PROFILE";
    breadcrumbTitle = "Instructor Profile";
  } else if (isMyCourses) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "My Courses";
  } else if (isCourseOverview) {
    breadcrumbCategory = "MY COURSES";
    breadcrumbTitle = "Course Overview";
  } else if (isLessonPlayer) {
    breadcrumbCategory = "MY COURSES";
    breadcrumbTitle = "Lesson Player";
  } else if (isExplore) {
    breadcrumbCategory = "DISCOVER";
    breadcrumbTitle = "Explore";
  } else if (isAssignments) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Assignments";
  } else if (isAssessments) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Assessments";
  } else if (isCalendar) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Calendar";
  } else if (isMessages) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Messages";
  } else if (isCommunity) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Community";
  } else if (isHelp) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Help Center";
  } else if (isSettings) {
    breadcrumbCategory = "LEARNING SPACE";
    breadcrumbTitle = "Settings";
  }

  return (
    <div
      className="grid h-dvh min-h-0 w-full grid-cols-[var(--sidebar-width)_minmax(0,1fr)] overflow-hidden bg-(--color-bg)"
      data-app-shell
      aria-busy="true"
      aria-label="Loading student application"
    >
      {/* ── Left Sidebar Skeleton ── */}
      <aside
        className="student-sidebar flex h-full min-h-0 flex-col bg-(--color-surface) px-(--sidebar-gutter) pb-3.75"
        aria-label="Loading student navigation"
        data-sidebar
      >
        {/* Brand Area */}
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-brand flex shrink-0 items-center h-10 gap-3 px-3.75">
            <Skeleton width={32} height={32} borderRadius={9} />
            <Skeleton width={110} height={20} borderRadius={6} className="sidebar-brand-name" />
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="sidebar-primary-nav mt-4" aria-label="Loading learning navigation">
          <div className="px-3.75 mb-2 sidebar-section-label">
            <Skeleton width={52} height={10} borderRadius={3} />
          </div>
          <ul className="space-y-(--sidebar-nav-gap)">
            {[
              { label: "Home", active: isHome, width: 45 },
              { label: "My Courses", active: isMyCourses, width: 75 },
              { label: "Explore", active: isExplore, width: 55 },
              { label: "Calendar", active: isCalendar, width: 62 },
              { label: "Assignments", active: isAssignments, width: 85 },
              { label: "Messages", active: isMessages, width: 65 },
              { label: "Community", active: isCommunity, width: 78 },
            ].map((item) => (
              <li key={item.label}>
                <div
                  className={`sidebar-nav-item flex items-center gap-3 rounded-2.25 px-3.75 py-2.5 ${
                    item.active ? "bg-(--color-brand-soft)" : ""
                  }`}
                >
                  <Skeleton width={20} height={20} borderRadius={5} />
                  <Skeleton width={item.width} height={14} borderRadius={4} className="sidebar-nav-label" />
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-h-3 flex-1" aria-hidden="true" />

        {/* Secondary Navigation */}
        <nav className="sidebar-secondary-nav mb-4" aria-label="Loading account navigation">
          <div className="px-3.75 mb-2 sidebar-section-label">
            <Skeleton width={46} height={10} borderRadius={3} />
          </div>
          <ul className="space-y-(--sidebar-nav-gap)">
            {[
              { label: "Settings", active: isSettings, width: 58 },
              { label: "Help", active: isHelp, width: 40 },
            ].map((item) => (
              <li key={item.label}>
                <div
                  className={`sidebar-nav-item flex items-center gap-3 rounded-2.25 px-3.75 py-2.5 ${
                    item.active ? "bg-(--color-brand-soft)" : ""
                  }`}
                >
                  <Skeleton width={20} height={20} borderRadius={5} />
                  <Skeleton width={item.width} height={14} borderRadius={4} className="sidebar-nav-label" />
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile Card Skeleton */}
        <div className="relative">
          <div className="sidebar-profile flex w-full min-h-19.5 shrink-0 items-center gap-3 rounded-2.5 bg-(--color-brand-soft) px-3">
            <div className="sidebar-profile-avatar-wrap relative shrink-0">
              <Skeleton width={44} height={44} circle />
            </div>
            <div className="sidebar-profile-copy min-w-0 flex-1 space-y-1.5">
              <Skeleton width={88} height={14} borderRadius={4} />
              <Skeleton width={48} height={11} borderRadius={3} />
            </div>
            <Skeleton width={16} height={16} borderRadius={4} className="sidebar-profile-chevron" />
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main
        className="grid h-full min-h-0 min-w-0 place-items-center overflow-hidden bg-(--color-bg)"
        aria-label="Student workspace"
        data-main-workspace
      >
        <div
          className={`student-dashboard${isHome ? " student-dashboard--home" : ""}${
            isProfile ? " student-dashboard--profile" : ""
          }${isInstructorProfile ? " student-dashboard--instructor-profile" : ""}${
            isMyCourses ? " student-dashboard--my-courses" : ""
          }${isCourseOverview ? " student-dashboard--course-overview" : ""}${
            isAssignments ? " student-dashboard--assignments" : ""
          }${isCalendar ? " student-dashboard--calendar" : ""}${
            isMessages ? " student-dashboard--messages" : ""
          }${isCommunity ? " student-dashboard--community" : ""}${
            isHelp ? " student-dashboard--help" : ""
          }${isSettings ? " student-dashboard--settings" : ""}`}
        >
          {/* Header */}
          <header
            className={`student-dashboard__header${isHome ? " student-dashboard__header--home" : ""}`}
            aria-label="Loading dashboard header"
          >
            {/* Breadcrumb Skeleton */}
            <div className="student-dashboard__breadcrumb-area">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#087f55]">
                  {breadcrumbCategory}
                </span>
                <span className="text-[#8ca097]" aria-hidden="true">/</span>
                <span className="text-[18px] sm:text-[22px] font-bold text-slate-900 tracking-tight">
                  {breadcrumbTitle}
                </span>
              </div>
            </div>

            {/* Centered Search Bar on Home */}
            {isHome && (
              <div className="student-dashboard__search">
                <SearchBar
                  placeholder="Search courses, topics or skills..."
                  isLoading={true}
                />
              </div>
            )}

            {/* Header Right Actions */}
            <div className="student-dashboard__actions">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton width={36} height={36} circle />
                <Skeleton width={110} height={42} borderRadius={999} />
                <Skeleton width={44} height={44} circle />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="student-dashboard__content">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
