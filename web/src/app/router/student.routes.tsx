import type { RouteObject } from "react-router-dom";
import { AssignmentsPage } from "../pages/student/AssignmentsPage";
import { AssignmentDetailPage } from "../../components/ui/Assignments/AssignmentDetailPage";
import { CalendarPage } from "../pages/student/CalendarPage";
import { CourseOverviewPage } from "../pages/student/CourseOverviewPage";
import { ExplorePage } from "../pages/student/ExplorePage";
import { HomePage } from "../pages/student/HomePage";
import { LessonPlayerPage } from "../pages/student/LessonPlayerPage";
import { MessagesPage } from "../pages/student/MessagesPage";
import { MyCoursesPage } from "../pages/student/MyCoursesPage";
import { CommunityPage } from "../pages/student/CommunityPage";
import { InstructorProfilePage } from "../pages/student/InstructorProfilePage";
import { ProfilePage } from "../pages/student/ProfilePage";
import { StudentLayout } from "../pages/student/StudentLayout";
import "./student-dashboard.css";

import { HelpCenterPage } from "../pages/student/HelpCenterPage";
import { SettingsPage } from "../pages/student/SettingsPage";

// Dev-only test pages — tree-shaken from production builds
let devRoutes: RouteObject[] = [];
if (import.meta.env.DEV) {
  const { TestInactivityPromptPage } = await import("../pages/student/test-inactivity/TestInactivityPromptPage");
  const { TestStreakPage } = await import("../pages/student/test-streak/TestStreakPage");
  const { TestXPRewardsPage } = await import("../pages/student/test-xp/TestXPRewardsPage");
  devRoutes = [
    { path: "test-inactivity", element: <TestInactivityPromptPage /> },
    { path: "test-streak", element: <TestStreakPage /> },
    { path: "test-xp", element: <TestXPRewardsPage /> },
  ];
}

export const studentRoutes: RouteObject[] = [
  {
    path: "/",
    element: <StudentLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "instructor-profile", element: <InstructorProfilePage /> },
      { path: "instructors", element: <InstructorProfilePage /> },
      { path: "instructors/:instructorId", element: <InstructorProfilePage /> },
      { path: "my-courses", element: <MyCoursesPage /> },
      { path: "my-courses/:slug", element: <CourseOverviewPage /> },
      { path: "my-courses/:slug/lessons/:lessonId", element: <LessonPlayerPage /> },
      { path: "my-courses/human-anatomy-i", element: <CourseOverviewPage /> },
      { path: "my-courses/human-anatomy-i/lessons/:lessonId", element: <LessonPlayerPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "explore/paths/:slug", element: <ExplorePage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "assignments", element: <AssignmentsPage /> },
      { path: "assignments/:assignmentId", element: <AssignmentDetailPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "community", element: <CommunityPage /> },
      { path: "help", element: <HelpCenterPage /> },
      { path: "settings", element: <SettingsPage /> },
      ...devRoutes,
    ],
  },
];
