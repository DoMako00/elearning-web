import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, type RouteObject } from "react-router-dom";
import { RouteErrorBoundary } from "../../components/layout/RouteErrorBoundary";
import { RouteLoadingFallback } from "../../components/layout/RouteLoadingFallback";

const AdminV2Layout = lazy(() => import("../../features/admin-v2/layout/AdminV2Layout").then((m) => ({ default: m.AdminV2Layout })));
const AdminLayout = () => <Suspense fallback={<RouteLoadingFallback withShell />}><AdminV2Layout /></Suspense>;

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
const InstructorStudentsPage = lazy(() => import("../../features/admin-v2/instructor/InstructorStudentsPage").then((m) => ({ default: m.InstructorStudentsPage })));
const InstructorSubscriptionsPage = lazy(() => import("../../features/admin-v2/instructor/InstructorSubscriptionsPage").then((m) => ({ default: m.InstructorSubscriptionsPage })));
const AdminContentApprovalsPage = lazy(() => import("../../features/admin-v2/content/ContentApprovalsPage").then((m) => ({ default: m.ContentApprovalsPage })));

const AdminV2CurriculumPage = lazy(() => import("../../features/admin-v2/curriculum/CurriculumPage").then((m) => ({ default: m.CurriculumPage })));
const AdminV2CoursesPage = lazy(() => import("../../features/admin-v2/courses/CoursesPage").then((m) => ({ default: m.CoursesPage })));
const AdminV2CourseBuilderPage = lazy(() => import("../../features/admin-v2/builder/CourseBuilderPage").then((m) => ({ default: m.CourseBuilderPage })));
const AdminV2SubscriptionsPage = lazy(() => import("../../features/admin-v2/subscriptions/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage })));
const AdminV2StudentsPage = lazy(() => import("../../features/admin-v2/students/StudentsPage").then((m) => ({ default: m.StudentsPage })));

function withAdminSuspense<P extends object>(Component: ComponentType<P>, props: P) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    </RouteErrorBoundary>
  );
}

// One parent route keeps AdminV2Layout mounted while moving between admin screens, so its loaded data survives navigation.
export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: withAdminSuspense(AdminV2OverviewPage, {}) },
      { path: "overview", element: withAdminSuspense(AdminV2OverviewPage, {}) },
      { path: "curriculum", element: withAdminSuspense(AdminV2CurriculumPage, {}) },
      { path: "courses", element: withAdminSuspense(AdminV2CoursesPage, {}) },
      { path: "courses/:courseId/builder", element: withAdminSuspense(AdminV2CourseBuilderPage, {}) },
      { path: "instructors", element: withAdminSuspense(AdminV2InstructorsPage, {}) },
      { path: "roles", element: withAdminSuspense(AdminRolesPage, {}) },
      { path: "students", element: withAdminSuspense(AdminV2StudentsPage, {}) },
      { path: "payments", element: withAdminSuspense(AdminV2PaymentsPage, {}) },
      { path: "subscriptions", element: withAdminSuspense(AdminV2SubscriptionsPage, {}) },
      { path: "content", element: withAdminSuspense(AdminContentApprovalsPage, {}) },
      { path: "security", element: withAdminSuspense(AdminV2SecurityPage, {}) },
      { path: "support", element: withAdminSuspense(AdminSupportInboxPage, {}) },
      { path: "assessments", element: withAdminSuspense(AdminAssessmentsPage, {}) },
      { path: "assignments", element: withAdminSuspense(AdminAssignmentReviewPage, {}) },
      { path: "instructor", element: withAdminSuspense(InstructorOverviewPage, {}) },
      { path: "instructor/courses", element: withAdminSuspense(InstructorCoursesPage, {}) },
      { path: "instructor/courses/:courseId", element: withAdminSuspense(InstructorCourseContentPage, {}) },
      { path: "instructor/students", element: withAdminSuspense(InstructorStudentsPage, {}) },
      { path: "instructor/subscriptions", element: withAdminSuspense(InstructorSubscriptionsPage, {}) },
      { path: "instructor/assignments", element: withAdminSuspense(AdminAssignmentReviewPage, {}) },
      { path: "instructor/assessments", element: withAdminSuspense(AdminAssessmentsPage, {}) },
      // Old URLs that now live elsewhere
      { path: "commercial", element: <Navigate to="/admin/payments" replace /> },
      { path: "access", element: <Navigate to="/admin/subscriptions" replace /> },
      { path: "media", element: <Navigate to="/admin/content" replace /> },
      { path: "audit", element: <Navigate to="/admin/security" replace /> },
      { path: "instructor/content", element: <Navigate to="/admin/instructor/courses" replace /> },
    ],
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
