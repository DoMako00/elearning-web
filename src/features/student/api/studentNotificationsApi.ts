import { requireApiClient, extractApiErrorMessage } from "../../../app/api/client";

export interface StudentNotificationDto {
  id: string;
  type: "assignment" | "assessment" | "message" | "community" | "course" | "subscription" | "system";
  title: string;
  body: string;
  deepLink: string | null;
  createdAt: string;
  readAt: string | null;
}

interface ApiEnvelope<T> { ok: true; correlationId: string; data: T; }

async function request<T>(method: "GET" | "PATCH", path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = method === "GET"
    ? await client.getJson<ApiEnvelope<T>>(path, { signal })
    : await client.writeJson<ApiEnvelope<T>>(method, path, body, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Notifications could not be loaded."));
  if (!result.data) throw new Error("The notification API returned an incomplete response.");
  return result.data.data;
}

export const studentNotificationsApi = {
  list(signal?: AbortSignal) {
    return request<StudentNotificationDto[]>("GET", "/v1/student/notifications", undefined, signal);
  },
  markRead(notificationId: string, signal?: AbortSignal) {
    return request<{ updatedCount: number }>("PATCH", "/v1/student/notifications/read", { notificationId }, signal);
  },
  markAllRead(signal?: AbortSignal) {
    return request<{ updatedCount: number }>("PATCH", "/v1/student/notifications/read", { all: true }, signal);
  },
};
