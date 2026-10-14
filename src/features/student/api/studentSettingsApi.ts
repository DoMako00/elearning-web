import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export interface StudentSafeDeviceDto {
  id: string;
  slot: "mobile" | "secondary" | null;
  platform: string | null;
  browser: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
}

export interface StudentSafeSessionDto {
  id: string;
  deviceId: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  device: StudentSafeDeviceDto;
}

export interface StudentCommercialSettingsDto {
  semesterOffering: { id: string; code: string; title: string } | null;
  subscriptionStatus: "active" | "cancelled" | "expired" | null;
  subscriptionStartsAt: string | null;
  subscriptionEndsAt: string | null;
  seatStatus: "assigned" | null;
  seatIndex: number | null;
  hasActiveSeat: boolean;
  canAccess: boolean;
}

interface Envelope<T> { ok: true; correlationId: string; data: T }

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const api = await requireApiClient();
  const result = await api.getJson<Envelope<T>>(path, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Student settings could not be loaded."));
  if (!result.data) throw new Error("The Student settings API returned an incomplete response.");
  return result.data.data;
}

async function post<T>(path: string): Promise<T> {
  const api = await requireApiClient();
  const result = await api.writeJson<Envelope<T>>("POST", path, {});
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "The session could not be ended."));
  if (!result.data) throw new Error("The session API returned an incomplete response.");
  return result.data.data;
}

export const studentSettingsApi = {
  listDevices(signal?: AbortSignal) { return get<StudentSafeDeviceDto[]>("/v1/devices", signal); },
  currentSession(signal?: AbortSignal) { return get<StudentSafeSessionDto>("/v1/sessions/current", signal); },
  commercial(signal?: AbortSignal) { return get<StudentCommercialSettingsDto>("/v1/student/commercial", signal); },
  logoutCurrentSession() { return post<unknown>("/v1/sessions/logout"); },
  revokeOtherSessions() { return post<{ revoked: true }>("/v1/sessions/revoke-others"); },
};
