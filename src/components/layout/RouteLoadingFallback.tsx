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
} from "../ui/Skeleton";

export interface RouteLoadingFallbackProps {
  message?: string;
  isMobile?: boolean;
}

export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  message = "Loading...",
  isMobile = false,
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

  // 3. My Courses
  if (pathname === "/my-courses") {
    return <MyCoursesSkeleton />;
  }

  // 4. Explore
  if (pathname.startsWith("/explore")) {
    return <ExploreSkeleton />;
  }

  // 5. Calendar
  if (pathname.startsWith("/calendar")) {
    return <CalendarSkeleton />;
  }

  // 6. Assignments
  if (pathname.startsWith("/assignments")) {
    return <AssignmentsSkeleton />;
  }

  // 7. Messages
  if (pathname.startsWith("/messages")) {
    return <MessagesSkeleton />;
  }

  // 8. Community
  if (pathname.startsWith("/community")) {
    return <CommunitySkeleton />;
  }

  // 9. Help Center
  if (pathname.startsWith("/help")) {
    return <HelpCenterSkeleton />;
  }

  // 10. Settings
  if (pathname.startsWith("/settings")) {
    return <SettingsSkeleton />;
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
