import type { AdminBrandContext, AdminSensitiveCommandMetadata, CorrelationId } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
import { missingIdempotencyKeyError, missingReasonError, platformMismatchError, targetBrandMismatchError, type AdminCoreError } from "../errors";
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
/** Brand equality is the canonical Medway/Elite boundary; targetPlatformId is a compatibility parameter. */
export function validateAdminTargetBrand(context: AdminRequestContext, targetBrandId: string): Result<void, AdminCoreError> { return context.brand.brandId === targetBrandId ? ok(undefined) : fail(targetBrandMismatchError(context.correlationId, { brandCode: context.brand.brandCode })); }
/** @deprecated Compatibility alias for validateAdminTargetBrand. */
export const validateAdminTargetPlatform = validateAdminTargetBrand;
export function validateCommandBrand(metadata: AdminSensitiveCommandMetadata, context: AdminRequestContext): Result<void, AdminCoreError> { const brand = (metadata as AdminSensitiveCommandMetadata & { brand?: AdminBrandContext }).brand; const legacy = metadata.platform; return brand ? (brand.brandId === context.brand.brandId && brand.brandCode === context.brand.brandCode ? ok(undefined) : fail(targetBrandMismatchError(context.correlationId))) : (legacy.platformId === context.brand.brandId && legacy.platformCode === context.brand.brandCode ? ok(undefined) : fail(targetBrandMismatchError(context.correlationId))); }
/** @deprecated Compatibility alias for validateCommandBrand. */
export const validateCommandPlatform = validateCommandBrand;