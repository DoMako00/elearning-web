import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { RouteErrorBoundary } from "../../components/layout/RouteErrorBoundary";
import { RouteLoadingFallback } from "../../components/layout/RouteLoadingFallback";
import { AdminV2Layout } from "../../features/admin-v2/layout/AdminV2Layout";

const AdminV2InstructorsPage = lazy(() => import("../../features/admin-v2/instructors/InstructorsPage").then((m) => ({ default: m.InstructorsPage })));
const AdminV2OverviewPage = lazy(() => import("../../features/admin-v2/overview/OverviewPage").then((m) => ({ default: m.OverviewPage })));
const AdminV2SecurityPage = lazy(() => import("../../features/admin-v2/security/SecurityPage").then((m) => ({ default: m.SecurityPage })));
const AdminV2PaymentsPage = lazy(() => import("../../features/admin-v2/payments/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const AdminSupportInboxPage = lazy(() => import("../../features/admin-v2/SupportInboxPage").then((m) => ({ default: m.SupportInboxPage })));
const AdminAssessmentsPage = lazy(() => import("../../features/admin-v2/assessments/AssessmentsPage").then((m) => ({ default: m.AssessmentsPage })));
const AdminRolesPage = lazy(() => import("../../features/admin-v2/roles/RolesPage").then((m) => ({ default: m.RolesPage })));
const AdminAssignmentReviewPage = lazy(() => import("../../features/admin-v2/assignments/AssignmentReviewPage").then((m) => ({ default: m.AssignmentReviewPage })));
const InstructorCoursesPage = lazy(() => import("../../features/admin-v2/instructor/InstructorCoursesPage").then((m) => ({ default: m.InstructorCoursesPage })));
const InstructorOverviewPage = lazy(() => import("../../features/admin-v2/instructor/InstructorOverviewPage").then((m) => ({ default: m.InstructorOverviewPage })));
const InstructorCourseContentPage = lazy(() => import("../../features/admin-v2/instructor/InstructorCourseContentPage").then((m) => ({ default: m.InstructorCourseContentPage })));
const AdminContentApprovalsPage = lazy(() => import("../../features/admin-v2/content/ContentApprovalsPage").then((m) => ({ default: m.ContentApprovalsPage })));

function withAdminSuspense<P extends object>(Component: ComponentType<P>, props: P) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </RouteErrorBoundary>
  );
}

export const adminRoutes: RouteObject[] = [{
  path: "/admin",
  element: <AdminV2Layout />,
  children: [
    { index: true, element: withAdminSuspense(AdminV2OverviewPage, {}) },
    { path: "security", element: withAdminSuspense(AdminV2SecurityPage, {}) },
    { path: "support", element: withAdminSuspense(AdminSupportInboxPage, {}) },
    { path: "instructors", element: withAdminSuspense(AdminV2InstructorsPage, {}) },
    { path: "commercial", element: <Navigate to="/admin/payments" replace /> },
    { path: "access", element: <Navigate to="/admin/subscriptions" replace /> },
    { path: "media", element: <Navigate to="/admin/content" replace /> },
    { path: "assessments", element: withAdminSuspense(AdminAssessmentsPage, {}) },
    { path: "assignments", element: withAdminSuspense(AdminAssignmentReviewPage, {}) },
    { path: "instructor", element: withAdminSuspense(InstructorOverviewPage, {}) },
    { path: "instructor/courses", element: withAdminSuspense(InstructorCoursesPage, {}) },
    { path: "instructor/courses/:courseId", element: withAdminSuspense(InstructorCourseContentPage, {}) },
    { path: "instructor/content", element: <Navigate to="/admin/instructor/courses" replace /> },
    { path: "instructor/assignments", element: withAdminSuspense(AdminAssignmentReviewPage, {}) },
    { path: "instructor/assessments", element: withAdminSuspense(AdminAssessmentsPage, {}) },
    { path: "audit", element: <Navigate to="/admin/security" replace /> },
    { path: "roles", element: withAdminSuspense(AdminRolesPage, {}) },
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
  children: [{ index: true, element: withAdminSuspense(AdminContentApprovalsPage, {}) }],
},
{
  path: "/admin/payments",
  element: <AdminV2Layout />,
  children: [{ index: true, element: withAdminSuspense(AdminV2PaymentsPage, {}) }],
},
...(import.meta.env.DEV
  ? [{
      path: "/student-preview",
      element: withAdminSuspense(
        lazy(() => import("../../features/admin-v2/students/LocalStudentPreviewPage").then((m) => ({ default: m.LocalStudentPreviewPage }))),
        {},
      ),
    }]
  : []),
];
