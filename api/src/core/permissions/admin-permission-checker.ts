import type { AdminPermissionCode } from "../../contracts/admin";
import { fail, ok, type Result } from "../../shared";
import { adminCoreError, permissionDeniedError, type AdminCoreError } from "../errors";
import type { AdminRequestContext } from "../context";

export function requireAdminPermission(context: AdminRequestContext, permission: AdminPermissionCode): Result<void, AdminCoreError> {
  if (!context.platform.isActive || context.adminUser.status !== "active") return fail(adminCoreError("admin_user_missing_or_inactive", "The resolved admin user is not active.", context.correlationId));
  if (context.permissions.includes(permission)) return ok(undefined);
  return fail(permissionDeniedError(context.correlationId, { requiredPermission: permission, brandCode: context.brand.brandCode, adminUserId: context.adminUser.adminUserId }));
}