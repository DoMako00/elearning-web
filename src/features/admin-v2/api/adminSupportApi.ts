import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

interface Envelope<T> { ok: true; correlationId: string; data: T }
export interface AdminSupportConversation {
  conversationId: string; subject: string | null; status: "open" | "closed" | "archived"; version: number;
  createdAt: string; updatedAt: string; studentProfileId: string; studentName: string | null;
  lastMessageId: string | null; lastMessageBody: string | null; lastMessageAt: string | null; lastMessageSender: string | null; unreadCount: number;
}
export interface AdminSupportMessage { id: string; body: string; createdAt: string; senderName: string; senderStudentProfileId: string | null; senderRole: "student" | "admin" | null }
export interface AdminSupportConversationDetail { conversation: { id: string; status: "open" | "closed" | "archived"; version: number }; items: AdminSupportMessage[] }

async function request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const api = await requireApiClient();
  const result = method === "GET" ? await api.getJson<Envelope<T>>(path) : await api.writeJson<Envelope<T>>(method, path, body, { headers });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Support Inbox request failed."));
  if (!result.data) throw new Error("The Support Inbox API returned an incomplete response.");
  return result.data.data;
}

export const adminSupportApi = {
  list: () => request<{ items: AdminSupportConversation[] }>("GET", "/v1/admin/support/conversations"),
  detail: (conversationId: string) => request<AdminSupportConversationDetail>("GET", `/v1/admin/support/conversations/${encodeURIComponent(conversationId)}/messages`),
  markRead: (conversationId: string) => request<{ conversationId: string; readAt: string }>("PATCH", `/v1/admin/support/conversations/${encodeURIComponent(conversationId)}/read`, undefined, { "Idempotency-Key": crypto.randomUUID() }),
  reply: (conversationId: string, body: string, expectedVersion: number) => request<{ conversationId: string; message: AdminSupportMessage; version: number }>("POST", `/v1/admin/support/conversations/${encodeURIComponent(conversationId)}/messages`, { messageId: crypto.randomUUID(), body, expectedVersion }, { "Idempotency-Key": crypto.randomUUID() }),
};
