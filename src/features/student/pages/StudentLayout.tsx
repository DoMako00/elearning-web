import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { SearchBar } from "../../../components/ui/SearchBar";
import { UserHeaderActions } from "../../../components/ui/UserHeaderActions";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { MobileLayout } from "../../../components/mobile/MobileLayout";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useStudentProfile } from "../api/useStudentLearning";
import { useMarkStudentNotificationsRead, useStudentNotifications } from "../api/useStudentNotifications";
import { MessagesProvider } from "../../../app/providers/MessagesProvider";
import { PageBreadcrumb } from "../../../components/ui/PageBreadcrumb";

import { lazy, Suspense } from "react";

import { MobileMessagesProvider } from "../../../components/mobile/data/useMobileMessages";
import { RouteErrorBoundary } from "../../../components/layout/RouteErrorBoundary";
import { RouteLoadingFallback } from "../../../components/layout/RouteLoadingFallback";

const CourseOverviewScreen = lazy(() => import("../../../components/mobile/screens/CourseOverviewScreen").then((m) => ({ default: m.CourseOverviewScreen })));
const MobileLearningPathStubScreen = lazy(() => import("../../../components/mobile/screens/MobileLearningPathStubScreen").then((m) => ({ default: m.MobileLearningPathStubScreen })));

function StudentLayoutContent() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const profileQuery = useStudentProfile();
  const notificationsQuery = useStudentNotifications();
  const markNotificationsRead = useMarkStudentNotificationsRead();
  const notifications = useMemo(() => (notificationsQuery.data ?? []).map((item) => ({ ...item, isUnread: item.readAt === null })), [notificationsQuery.data]);
  const unreadNotificationsCount = notifications.reduce((count, item) => count + Number(item.isUnread), 0);
  const pathname = location.pathname;

  // Render Mobile Layout when viewport matches <= 767px
  if (isMobile) {
    const mobileCourseDetail = pathname.match(/^\/my-courses\/([^/]+)$/);
    if (mobileCourseDetail) {
      return (
        <RouteErrorBoundary isMobile>
          <Suspense fallback={<RouteLoadingFallback isMobile message="Loading course..." />}>
            <MobileMessagesProvider>
              <CourseOverviewScreen />
            </MobileMessagesProvider>
          </Suspense>
        </RouteErrorBoundary>
      );
    }
    if (pathname.startsWith("/explore/paths/") && pathname !== "/explore/paths") {
      return (
        <RouteErrorBoundary isMobile>
          <Suspense fallback={<RouteLoadingFallback isMobile message="Loading learning path..." />}>
            <MobileLearningPathStubScreen />
          </Suspense>
        </RouteErrorBoundary>
      );
    }
    const mobileTabRoots = new Set(["/", "/my-courses", "/explore", "/calendar", "/settings"]);
    return <MobileLayout routeContent={mobileTabRoots.has(pathname) ? undefined : <Outlet />} />;
  }

  // Prevent flash while measuring initial viewport on client mount
  if (isMobile === undefined) {
    return null;
  }

  const courseRouteMatch = pathname.match(/^\/my-courses\/([^/]+)(?:\/lessons\/([^/]+))?$/);
  const courseRouteState = location.state as { courseTitle?: unknown; courseId?: unknown } | null;
  const currentCourseTitle = typeof courseRouteState?.courseTitle === "string" && courseRouteState.courseTitle.trim() ? courseRouteState.courseTitle : "Subject overview";
  const currentCourseId = courseRouteMatch?.[1] ?? "";

  const isHome = pathname === "/" || pathname === "";
  const isProfile = pathname === "/profile";
  const isMyCourses = pathname === "/my-courses";
  const isCourseOverview = Boolean(courseRouteMatch && !courseRouteMatch[2]);
  const isLessonPlayer = Boolean(courseRouteMatch?.[2]);
  const isExplore = pathname === "/explore";
  const isAssignments = pathname === "/assignments";
  const isAssignmentDetail = pathname.startsWith("/assignments/");
  const isCalendar = pathname === "/calendar";
  const isMessages = pathname === "/messages";
  const isCommunity = pathname === "/community";
  const isHelp = pathname === "/help";
  const isSettings = pathname === "/settings";
  const isTestXP = pathname === "/test-xp";
  const isTestInactivity = pathname === "/test-inactivity";
  const isTestStreak = pathname === "/test-streak";
  const isInstructorProfile = pathname === "/instructor-profile" || pathname.startsWith("/instructors");

  // Search bar in the topbar is shown for Home
  const showCenteredSearch = isHome;

  const renderBreadcrumb = () => {
    if (isSettings) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Settings" />;
    }

    if (isHelp) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Help Center" />;
    }

    if (isInstructorProfile) {
      return <PageBreadcrumb trail={[{ label: "PROFILE", to: "/" }]} title="Instructor Profile" />;
    }

    if (isProfile) {
      return <PageBreadcrumb trail={[{ label: "STUDENT ACCOUNT", to: "/" }]} title="My Profile" />;
    }

    if (isCommunity) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Community" />;
    }

    if (isCourseOverview) {
      return <PageBreadcrumb trail={[{ label: "MY COURSES", to: "/my-courses" }]} title={currentCourseTitle} />;
    }

    if (isLessonPlayer) {
      return (
        <PageBreadcrumb
          trail={[
            { label: "MY COURSES", to: "/my-courses" },
            { label: currentCourseTitle.toUpperCase(), to: `/my-courses/${currentCourseId}` },
          ]}
          title="Lesson Player"
        />
      );
    }

    if (isAssignmentDetail) {
      return (
        <PageBreadcrumb
          trail={[
            { label: "LEARNING SPACE", to: "/" },
            { label: "ASSIGNMENTS", to: "/assignments" },
          ]}
          title="Assignment details"
        />
      );
    }

    if (isMyCourses) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="My Courses" />;
    }

    if (isExplore) {
      return <PageBreadcrumb trail={[{ label: "DISCOVER", to: "/" }]} title="Explore" />;
    }

    if (isAssignments) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Assignments" />;
    }

    if (isCalendar) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Calendar" />;
    }

    if (isMessages) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Messages" />;
    }

    if (isTestInactivity) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Inactivity Prompt Test" />;
    }

    if (isTestXP) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="XP Reward Test" />;
    }

    if (isTestStreak) {
      return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Streak Analytics Test" />;
    }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "Dashboard";
    const title = lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title={title} />;
  };

  const isScrollablePage = isTestXP || isTestStreak || isTestInactivity;

  return (
    <AppShell>
      <div
        className={`student-dashboard${isHome ? " student-dashboard--home" : ""}${
          isProfile ? " student-dashboard--profile" : ""
        }${isInstructorProfile ? " student-dashboard--instructor-profile" : ""}${
          isMyCourses ? " student-dashboard--my-courses" : ""
        }${isCourseOverview ? " student-dashboard--course-overview" : ""}${
          isAssignments ? " student-dashboard--assignments" : ""
        }${isAssignmentDetail ? " student-dashboard--assignment-detail" : ""}${
          isCalendar ? " student-dashboard--calendar" : ""
        }${isMessages ? " student-dashboard--messages" : ""}${
          isCommunity ? " student-dashboard--community" : ""
        }${isHelp ? " student-dashboard--help" : ""}${
          isSettings ? " student-dashboard--settings" : ""
        }${
          isScrollablePage ? " student-dashboard--scrollable" : ""}`}
      >
        <header
          className={`student-dashboard__header${showCenteredSearch ? " student-dashboard__header--home" : ""}`}
          aria-label="Student dashboard header"
        >
          <div className="student-dashboard__breadcrumb-area">
            {renderBreadcrumb()}
          </div>
          {showCenteredSearch && (
            <div className="student-dashboard__search">
              <SearchBar
                placeholder="Search courses, topics or skills..."
                isLoading={auth.status === "loading"}
              />
            </div>
          )}
          <div className="student-dashboard__actions">
            {auth.status === "authenticated" ? (
              <UserHeaderActions
                avatarAlt="Student account"
                userName={profileQuery.data?.fullName ?? "Student"}
                userRole="Student"
                hasNotification={unreadNotificationsCount > 0}
                unreadNotificationsCount={unreadNotificationsCount}
                notifications={notifications}
                notificationsLoading={notificationsQuery.isLoading}
                notificationsError={notificationsQuery.error instanceof Error ? "Notifications could not be loaded." : null}
                onReadNotification={(id) => markNotificationsRead.mutate(id)}
                onMarkAllRead={() => markNotificationsRead.mutate(null)}
                onViewProfile={() => navigate("/profile")}
                onMenuItemClick={(itemKey) => {
                  if (itemKey === "profile") navigate("/profile");
                  else if (itemKey === "settings") navigate("/settings");
                  else if (itemKey === "notifications") navigate("/notifications");
                  else if (itemKey === "help") navigate("/help");
                  else if (itemKey === "certificates") navigate("/profile?tab=achievements");
                }}
                onLogOut={() => {
                  void auth.signOut({ revokeServerSession: true });
                }}
              />
            ) : (
              <button
                type="button"
                className="student-dashboard__signin-button"
                onClick={() => navigate("/auth/sign-in", { state: { from: "/" } })}
              >
                Sign in
              </button>
            )}
          </div>
        </header>
        <div className="student-dashboard__content">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}

export function StudentLayout() {
  return <MessagesProvider><StudentLayoutContent /></MessagesProvider>;
}
