import {
  BookOpen,
  CalendarDays,
  CreditCard,
  Files,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { AdminPermissionCode } from "../../../features/admin/api";

export interface AdminNavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: AdminPermissionCode;
  description: string;
}
// Navigation visibility is presentation only; the backend remains authoritative for permissions.
const allAdminNavigation: readonly AdminNavigationItem[] = [
  {
    label: "Overview",
    path: "/admin",
    icon: LayoutDashboard,
    description:
      "Welcome back, Admin. Here's what's happening with your platform today.",
  },
  {
    label: "Instructors",
    path: "/admin/instructors",
    icon: UserRound,
    description:
      "Manage your global instructor directory, brand assignments, and course allocations.",
  },
  {
    label: "Subscriptions",
    path: "/admin/subscriptions",
    icon: CalendarDays,
    permission: "admin.subscriptions.read",
    description:
      "Subscription dates, course access, capacity, and cancellation.",
  },
  {
    label: "Curriculum",
    path: "/admin/curriculum",
    icon: BookOpen,
    permission: "admin.curriculum.read",
    description:
      "Review university academic levels, semesters, and shared module references.",
  },
  {
    label: "Students",
    path: "/admin/students",
    icon: GraduationCap,
    permission: "admin.students.read",
    description: "Student identity, enrollment, and access summaries.",
  },
  {
    label: "Courses",
    path: "/admin/courses",
    icon: LibraryBig,
    description:
      "Manage brand-owned courses, map them to curriculum modules, and manage teaching assignments.",
  },
  {
    label: "Payments",
    path: "/admin/payments",
    icon: CreditCard,
    permission: "admin.payments.read",
    description: "Review manual payment evidence, approve or reject orders.",
  },
  {
    label: "Content",
    path: "/admin/content",
    icon: Files,
    permission: "admin.content.read",
    description: "Lessons, resources, and release readiness.",
  },
  {
    label: "Security",
    path: "/admin/security",
    icon: ShieldCheck,
    permission: "admin.security.read",
    description: "Manage registered devices, sessions, and security activity.",
  },
];

const routeOrder = [
  "/admin",
  "/admin/curriculum",
  "/admin/courses",
  "/admin/instructors",
  "/admin/students",
  "/admin/payments",
  "/admin/subscriptions",
  "/admin/content",
  "/admin/security",
] as const;

export const adminNavigation = routeOrder.map(
  (path) => allAdminNavigation.find((item) => item.path === path)!,
);

const additionalRouteMetadata: readonly Omit<AdminNavigationItem, "icon">[] = [
  {
    label: "Commercial",
    path: "/admin/commercial",
    permission: "admin.payments.read",
    description: "Payment, refund, and order review read models.",
  },
  {
    label: "Access Grants",
    path: "/admin/access",
    permission: "admin.grants.read",
    description: "Explicit access sources and scopes.",
  },
  {
    label: "Media",
    path: "/admin/media",
    permission: "admin.media.read",
    description: "Protected assets and playback.",
  },
  {
    label: "Assessments",
    path: "/admin/assessments",
    permission: "admin.assessments.read",
    description: "Assessments and attempts.",
  },
  {
    label: "Audit",
    path: "/admin/audit",
    permission: "admin.audit.read",
    description: "Append-only operational evidence.",
  },
  {
    label: "Roles & Permissions",
    path: "/admin/roles",
    permission: "admin.roles.read",
    description: "Brand-scoped governance.",
  },
];

export function getAdminRouteMetadata(pathname: string) {
  return (
    [...adminNavigation, ...additionalRouteMetadata].find(
      (item) =>
        pathname === item.path ||
        (item.path !== "/admin" && pathname.startsWith(`${item.path}/`)),
    ) ?? adminNavigation[0]
  );
}
