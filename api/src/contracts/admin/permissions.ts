import type { AdminPlatformCode } from "./platform";
import type { EntityId, ISODateTime, MaskedEmail } from "./common";

export type AdminPermissionCode =
  | "admin.students.read" | "admin.students.suspend" | "admin.students.restore"
  | "admin.sessions.revoke" | "admin.devices.revoke" | "admin.payments.read"
  | "admin.payments.review" | "admin.refunds.read" | "admin.refunds.decide"
  | "admin.subscriptions.read" | "admin.seats.manage" | "admin.grants.read"
  | "admin.grants.issue_exception" | "admin.grants.revoke" | "admin.content.read"
  | "admin.content.publish" | "admin.content.withdraw" | "admin.media.read"
  | "admin.media.manage" | "admin.assessments.read" | "admin.assessments.review"
  | "admin.audit.read" | "admin.security.read" | "admin.roles.read"
  | "admin.roles.manage" | "admin.policies.read" | "admin.policies.manage"
  | "admin.instructors.create" | "admin.instructors.update"
  | "admin.brand_instructors.assign" | "admin.brand_instructors.update"
  | "admin.brand_courses.create" | "admin.brand_courses.update"
  | "admin.course_instructors.assign" | "admin.course_instructors.update";

/** UI permission gates are presentation only; backend validation is authoritative. */
export interface AdminPrincipalSummary {
  adminUserId: EntityId;
  appUserId: EntityId;
  displayName: string;
  emailMasked: MaskedEmail;
  activePlatformCode: AdminPlatformCode;
  permissions: readonly AdminPermissionCode[];
  elevatedAccessExpiresAt?: ISODateTime | null;
}

export interface AdminPermissionRequirement {
  permission: AdminPermissionCode;
  reasonRequired: boolean;
  auditRequired: boolean;
  platformScoped: true;
}
