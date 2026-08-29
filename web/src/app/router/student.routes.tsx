import type { RouteObject } from "react-router-dom";
import { AssignmentsPage } from "../pages/student/AssignmentsPage";
import { CourseOverviewPage } from "../pages/student/CourseOverviewPage";
import { ExplorePage } from "../pages/student/ExplorePage";
import { HomePage } from "../pages/student/HomePage";
import { LessonPlayerPage } from "../pages/student/LessonPlayerPage";
import { MyCoursesPage } from "../pages/student/MyCoursesPage";
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
      { path: "assignments", element: <AssignmentsPage /> },
      // { path: "test-xp", element: <TestXPRewardsPage /> },
    ],
  },
];
