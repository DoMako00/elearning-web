import type { RouteObject } from "react-router-dom";
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
      { path: "explore", element: <ExplorePage /> },
    ],
  },
];
