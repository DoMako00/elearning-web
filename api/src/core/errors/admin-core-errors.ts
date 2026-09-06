import type { CorrelationId } from "../../contracts/admin";

export type AdminCoreErrorCode =
  | "unauthenticated" | "platform_required" | "platform_mismatch" | "admin_user_missing_or_inactive"
  | "permission_denied" | "target_not_found" | "target_platform_mismatch" | "brand_mismatch" | "target_brand_mismatch"
  | "validation_failed" | "reason_required" | "idempotency_key_required" | "policy_validation_failed"
  | "lifecycle_transition_denied" | "unsupported_scope" | "audit_write_failed" | "not_implemented" | "conflict"
  | "idempotency_key_reused" | "persistence_failed";

export interface AdminCoreError { readonly code: AdminCoreErrorCode; readonly message: string; readonly correlationId: CorrelationId; readonly details?: Readonly<Record<string, unknown>>; }
export function adminCoreError(code: AdminCoreErrorCode, message: string, correlationId: CorrelationId, details?: Readonly<Record<string, unknown>>): AdminCoreError { return { code, message, correlationId, details }; }
export const missingReasonError = (correlationId: CorrelationId) => adminCoreError("reason_required", "A reason is required for this administrative action.", correlationId);
export const missingIdempotencyKeyError = (correlationId: CorrelationId) => adminCoreError("idempotency_key_required", "An idempotency key is required for this administrative action.", correlationId);
export const permissionDeniedError = (correlationId: CorrelationId, details?: Readonly<Record<string, unknown>>) => adminCoreError("permission_denied", "The administrative permission is not available.", correlationId, details);
/** @deprecated Compatibility error name; Medway/Elite are brand scopes inside one platform. */
export const platformMismatchError = (correlationId: CorrelationId) => adminCoreError("platform_mismatch", "Exactly one active brand scope is required.", correlationId);
export const targetBrandMismatchError = (correlationId: CorrelationId, details?: Readonly<Record<string, unknown>>) => adminCoreError("target_brand_mismatch", "The target does not belong to the resolved brand.", correlationId, details);
/** @deprecated Compatibility error name for a brand-scope mismatch. */
export const targetPlatformMismatchError = (correlationId: CorrelationId, details?: Readonly<Record<string, unknown>>) => adminCoreError("target_platform_mismatch", "The target does not belong to the resolved brand.", correlationId, details);
export const policyValidationError = (correlationId: CorrelationId, details?: Readonly<Record<string, unknown>>) => adminCoreError("policy_validation_failed", "The command policy could not be validated.", correlationId, details);
export const notImplementedError = (correlationId: CorrelationId) => adminCoreError("not_implemented", "This administrative operation is not implemented.", correlationId);
