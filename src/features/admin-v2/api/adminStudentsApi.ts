import { requireApiClient } from "../../../app/api/client";
import { toEnglishStudentName } from "./studentDisplay";

type Envelope<T> = { ok: true; correlationId: string; data: T };
const key = () => crypto.randomUUID();
async function unwrap<T>(
  request: Promise<{ data?: unknown; error?: unknown }>,
): Promise<T> {
  const response = await request;
  if (response.error) throw response.error;
  const payload = response.data as Envelope<T> | undefined;
  if (!payload?.data)
    throw new Error("The server returned an incomplete response.");
  return payload.data;
}

export type AdminStudentStatus =
  "active" | "pending" | "disabled" | "suspended";
export interface AdminStudentListItem {
  id: string;
  createdAt: string;
  displayName: string | null;
  emailMasked: string | null;
  phoneMasked: string | null;
  academicInstitution: string | null;
  academicInstitutionId?: string | null;
  academicLevel: string | null;
  academicLevelId: string | null;
  academicSemester?: string | null;
  academicSemesterId?: string | null;
  academicTermOrYear?: string | null;
  version: number;
  status: AdminStudentStatus;
  activeDeviceCount: number;
  activeSessionCount: number;
  lastSeenAt: string | null;
  platform?: { platformCode?: string; platformDisplayName?: string };
}
export interface AdminStudentDevice {
  id: string;
  slot?: "mobile" | "secondary" | null;
  platform: string | null;
  browser: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  status?: string;
  replacementCount?: number;
}
export interface AdminStudentSession {
  id: string;
  deviceId?: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}
export interface AdminStudentDetail extends AdminStudentListItem {
  createdAt: string;
  updatedAt?: string;
  access?: {
    activeSubscriptionCount?: number;
    activeSeatCount?: number | null;
    activeGrantCount?: number;
    expiredGrantCount?: number;
    revokedGrantCount?: number;
    enrollmentCount?: number;
  };
  devices?: readonly AdminStudentDevice[];
  sessions?: readonly AdminStudentSession[];
}

export async function listAdminStudents(
  filters: Readonly<{
    brand?: string;
    search?: string;
    academicLevel?: string;
    status?: AdminStudentStatus;
    page?: number;
    pageSize?: number;
  }> = {},
) {
  const api = await requireApiClient();
  const result = await unwrap<{
    data: AdminStudentListItem[];
    pagination: { page: number; pageSize: number; totalItems: number };
  }>(api.GET("/v1/admin/students" as never, { params: { query: filters } }));
  return { ...result, data: result.data.map((student) => ({
    ...student,
    displayName: toEnglishStudentName(student.displayName) || null,
  })) };
}
export async function getAdminStudent(studentId: string, brand?: string) {
  const api = await requireApiClient();
  const student = await unwrap<AdminStudentDetail>(
    api.GET("/v1/admin/students/{studentId}" as never, {
      params: { path: { studentId }, query: brand ? { brand } : undefined },
    }),
  );
  return { ...student, displayName: toEnglishStudentName(student.displayName) || null };
}
export async function createAdminStudent(
  input: Readonly<{
    fullName: string;
    phone?: string | null;
    brandCode: "medway" | "elite" | "nexus";
    academicInstitutionCode: "buc" | "delta";
    academicLevelNumber: number;
    academicSemesterNumber: number;
    studentCode?: string;
    programLabel?: string;
  }>,
) {
  const api = await requireApiClient();
  return unwrap<{
    studentProfileId: string;
    accountIdentifier: string;
    setupCode: string;
    setupExpiresAt: string;
  }>(
    api.POST("/v1/admin/students" as never, {
      headers: { "Idempotency-Key": key() },
      body: input,
    }),
  );
}
export async function updateAdminStudent(
  studentId: string,
  input: Record<string, unknown>,
) {
  const api = await requireApiClient();
  return unwrap<AdminStudentDetail>(
    api.PATCH("/v1/admin/students/{studentId}" as never, {
      params: { path: { studentId } },
      headers: { "Idempotency-Key": key() },
      body: input,
    }),
  );
}
export async function setAdminStudentStatus(
  studentId: string,
  status: "active" | "suspended" | "disabled",
  reason: string,
) {
  const api = await requireApiClient();
  return unwrap<Record<string, unknown>>(
    api.PATCH("/v1/admin/students/{studentId}/status" as never, {
      params: { path: { studentId } },
      headers: { "Idempotency-Key": key() },
      body: { status, reason },
    }),
  );
}
export async function resetAdminStudentClaim(
  studentId: string,
  reason: string,
) {
  const api = await requireApiClient();
  return unwrap<{
    accountIdentifier: string;
    setupCode: string;
    setupExpiresAt: string;
  }>(
    api.POST("/v1/admin/students/{studentId}/claim/reset" as never, {
      params: { path: { studentId } },
      headers: { "Idempotency-Key": key() },
      body: { reason },
    }),
  );
}

export async function revokeAdminStudentSessions(brandCode: "medway" | "elite" | "nexus", studentProfileId: string, reason: string) {
  const api = await requireApiClient();
  return unwrap<{ revoked: true }>(api.POST("/v1/admin/brands/{brandCode}/students/{studentProfileId}/sessions/revoke" as never, {
    params: { path: { brandCode, studentProfileId } },
    headers: { "Idempotency-Key": key() },
    body: { reason },
  }));
}

export async function revokeAdminStudentDevice(brandCode: "medway" | "elite" | "nexus", studentProfileId: string, deviceId: string, reason: string) {
  const api = await requireApiClient();
  return unwrap<{ revoked: true }>(api.POST("/v1/admin/brands/{brandCode}/students/{studentProfileId}/devices/{deviceId}/revoke" as never, {
    params: { path: { brandCode, studentProfileId, deviceId } },
    headers: { "Idempotency-Key": key() },
    body: { reason },
  }));
}

export async function authorizeAdminStudentDeviceReplacement(brandCode: "medway" | "elite" | "nexus", studentProfileId: string, deviceId: string, reason: string, expiresAt: string) {
  const api = await requireApiClient();
  return unwrap<{ overrideId: string; expiresAt: string }>(api.POST("/v1/admin/brands/{brandCode}/students/{studentProfileId}/devices/{deviceId}/replacement-override" as never, {
    params: { path: { brandCode, studentProfileId, deviceId } },
    headers: { "Idempotency-Key": key() },
    body: { reason, expiresAt },
  }));
}
