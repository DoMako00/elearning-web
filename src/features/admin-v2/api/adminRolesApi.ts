import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export interface AdminEffectiveRoleDto { brand: { code: string; name: string }; roleCodes: string[]; permissionCodes: string[]; }
export async function getAdminEffectiveRole(signal?: AbortSignal): Promise<AdminEffectiveRoleDto> {
  const api = await requireApiClient();
  const result = await api.GET("/v1/admin/roles/me" as never, { signal } as never);
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Admin permissions could not be loaded."));
  const payload = result.data as { data?: AdminEffectiveRoleDto } | undefined;
  if (!payload?.data) throw new Error("The Admin authority API returned an incomplete response.");
  return payload.data;
}

export interface AdminRoleManagementDto { items: Array<{ adminProfileId: string; displayName: string; roleCodes: string[]; version: number }>; roles: Array<{ id: string; code: string; name: string; version: number }>; }
export async function listAdminRoleAssignments(signal?: AbortSignal): Promise<AdminRoleManagementDto> {
  const api = await requireApiClient();
  const result = await api.GET("/v1/admin/roles" as never, { signal } as never);
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Admin roles could not be loaded."));
  const payload = result.data as { data?: AdminRoleManagementDto } | undefined;
  if (!payload?.data) throw new Error("The Admin role API returned an incomplete response.");
  return payload.data;
}

export async function assignAdminRole(adminProfileId: string, body: { roleCode: string; expectedVersion: number; reason: string; allowOwnerRoleChange: boolean }): Promise<{ adminProfileId: string; roleCode: string; version: number }> {
  const api = await requireApiClient();
  const result = await api.writeJson("POST", `/v1/admin/roles/admins/${encodeURIComponent(adminProfileId)}`, body, { headers: { "Idempotency-Key": crypto.randomUUID() } });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Admin role could not be changed."));
  const payload = result.data as { data?: { adminProfileId: string; roleCode: string; version: number } } | undefined;
  if (!payload?.data) throw new Error("The Admin role API returned an incomplete response.");
  return payload.data;
}
