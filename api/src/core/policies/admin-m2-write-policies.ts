import type { AdminCoreError } from "../errors";
import { adminCoreError } from "../errors";
import { fail, ok, type Result } from "../../shared";
import type { M2BrandCourseScope, M2BrandCourseStatus, M2InstructorStatus } from "../../contracts/admin";

export interface M2BrandCourseDefinitionSnapshot { readonly courseScope: M2BrandCourseScope; readonly academicModuleId: string | null; readonly academicModuleExists: boolean; }
export interface M2BrandInstructorAssignmentFacts { readonly brandExists: boolean; readonly brandIsActive: boolean; readonly instructorExists: boolean; readonly instructorStatus: M2InstructorStatus; readonly associationStatus?: M2InstructorStatus; }
export interface M2CourseInstructorAssignmentFacts extends M2BrandInstructorAssignmentFacts { readonly courseExistsInBrand: boolean; readonly brandInstructorStatus?: M2InstructorStatus; readonly courseInstructorStatus?: M2InstructorStatus; }

function rejected<T = void>(correlationId: string, reason: string, code: "policy_validation_failed" | "conflict" = "policy_validation_failed"): Result<T, AdminCoreError> { return fail(adminCoreError(code, code === "conflict" ? "The requested relationship already exists." : "The command policy rejected the requested state.", correlationId, { reason })); }

export function validateM2BrandCourseDefinitionPolicy(correlationId: string, snapshot: M2BrandCourseDefinitionSnapshot): Result<void, AdminCoreError> {
  if (snapshot.courseScope === "curriculum" && !snapshot.academicModuleId) return rejected(correlationId, "curriculum_module_required");
  if (snapshot.academicModuleId && !snapshot.academicModuleExists) return rejected(correlationId, "academic_module_not_found");
  return ok(undefined);
}

export function validateBrandCourseStatusTransition(correlationId: string, fromStatus: M2BrandCourseStatus, toStatus: M2BrandCourseStatus): Result<{ readonly idempotent: boolean }, AdminCoreError> {
  if (fromStatus === toStatus) return ok({ idempotent: true });
  const allowed = (fromStatus === "draft" && (toStatus === "published" || toStatus === "archived")) || (fromStatus === "published" && toStatus === "archived");
  return allowed ? ok({ idempotent: false }) : fail(adminCoreError("lifecycle_transition_denied", "The brand-course lifecycle transition is not allowed.", correlationId, { fromStatus, toStatus }));
}

export function validateAssignInstructorToBrandPolicy(correlationId: string, facts: M2BrandInstructorAssignmentFacts): Result<{ readonly idempotent: boolean }, AdminCoreError> {
  if (!facts.brandExists || !facts.brandIsActive) return rejected(correlationId, "brand_not_active");
  if (!facts.instructorExists) return rejected(correlationId, "instructor_not_found");
  if (facts.instructorStatus !== "active") return rejected(correlationId, "instructor_inactive");
  if (facts.associationStatus === "active") return rejected(correlationId, "brand_instructor_active", "conflict");
  if (facts.associationStatus === "inactive") return rejected(correlationId, "brand_instructor_reactivation_required");
  return ok({ idempotent: false });
}

export function validateAssignInstructorToCoursePolicy(correlationId: string, facts: M2CourseInstructorAssignmentFacts): Result<{ readonly idempotent: boolean }, AdminCoreError> {
  const brand = validateAssignInstructorToBrandPolicy(correlationId, facts); if (!brand.ok && facts.associationStatus !== "active") return brand;
  if (!facts.courseExistsInBrand) return rejected(correlationId, "course_not_found_in_brand");
  if (facts.brandInstructorStatus !== "active") return rejected(correlationId, "brand_instructor_inactive_or_missing");
  if (facts.courseInstructorStatus === "active") return rejected(correlationId, "course_instructor_active", "conflict");
  if (facts.courseInstructorStatus === "inactive") return rejected(correlationId, "course_instructor_reactivation_required");
  return ok({ idempotent: false });
}
