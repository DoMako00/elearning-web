import type { AdminPermissionCode, AdminSensitiveCommandMetadata } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
import type { AdminRequestContext } from "../../core/context";
import { requireAdminPermission, type AdminPermissionResolver } from "../../core/permissions";
import type { AdminPolicyValidator } from "../../core/policies";
import { validateAdminTargetBrand, validateCommandBrand, validateSensitiveCommandMetadata } from "../../core/validation";
import { adminCoreError, type AdminCoreError } from "../../core/errors";
import type { AdminEvidenceWriter } from "../../core/logging";

export interface AdminCommandTarget { readonly targetType: string; readonly targetId: string; readonly targetBrandId?: string; /** @deprecated Compatibility alias for brand scope. */ readonly targetPlatformId?: string; }
export interface AdminCommandBoundaryInput<T = unknown> { readonly context: AdminRequestContext; readonly requiredPermission: AdminPermissionCode; readonly commandName: string; readonly target: AdminCommandTarget; readonly metadata: AdminSensitiveCommandMetadata; readonly run: () => Promise<Result<T, AdminCoreError>>; readonly writeAudit?: boolean; }
export interface AdminCommandBoundarySuccess<T = unknown> { readonly success: true; readonly data?: T; readonly correlationId: string; readonly adminActionId: string; readonly auditEventId?: string; readonly requiresRefresh: boolean; }
export type AdminCommandBoundaryResult<T = unknown> = Result<AdminCommandBoundarySuccess<T>, AdminCoreError>;
export interface AdminCommandBoundaryDependencies { readonly permissionResolver: AdminPermissionResolver; readonly policyValidator: AdminPolicyValidator; readonly evidenceWriter: AdminEvidenceWriter; }

export async function executeAdminCommandBoundary<T>(input: AdminCommandBoundaryInput<T>, dependencies: AdminCommandBoundaryDependencies): Promise<AdminCommandBoundaryResult<T>> {
  const validation = validateSensitiveCommandMetadata(input.metadata); if (!validation.ok) return deny<T>(input, dependencies, validation.error);
  const commandBrand = validateCommandBrand(input.metadata, input.context); if (!commandBrand.ok) return deny<T>(input, dependencies, commandBrand.error);
  const permissions = await dependencies.permissionResolver.resolvePermissions(input.context);
  const effectiveContext = { ...input.context, permissions };
  const permission = requireAdminPermission(effectiveContext, input.requiredPermission); if (!permission.ok) return deny<T>(input, dependencies, permission.error);
  const targetBrandId = input.target.targetBrandId ?? input.target.targetPlatformId;
  if (!targetBrandId) return deny<T>(input, dependencies, { code: "brand_mismatch", message: "A target brand is required.", correlationId: input.metadata.correlationId });
  const targetBrand = validateAdminTargetBrand(effectiveContext, targetBrandId); if (!targetBrand.ok) return deny<T>(input, dependencies, targetBrand.error);
  const policy = await dependencies.policyValidator.validateCommandPolicy({ context: effectiveContext, commandName: input.commandName, targetType: input.target.targetType, targetId: input.target.targetId, targetBrandId, targetPlatformId: input.target.targetPlatformId, policySetId: input.metadata.policySetId, expectedVersion: input.metadata.expectedVersion }); if (!policy.ok) return deny<T>(input, dependencies, policy.error);
  const result = await input.run(); if (!result.ok) { await writeDeniedOrFailed(input, dependencies, "failed"); return fail(result.error); }
  const action = await dependencies.evidenceWriter.writeAdminAction({ context: effectiveContext, commandName: input.commandName, targetType: input.target.targetType, targetId: input.target.targetId, targetBrandId, targetPlatformId: input.target.targetPlatformId, outcome: "succeeded", reason: input.metadata.reason }); if (!action.ok) return fail(adminCoreError("audit_write_failed", "The administrative evidence could not be written.", input.metadata.correlationId));
  let auditEventId: string | undefined;
  if (input.writeAudit) { const audit = await dependencies.evidenceWriter.writeAuditLog({ context: effectiveContext, action: input.commandName, targetType: input.target.targetType, targetId: input.target.targetId, targetBrandId, targetPlatformId: input.target.targetPlatformId, reason: input.metadata.reason }); if (!audit.ok) return fail(adminCoreError("audit_write_failed", "The administrative evidence could not be written.", input.metadata.correlationId)); auditEventId = audit.value.id; }
  return ok({ success: true, data: result.value, correlationId: input.metadata.correlationId, adminActionId: action.value.id, auditEventId, requiresRefresh: true });
}
async function writeDeniedOrFailed(input: AdminCommandBoundaryInput, dependencies: AdminCommandBoundaryDependencies, outcome: "denied" | "failed") { await dependencies.evidenceWriter.writeAdminAction({ context: input.context, commandName: input.commandName, targetType: input.target.targetType, targetId: input.target.targetId, targetBrandId: input.target.targetBrandId, targetPlatformId: input.target.targetPlatformId, outcome, reason: input.metadata.reason }); }
async function deny<T>(input: AdminCommandBoundaryInput<T>, dependencies: AdminCommandBoundaryDependencies, error: AdminCoreError): Promise<AdminCommandBoundaryResult<T>> { await writeDeniedOrFailed(input, dependencies, "denied"); return fail(error); }