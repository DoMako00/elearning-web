import type { AdminError, AdminErrorCode, CorrelationId, RedactedJsonObject } from "./adminApi.types";

export function createAdminError(code: AdminErrorCode, message: string, correlationId: CorrelationId, details?: RedactedJsonObject): AdminError {
  return { code, message, correlationId, details };
}

export function createMissingReasonError(correlationId: CorrelationId) { return createAdminError("reason_required", "A reason is required for this administrative action.", correlationId); }
export function createMissingIdempotencyKeyError(correlationId: CorrelationId) { return createAdminError("idempotency_key_required", "An idempotency key is required for this administrative action.", correlationId); }
export function createPlatformMismatchError(correlationId: CorrelationId) { return createAdminError("platform_mismatch", "The target does not belong to the requested platform.", correlationId); }
export function createPermissionDeniedError(correlationId: CorrelationId) { return createAdminError("permission_denied", "The mock backend denied this administrative permission.", correlationId); }
export function createNotImplementedError(correlationId: CorrelationId) { return createAdminError("not_implemented", "This mock command is contract-defined but not implemented.", correlationId); }
export function createTargetNotFoundError(correlationId: CorrelationId) { return createAdminError("target_not_found", "The requested administrative target was not found.", correlationId); }
