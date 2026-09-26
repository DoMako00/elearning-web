import type { CorrelationId, RedactedJsonObject } from "./common";

export type AdminErrorCode =
  | "unauthenticated" | "platform_required" | "platform_mismatch"
  | "admin_user_missing_or_inactive" | "permission_denied" | "target_not_found"
  | "target_platform_mismatch" | "validation_failed" | "reason_required"
  | "idempotency_key_required" | "policy_validation_failed"
  | "lifecycle_transition_denied" | "sensitive_data_redacted" | "unsupported_scope"
  | "not_implemented" | "conflict" | "unknown_error";

/** Safe for an admin UI; details must never contain secrets or provider payloads. */
export interface AdminError {
  code: AdminErrorCode;
  message: string;
  correlationId: CorrelationId;
  details?: RedactedJsonObject;
}
