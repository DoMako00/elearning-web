import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./admin.routes";
import { publicRoutes } from "./public.routes";
import { studentRoutes } from "./student.routes";
import { NotFoundPage } from "../pages/student/NotFoundPage";

export const router = createBrowserRouter([
  ...publicRoutes,
  ...studentRoutes,
  ...adminRoutes,
  // Wildcard — catches any path not matched above.
  // Branches on useIsMobile inside NotFoundPage (same pattern as StudentLayout).
  { path: "*", element: <NotFoundPage /> },
]);
