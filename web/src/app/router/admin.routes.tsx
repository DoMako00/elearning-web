import type { RouteObject } from "react-router-dom";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminPagePlaceholder } from "../pages/admin/AdminPagePlaceholder";

const sections = [
  ["students", "Students", "Read-only student identity, access, and risk summaries."],
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
    ...sections.map(([path, title, description]) => ({ path, element: <AdminPagePlaceholder title={title} description={description} /> })),
  ],
}];