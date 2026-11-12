import { createBrowserRouter } from "react-router-dom";
import { adminRoutes } from "./admin.routes";
import { publicRoutes } from "./public.routes";
import { studentRoutes } from "./student.routes";
import { NotFoundPage } from "../pages/student/NotFoundPage";
import { RouteSeo } from "../seo/RouteSeo";

export const router = createBrowserRouter([
  {
    // Pathless root route: sets the title, robots rule and share tags for whichever page is shown.
    element: <RouteSeo />,
    children: [
      ...publicRoutes,
      ...studentRoutes,
      ...adminRoutes,
      // Wildcard — catches any path not matched above.
      // Branches on useIsMobile inside NotFoundPage (same pattern as StudentLayout).
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
