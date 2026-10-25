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
} from "../ui/Skeleton";
import { StudentShellSkeleton } from "./StudentShellSkeleton";

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

    // 2B. Instructor Profile
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
    if (pathname.startsWith("/assignments")) {
      return <AssignmentsSkeleton />;
    }

    // 9. Assessments
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
    return <StudentShellSkeleton pathname={pathname}>{content}</StudentShellSkeleton>;
  }

  return content;
};
