import type { RouteObject } from "react-router-dom";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminPagePlaceholder } from "../pages/admin/AdminPagePlaceholder";
import { AdminInstructorsPage } from "../pages/admin/AdminInstructorsPage";
import { AdminCoursesPage } from "../pages/admin/AdminCoursesPage";
import { AdminCurriculumPage } from "../pages/admin/AdminCurriculumPage";
import { AdminCourseBuilderPage } from "../pages/admin/AdminCourseBuilderPage";
import { AdminStudentsPage } from "../pages/admin/AdminStudentsPage";

import { AdminPaymentsPage, AdminSubscriptionsPage, AdminContentPage, AdminSecurityPage } from "../pages/admin/AdminOperationsPages";

const sections = [
  ["commercial", "Commercial", "Payment, refund, and order review read models."],
  ["access", "Access Grants", "Explicit grant, source, scope, and entitlement summaries."],
  ["media", "Media", "Protected asset, playback, and access-decision summaries."],
  ["assessments", "Assessments", "Assessment, question-bank, and attempt summaries."],
  ["audit", "Audit", "Append-only audit and administrative action history."],
  ["roles", "Roles & Permissions", "Platform-scoped role and permission summaries."],
] as const;

export const adminRoutes: RouteObject[] = [{
  path: "/admin",
  element: <AdminLayout />,
  children: [
    { path: "payments", element: <AdminPaymentsPage /> },
    { path: "subscriptions", element: <AdminSubscriptionsPage /> },
    { path: "content", element: <AdminContentPage /> },
    { path: "security", element: <AdminSecurityPage /> },
    { index: true, element: <AdminOverviewPage /> },
    { path: "courses", element: <AdminCoursesPage /> },
    { path: "courses/:courseId/builder", element: <AdminCourseBuilderPage /> },
    { path: "instructors", element: <AdminInstructorsPage /> },
    { path: "curriculum", element: <AdminCurriculumPage /> },
    { path: "students", element: <AdminStudentsPage /> },
    ...sections.map(([path, title, description]) => ({ path, element: <AdminPagePlaceholder title={title} description={description} /> })),
  ],
}];
