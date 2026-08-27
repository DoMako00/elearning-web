import type { RouteObject } from "react-router-dom";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminPagePlaceholder } from "../pages/admin/AdminPagePlaceholder";
import { AdminInstructorsPage } from "../pages/admin/AdminInstructorsPage";

const sections = [
  ["curriculum", "Curriculum", "BUC academic levels, semesters, and modules."],
  ["courses", "Courses", "Brand-scoped teaching courses and their delivery state."],
  ["students", "Students", "Read-only student identity, access, and risk summaries."],
  ["payments", "Payments", "Payment, order, and review status for the active brand."],
  ["commercial", "Commercial", "Payment, refund, and order review read models."],
  ["subscriptions", "Subscriptions", "Subscription lifecycle, seats, and terms summaries."],
  ["access", "Access Grants", "Explicit grant, source, scope, and entitlement summaries."],
  ["content", "Content", "Learning hierarchy, lesson, and release-rule read models."],
  ["media", "Media", "Protected asset, playback, and access-decision summaries."],
  ["assessments", "Assessments", "Assessment, question-bank, and attempt summaries."],
  ["security", "Security", "Security event and account-risk read models."],
  ["audit", "Audit", "Append-only audit and administrative action history."],
  ["roles", "Roles & Permissions", "Platform-scoped role and permission summaries."],
] as const;

export const adminRoutes: RouteObject[] = [{
  path: "/admin",
  element: <AdminLayout />,
  children: [
    { index: true, element: <AdminOverviewPage /> },
    { path: "instructors", element: <AdminInstructorsPage /> },
    ...sections.map(([path, title, description]) => ({ path, element: <AdminPagePlaceholder title={title} description={description} /> })),
  ],
}];
