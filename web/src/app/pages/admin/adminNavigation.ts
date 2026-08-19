import { Activity, BookOpen, ClipboardList, CreditCard, FileClock, KeyRound, LayoutDashboard, LockKeyhole, MonitorPlay, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import type { AdminPermissionCode } from "../../../features/admin/api";

export interface AdminNavigationItem { label: string; path: string; icon: LucideIcon; permission?: AdminPermissionCode; description: string; }
// Navigation visibility is presentation only; the backend remains authoritative for permissions.
export const adminNavigation: readonly AdminNavigationItem[] = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, description: "Operational overview" },
  { label: "Students", path: "/admin/students", icon: UsersRound, permission: "admin.students.read", description: "Identity and access summaries" },
  { label: "Commercial", path: "/admin/commercial", icon: CreditCard, permission: "admin.payments.read", description: "Payments and refunds" },
  { label: "Subscriptions", path: "/admin/subscriptions", icon: Activity, permission: "admin.subscriptions.read", description: "Plans, seats, and lifecycle" },
  { label: "Access Grants", path: "/admin/access", icon: KeyRound, permission: "admin.grants.read", description: "Explicit access sources and scope" },
  { label: "Content", path: "/admin/content", icon: BookOpen, permission: "admin.content.read", description: "Learning hierarchy and releases" },
  { label: "Media", path: "/admin/media", icon: MonitorPlay, permission: "admin.media.read", description: "Protected assets and playback" },
  { label: "Assessments", path: "/admin/assessments", icon: ClipboardList, permission: "admin.assessments.read", description: "Assessments and attempts" },
  { label: "Security", path: "/admin/security", icon: ShieldCheck, permission: "admin.security.read", description: "Security events and risk" },
  { label: "Audit", path: "/admin/audit", icon: FileClock, permission: "admin.audit.read", description: "Append-only evidence" },
  { label: "Roles & Permissions", path: "/admin/roles", icon: LockKeyhole, permission: "admin.roles.read", description: "Platform-scoped governance" },
];