import { lazy, Suspense, type ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { RouteErrorBoundary } from "../../components/layout/RouteErrorBoundary";
import { RouteLoadingFallback } from "../../components/layout/RouteLoadingFallback";
import { AdminV2Layout } from "../../features/admin-v2/layout/AdminV2Layout";

const AdminPagePlaceholder = lazy(() => import("../pages/admin/AdminPagePlaceholder").then((m) => ({ default: m.AdminPagePlaceholder })));
const AdminV2InstructorsPage = lazy(() => import("../../features/admin-v2/instructors/InstructorsPage").then((m) => ({ default: m.InstructorsPage })));
const AdminV2OverviewPage = lazy(() => import("../../features/admin-v2/overview/OverviewPage").then((m) => ({ default: m.OverviewPage })));
const AdminV2SecurityPage = lazy(() => import("../../features/admin-v2/security/SecurityPage").then((m) => ({ default: m.SecurityPage })));
const AdminV2PaymentsPage = lazy(() => import("../../features/admin-v2/payments/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const LocalStudentPreviewPage = lazy(() => import("../../features/admin-v2/students/LocalStudentPreviewPage").then((m) => ({ default: m.LocalStudentPreviewPage })));

function withAdminSuspense<P extends object>(Component: ComponentType<P>, props: P) {
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
  element: <AdminV2Layout />,
  children: [
    { index: true, element: withAdminSuspense(AdminV2OverviewPage, {}) },
    { path: "security", element: withAdminSuspense(AdminV2SecurityPage, {}) },
    { path: "instructors", element: withAdminSuspense(AdminV2InstructorsPage, {}) },
    ...sections.map(([path, title, description]) => ({
      path,
      element: withAdminSuspense(AdminPagePlaceholder, { title, description }),
    })),
  ],
},
{
  path: "/admin/overview",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(AdminV2OverviewPage, {}) }],
},
{
  path: "/admin/curriculum",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(lazy(() => import("../../features/admin-v2/curriculum/CurriculumPage").then((m) => ({ default: m.CurriculumPage }))), {}) }],
},
{
  path: "/admin/courses",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(lazy(() => import("../../features/admin-v2/courses/CoursesPage").then((m) => ({ default: m.CoursesPage }))), {}) }],
},
{
  path: "/admin/courses/:courseId/builder",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(lazy(() => import("../../features/admin-v2/builder/CourseBuilderPage").then((m) => ({ default: m.CourseBuilderPage }))), {}) }],
},
{
  path: "/admin/subscriptions",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(lazy(() => import("../../features/admin-v2/subscriptions/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage }))), {}) }],
},
{
  path: "/admin/students",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(lazy(() => import("../../features/admin-v2/students/StudentsPage").then((m) => ({ default: m.StudentsPage }))), {}) }],
},
{
  path: "/admin/content",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(lazy(() => import("../../features/admin-v2/content/ContentPage").then((m) => ({ default: m.ContentPage }))), {}) }],
},
{
  path: "/admin/payments",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(AdminV2PaymentsPage, {}) }],
},
{
  path: "/student-preview",
  element: withAdminSuspense(LocalStudentPreviewPage, {}),
}];
