import type { RouteObject } from "react-router-dom";
import { CourseOverviewPage } from "../pages/student/CourseOverviewPage";
import { ExplorePage } from "../pages/student/ExplorePage";
import { HomePage } from "../pages/student/HomePage";
import { MyCoursesPage } from "../pages/student/MyCoursesPage";
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
      { path: "explore", element: <ExplorePage /> },
    ],
  },
];
