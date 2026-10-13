import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { StudentLayout } from "../../features/student/pages/StudentLayout";
import { RouteErrorBoundary } from "../../components/layout/RouteErrorBoundary";
import { RouteLoadingFallback } from "../../components/layout/RouteLoadingFallback";
import "./student-dashboard.css";

// Lazy-loaded student pages — all sourced from the canonical feature location
const HomePage = lazy(() => import("../../features/student/pages/HomePage").then((m) => ({ default: m.HomePage })));
const ProfilePage = lazy(() => import("../../features/student/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const InstructorProfilePage = lazy(() => import("../../features/student/pages/InstructorProfilePage").then((m) => ({ default: m.InstructorProfilePage })));
const MyCoursesPage = lazy(() => import("../../features/student/pages/MyCoursesPage").then((m) => ({ default: m.MyCoursesPage })));
const CourseOverviewPage = lazy(() => import("../../features/student/pages/CourseOverviewPage").then((m) => ({ default: m.CourseOverviewPage })));
const LessonPlayerPage = lazy(() => import("../../features/student/pages/LessonPlayerPage").then((m) => ({ default: m.LessonPlayerPage })));
const ExplorePage = lazy(() => import("../../features/student/pages/ExplorePage").then((m) => ({ default: m.ExplorePage })));
const CalendarPage = lazy(() => import("../../features/student/pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const AssignmentsPage = lazy(() => import("../../features/student/pages/AssignmentsPage").then((m) => ({ default: m.AssignmentsPage })));
const AssignmentDetailPage = lazy(() => import("../../components/ui/Assignments/AssignmentDetailPage").then((m) => ({ default: m.AssignmentDetailPage })));
const MessagesPage = lazy(() => import("../../features/student/pages/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const CommunityPage = lazy(() => import("../../features/student/pages/CommunityPage").then((m) => ({ default: m.CommunityPage })));
const HelpCenterPage = lazy(() => import("../../features/student/pages/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })));
const SettingsPage = lazy(() => import("../../features/student/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function withSuspense(Component: React.ComponentType) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

// Dev-only test pages — tree-shaken from production builds
let devRoutes: RouteObject[] = [];
if (import.meta.env.DEV) {
  const { TestInactivityPromptPage } = await import("../../features/student/pages/test-inactivity/TestInactivityPromptPage");
  const { TestStreakPage } = await import("../../features/student/pages/test-streak/TestStreakPage");
  const { TestXPRewardsPage } = await import("../../features/student/pages/test-xp/TestXPRewardsPage");
  const { TestSkeletonPage } = await import("../../features/student/pages/test-skeleton/TestSkeletonPage");
  devRoutes = [
    { path: "test-inactivity", element: <TestInactivityPromptPage /> },
    { path: "test-streak", element: <TestStreakPage /> },
    { path: "test-xp", element: <TestXPRewardsPage /> },
    { path: "test-skeleton", element: <TestSkeletonPage /> },
  ];
}

export const studentRoutes: RouteObject[] = [
  {
    path: "/",
    element: <StudentLayout />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: "profile", element: withSuspense(ProfilePage) },
      { path: "instructor-profile", element: withSuspense(InstructorProfilePage) },
      { path: "instructors", element: withSuspense(InstructorProfilePage) },
      { path: "instructors/:instructorId", element: withSuspense(InstructorProfilePage) },
      { path: "my-courses", element: withSuspense(MyCoursesPage) },
      { path: "my-courses/:slug", element: withSuspense(CourseOverviewPage) },
      { path: "my-courses/:slug/lessons/:lessonId", element: withSuspense(LessonPlayerPage) },
      { path: "my-courses/human-anatomy-i", element: withSuspense(CourseOverviewPage) },
      { path: "my-courses/human-anatomy-i/lessons/:lessonId", element: withSuspense(LessonPlayerPage) },
      { path: "explore", element: withSuspense(ExplorePage) },
      { path: "explore/paths/:slug", element: withSuspense(ExplorePage) },
      { path: "calendar", element: withSuspense(CalendarPage) },
      { path: "assignments", element: withSuspense(AssignmentsPage) },
      { path: "assignments/:assignmentId", element: withSuspense(AssignmentDetailPage) },
      { path: "messages", element: withSuspense(MessagesPage) },
      { path: "community", element: withSuspense(CommunityPage) },
      { path: "help", element: withSuspense(HelpCenterPage) },
      { path: "settings", element: withSuspense(SettingsPage) },
      ...devRoutes,
    ],
  },
];
