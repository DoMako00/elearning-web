import type { AdminPermissionCode } from "../../contracts/admin";
import type { AdminRequestContext } from "../context";

export interface AdminPermissionResolver { resolvePermissions(context: AdminRequestContext): Promise<readonly AdminPermissionCode[]>; }
export class InMemoryAdminPermissionResolver implements AdminPermissionResolver {
  private readonly permissionsByAdminUser: ReadonlyMap<string, readonly AdminPermissionCode[]>;
  constructor(permissionsByAdminUser: ReadonlyMap<string, readonly AdminPermissionCode[]> | Readonly<Record<string, readonly AdminPermissionCode[]>> = {}) { this.permissionsByAdminUser = permissionsByAdminUser instanceof Map ? permissionsByAdminUser : new Map(Object.entries(permissionsByAdminUser)); }
  async resolvePermissions(context: AdminRequestContext): Promise<readonly AdminPermissionCode[]> { return this.permissionsByAdminUser.get(context.adminUser.adminUserId) ?? context.permissions; }
}