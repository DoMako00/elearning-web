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

export interface AdminWorkspaceCourseDto {
  id: string;
  brandId: string;
  brandCode: "medway" | "elite" | "nexus";
  brandName: string;
  code: string;
  title: string;
  academicModuleId: string | null;
  academicInstitutionId: string | null;
  academicLevelId: string | null;
  academicSemesterId: string | null;
  status: string;
}
export interface AdminWorkspaceDto {
  workspace: "super_admin" | "instructor";
  displayRole: "Super Admin" | "Instructor";
  isGlobal: boolean;
  activeBrandId: string;
  brands: Array<{ id: string; code: "medway" | "elite" | "nexus"; name: string }>;
  courses: AdminWorkspaceCourseDto[];
  instructor: { id: string; displayName: string; courseIds: string[] } | null;
  roleCodes: string[];
  permissionCodes: string[];
}
export async function getAdminWorkspace(signal?: AbortSignal): Promise<AdminWorkspaceDto> {
  const api = await requireApiClient();
  const result = await api.getJson<{ ok: true; correlationId: string; data?: AdminWorkspaceDto }>("/v1/admin/workspace", { signal });
  if (result.error) {
    const error = new Error(extractApiErrorMessage(result.error, "Your Admin workspace could not be loaded."));
    Object.assign(error, { status: (result.error as { status?: number }).status ?? result.response?.status });
    throw error;
  }
  if (!result.data?.data) throw new Error("The Admin workspace API returned an incomplete response.");
  return result.data.data;
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

export async function linkInstructorAccount(instructorId: string, adminProfileId: string, reason: string): Promise<{ adminProfileId: string; instructorId: string; linkId: string; version: number }> {
  const api = await requireApiClient();
  const result = await api.writeJson("POST", `/v1/admin/instructors/${encodeURIComponent(instructorId)}/admin-link`, { adminProfileId, reason }, { headers: { "Idempotency-Key": crypto.randomUUID() } });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Instructor login could not be linked."));
  const payload = result.data as { data?: { adminProfileId: string; instructorId: string; linkId: string; version: number } } | undefined;
  if (!payload?.data) throw new Error("The Instructor login API returned an incomplete response.");
  return payload.data;
}
