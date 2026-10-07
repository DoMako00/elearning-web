/** Presentation vocabulary only. Never infer authority from email or selected brand. */
export type AdminCapability =
  | "overview.read"
  | "curriculum.read"
  | "curriculum.manage"
  | "courses.read"
  | "courses.manage"
  | "courses.assignInstructor"
  | "instructors.read"
  | "instructors.manage"
  | "instructors.assignBrand"
  | "instructors.assignCourse"
  | "students.read"
  | "students.manage"
  | "students.security"
  | "payments.read"
  | "payments.review"
  | "subscriptions.read"
  | "subscriptions.manage"
  | "subscriptions.cancel"
  | "content.read"
  | "content.manage"
  | "content.publish"
  | "security.read"
  | "security.manage";

/** Undefined means the current provider has not supplied a capability read model. */
export function hasAdminCapability(
  granted: ReadonlySet<AdminCapability> | undefined,
  required: AdminCapability,
): boolean | undefined {
  return granted?.has(required);
}
