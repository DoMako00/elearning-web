import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { RouteErrorBoundary } from "../../components/layout/RouteErrorBoundary";
import { RouteLoadingFallback } from "../../components/layout/RouteLoadingFallback";

const AdminOverviewPage = lazy(() => import("../pages/admin/AdminOverviewPage").then((m) => ({ default: m.AdminOverviewPage })));
const AdminPagePlaceholder = lazy(() => import("../pages/admin/AdminPagePlaceholder").then((m) => ({ default: m.AdminPagePlaceholder })));
const AdminInstructorsPage = lazy(() => import("../pages/admin/AdminInstructorsPage").then((m) => ({ default: m.AdminInstructorsPage })));
const AdminCoursesPage = lazy(() => import("../pages/admin/AdminCoursesPage").then((m) => ({ default: m.AdminCoursesPage })));
const AdminCurriculumPage = lazy(() => import("../pages/admin/AdminCurriculumPage").then((m) => ({ default: m.AdminCurriculumPage })));
const AdminCourseBuilderPage = lazy(() => import("../pages/admin/AdminCourseBuilderPage").then((m) => ({ default: m.AdminCourseBuilderPage })));
const AdminStudentsPage = lazy(() => import("../pages/admin/AdminStudentsPage").then((m) => ({ default: m.AdminStudentsPage })));
const AdminPaymentsPage = lazy(() => import("../pages/admin/AdminOperationsPages").then((m) => ({ default: m.AdminPaymentsPage })));
const AdminSubscriptionsPage = lazy(() => import("../pages/admin/AdminOperationsPages").then((m) => ({ default: m.AdminSubscriptionsPage })));
const AdminContentPage = lazy(() => import("../pages/admin/AdminOperationsPages").then((m) => ({ default: m.AdminContentPage })));
const AdminSecurityPage = lazy(() => import("../pages/admin/AdminOperationsPages").then((m) => ({ default: m.AdminSecurityPage })));

function withAdminSuspense(Component: React.ComponentType<any>, props?: any) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </RouteErrorBoundary>
  );
}

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
    { path: "payments", element: withAdminSuspense(AdminPaymentsPage) },
    { path: "subscriptions", element: withAdminSuspense(AdminSubscriptionsPage) },
    { path: "content", element: withAdminSuspense(AdminContentPage) },
    { path: "security", element: withAdminSuspense(AdminSecurityPage) },
    { index: true, element: withAdminSuspense(AdminOverviewPage) },
    { path: "courses", element: withAdminSuspense(AdminCoursesPage) },
    { path: "courses/:courseId/builder", element: withAdminSuspense(AdminCourseBuilderPage) },
    { path: "instructors", element: withAdminSuspense(AdminInstructorsPage) },
    { path: "curriculum", element: withAdminSuspense(AdminCurriculumPage) },
    { path: "students", element: withAdminSuspense(AdminStudentsPage) },
    ...sections.map(([path, title, description]) => ({
      path,
      element: withAdminSuspense(AdminPagePlaceholder, { title, description }),
    })),
  ],
}];
