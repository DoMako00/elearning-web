import { BookOpen, CalendarDays, CreditCard, Files, GraduationCap, LayoutDashboard, LibraryBig, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import type { AdminPermissionCode } from "../../../features/admin/api";

export interface AdminNavigationItem { label: string; path: string; icon: LucideIcon; permission?: AdminPermissionCode; description: string; }

// Navigation visibility is presentation only; the backend remains authoritative for permissions.
export const adminNavigation: readonly AdminNavigationItem[] = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, description: "Welcome back, Admin. Here's what's happening with your platform today." },
  { label: "Curriculum", path: "/admin/curriculum", icon: BookOpen, description: "BUC academic levels, semesters, and modules." },
  { label: "Courses", path: "/admin/courses", icon: LibraryBig, description: "Brand-scoped teaching courses and their delivery state." },
  { label: "Instructors", path: "/admin/instructors", icon: UserRound, description: "Manage your global instructor directory, brand assignments, and course allocations." },
  { label: "Students", path: "/admin/students", icon: GraduationCap, permission: "admin.students.read", description: "Student identity, enrollment, and access summaries." },
  { label: "Payments", path: "/admin/payments", icon: CreditCard, permission: "admin.payments.read", description: "Payments, orders, and review status." },
  { label: "Subscriptions", path: "/admin/subscriptions", icon: CalendarDays, permission: "admin.subscriptions.read", description: "Plans, seats, and subscription lifecycle." },
  { label: "Content", path: "/admin/content", icon: Files, permission: "admin.content.read", description: "Lessons, resources, and release readiness." },
  { label: "Security", path: "/admin/security", icon: ShieldCheck, permission: "admin.security.read", description: "Security events and account risk." },
];

const additionalRouteMetadata: readonly Omit<AdminNavigationItem, "icon">[] = [
  { label: "Commercial", path: "/admin/commercial", permission: "admin.payments.read", description: "Payment, refund, and order review read models." },
  { label: "Access Grants", path: "/admin/access", permission: "admin.grants.read", description: "Explicit access sources and scopes." },
  { label: "Media", path: "/admin/media", permission: "admin.media.read", description: "Protected assets and playback." },
  { label: "Assessments", path: "/admin/assessments", permission: "admin.assessments.read", description: "Assessments and attempts." },
  { label: "Audit", path: "/admin/audit", permission: "admin.audit.read", description: "Append-only operational evidence." },
  { label: "Roles & Permissions", path: "/admin/roles", permission: "admin.roles.read", description: "Brand-scoped governance." },
];

export function getAdminRouteMetadata(pathname: string) {
  return [...adminNavigation, ...additionalRouteMetadata].find((item) => pathname === item.path || (item.path !== "/admin" && pathname.startsWith(`${item.path}/`))) ?? adminNavigation[0];
}
