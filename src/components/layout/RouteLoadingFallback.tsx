import React from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  HomeDashboardSkeleton,
  MyCoursesSkeleton,
  ExploreSkeleton,
  CalendarSkeleton,
  AssignmentsSkeleton,
  MessagesSkeleton,
  CommunitySkeleton,
  SettingsSkeleton,
  HelpCenterSkeleton,
  ProfileSkeleton,
  CourseOverviewSkeleton,
  LessonPlayerSkeleton,
  SkeletonListRow,
  AdminTableSkeleton,
  InstructorCourseContentSkeleton,
  CourseBuilderSkeleton,
  AssignmentDetailSkeleton,
  AssessmentDetailSkeleton,
} from "../ui/Skeleton";
import { StudentShellSkeleton } from "./StudentShellSkeleton";
import { AdminShellSkeleton } from "./AdminShellSkeleton";
import { RolesSkeleton } from "../../features/admin-v2/roles/RolesSkeleton";
import { InstructorsSkeleton } from "../../features/admin-v2/instructors/InstructorsSkeleton";
import { CoursesSkeleton } from "../../features/admin-v2/courses/CoursesSkeleton";
import { CurriculumSkeleton } from "../../features/admin-v2/curriculum/CurriculumSkeleton";
import { OverviewSkeleton } from "../../features/admin-v2/overview/OverviewSkeleton";
import { InstructorHomeSkeleton } from "../../features/admin-v2/instructor/InstructorHomeSkeleton";
import { InstructorCoursesSkeleton } from "../../features/admin-v2/instructor/InstructorCoursesSkeleton";
import { InstructorAssessmentsSkeleton, InstructorStudentsSkeleton, InstructorSubscriptionsSkeleton } from "../../features/admin-v2/instructor/InstructorOperationsSkeleton";
import { InstructorAssignmentSkeleton } from "../../features/admin-v2/assignments/InstructorAssignmentSkeleton";

export interface RouteLoadingFallbackProps {
  message?: string;
  isMobile?: boolean;
  withShell?: boolean;
}

export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  message = "Loading...",
  isMobile = false,
  withShell = false,
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  if (isMobile) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex-1 w-full flex flex-col items-center justify-center p-6 min-h-[40vh] text-slate-500"
      >
        <Loader2 className="size-6 text-emerald-600 animate-spin mb-2" />
        <span className="text-xs font-medium">{message}</span>
      </div>
    );
  }

  const renderContent = () => {
    // ══════════════════════════════════════════════════════
    // A. INSTRUCTOR ROUTES (/admin/instructor/...)
    // ══════════════════════════════════════════════════════
    if (pathname === "/admin/instructor" || pathname.startsWith("/admin/instructor/")) {
      // 1. Instructor Course Content (chapters & lessons)
      if (/^\/admin\/instructor\/courses\/[^/]+$/.test(pathname)) {
        return <InstructorCourseContentSkeleton />;
      }

      // 2. Instructor Courses List
      if (pathname === "/admin/instructor/courses") {
        return <InstructorCoursesSkeleton />;
      }

      // 3. Instructor Assignments / Grading
      if (pathname.startsWith("/admin/instructor/assignments")) {
        return <InstructorAssignmentSkeleton />;
      }

      // 4. Instructor Exams / Quizzes
      if (pathname.startsWith("/admin/instructor/assessments")) {
        return <InstructorAssessmentsSkeleton />;
      }

      // 4b. Instructor Students and Subscriptions
      if (pathname.startsWith("/admin/instructor/students")) {
        return <InstructorStudentsSkeleton />;
      }
      if (pathname.startsWith("/admin/instructor/subscriptions")) {
        return <InstructorSubscriptionsSkeleton />;
      }

      // 5. Instructor Dashboard / Overview
      return <InstructorHomeSkeleton />;
    }

    // ══════════════════════════════════════════════════════
    // B. SUPER ADMIN ROUTES (/admin/...)
    // ══════════════════════════════════════════════════════
    if (pathname.startsWith("/admin")) {
      // 1. Course Builder
      if (/^\/admin\/courses\/[^/]+\/builder$/.test(pathname)) {
        return <CourseBuilderSkeleton />;
      }

      // 2. Super Admin Overview
      if (pathname === "/admin" || pathname === "/admin/overview") {
        return <OverviewSkeleton />;
      }

      // 2b. Curriculum
      if (pathname === "/admin/curriculum") {
        return <CurriculumSkeleton />;
      }

      // 2c. Course setup
      if (pathname === "/admin/courses") {
        return <CoursesSkeleton />;
      }

      // 2d. Instructors
      if (pathname === "/admin/instructors") {
        return <InstructorsSkeleton />;
      }

      // 2e. Roles & Permissions
      if (pathname === "/admin/roles") {
        return <RolesSkeleton />;
      }

      // 3. Admin Data Tables (Courses, Instructors, Students, Content Approvals, Payments, Curriculum, Subscriptions, Roles, Security, Support)
      return <AdminTableSkeleton columns={6} rows={7} />;
    }

    // ══════════════════════════════════════════════════════
    // C. STUDENT ROUTES
    // ══════════════════════════════════════════════════════
    // 1. Home Dashboard
    if (pathname === "/" || pathname === "") {
      return <HomeDashboardSkeleton />;
    }

    // 2. Profile Page (handles tabs via query param or default)
    if (pathname.startsWith("/profile")) {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get("tab") as "overview" | "achievements" | "saved" | "activity" | "settings" | null;
      const activeTab = tabParam && ["overview", "achievements", "saved", "activity", "settings"].includes(tabParam)
        ? tabParam
        : "overview";
      return <ProfileSkeleton activeTab={activeTab} />;
    }

    // 2B. Instructor Public Profile (from Student perspective)
    if (pathname.startsWith("/instructor") || pathname.startsWith("/instructors")) {
      return <ProfileSkeleton activeTab="overview" />;
    }

    // 3. Lesson Player (Continue Lesson / Lesson link)
    if (pathname.includes("/lessons/")) {
      return <LessonPlayerSkeleton />;
    }

    // 4. Course Overview (Open Subject: /my-courses/:slug)
    if (pathname.startsWith("/my-courses/") && pathname !== "/my-courses") {
      return <CourseOverviewSkeleton />;
    }

    // 5. My Courses (main list)
    if (pathname === "/my-courses") {
      return <MyCoursesSkeleton />;
    }

    // 6. Explore
    if (pathname.startsWith("/explore")) {
      return <ExploreSkeleton />;
    }

    // 7. Calendar
    if (pathname.startsWith("/calendar")) {
      return <CalendarSkeleton />;
    }

    // 8. Assignments
    if (/^\/assignments\/[^/]+$/.test(pathname)) {
      return <AssignmentDetailSkeleton />;
    }
    if (pathname.startsWith("/assignments")) {
      return <AssignmentsSkeleton />;
    }

    // 9. Assessments
    if (/^\/assessments\/[^/]+$/.test(pathname)) {
      return <AssessmentDetailSkeleton />;
    }
    if (pathname.startsWith("/assessments")) {
      return <AssignmentsSkeleton />;
    }

    // 10. Messages
    if (pathname.startsWith("/messages")) {
      return <MessagesSkeleton />;
    }

    // 11. Community
    if (pathname.startsWith("/community")) {
      return <CommunitySkeleton />;
    }

    // 12. Help Center
    if (pathname.startsWith("/help")) {
      return <HelpCenterSkeleton />;
    }

    // 13. Settings
    if (pathname.startsWith("/settings")) {
      return <SettingsSkeleton />;
    }

    // 14. Notifications
    if (pathname.startsWith("/notifications")) {
      return (
        <section className="student-page p-6 max-w-4xl mx-auto space-y-4" aria-busy="true" aria-label="Loading notifications">
          <SkeletonListRow />
          <SkeletonListRow />
          <SkeletonListRow />
          <SkeletonListRow />
        </section>
      );
    }

    // Fallback for sub-routes or unknown pages
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full flex flex-col items-center justify-center py-20 text-slate-500 min-h-[40vh]"
      >
        <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    );
  };

  const content = renderContent();

  if (withShell) {
    if (pathname.startsWith("/admin")) {
      return <AdminShellSkeleton pathname={pathname}>{content}</AdminShellSkeleton>;
    }
    return <StudentShellSkeleton pathname={pathname}>{content}</StudentShellSkeleton>;
  }

  return content;
};
