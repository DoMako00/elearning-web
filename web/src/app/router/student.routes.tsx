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
// import { TestInactivityPromptPage } from "../pages/student/test-inactivity/TestInactivityPromptPage";
// import { TestStreakPage } from "../pages/student/test-streak/TestStreakPage";
// import { TestXPRewardsPage } from "../pages/student/test-xp/TestXPRewardsPage";
import { StudentLayout } from "../pages/student/StudentLayout";
import "./student-dashboard.css";

export const studentRoutes: RouteObject[] = [
  {
    path: "/",
    element: <StudentLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "my-courses", element: <MyCoursesPage /> },
      { path: "my-courses/human-anatomy-i", element: <CourseOverviewPage /> },
      { path: "my-courses/human-anatomy-i/lessons/:lessonId", element: <LessonPlayerPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "assignments", element: <AssignmentsPage /> },
      { path: "assignments/:assignmentId", element: <AssignmentDetailPage /> },
      { path: "messages", element: <MessagesPage /> },
      // { path: "test-inactivity", element: <TestInactivityPromptPage /> },
      // { path: "test-streak", element: <TestStreakPage /> },
      // { path: "test-xp", element: <TestXPRewardsPage /> },
      
    ],
  },
];
