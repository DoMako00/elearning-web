import type { AdminPlatformContext, AdminSensitiveCommandMetadata, CorrelationId } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
import { missingIdempotencyKeyError, missingReasonError, platformMismatchError, targetPlatformMismatchError, type AdminCoreError } from "../errors";
import type { AdminRequestContext } from "../context";

export function validateCorrelationId(correlationId: CorrelationId): Result<void, AdminCoreError> { return correlationId?.trim() ? ok(undefined) : fail(platformMismatchError(correlationId ?? "missing-correlation")); }
export function validateSensitiveCommandMetadata(metadata: AdminSensitiveCommandMetadata): Result<void, AdminCoreError> {
  const correlation = validateCorrelationId(metadata?.correlationId ?? ""); if (!correlation.ok) return correlation;
  if (!metadata?.platform) return fail(platformMismatchError(metadata.correlationId));
  if (!metadata.reason?.trim()) return fail(missingReasonError(metadata.correlationId));
  if (metadata.reason.trim().length > 500) return fail({ code: "validation_failed", message: "The administrative reason is too long.", correlationId: metadata.correlationId });
  if (!metadata.idempotencyKey?.trim()) return fail(missingIdempotencyKeyError(metadata.correlationId));
  return ok(undefined);
}
export function validateAdminTargetPlatform(context: AdminRequestContext, targetPlatformId: string): Result<void, AdminCoreError> { return context.platform.platformId === targetPlatformId ? ok(undefined) : fail(targetPlatformMismatchError(context.correlationId, { platformCode: context.platform.platformCode })); }
export function validateCommandPlatform(metadata: AdminSensitiveCommandMetadata, context: AdminRequestContext): Result<void, AdminCoreError> { const platform: AdminPlatformContext | undefined = metadata?.platform; return platform?.platformId === context.platform.platformId && platform.platformCode === context.platform.platformCode ? ok(undefined) : fail(targetPlatformMismatchError(context.correlationId)); }