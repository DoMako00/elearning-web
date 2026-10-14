import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export interface StudentMessageContactDto { studentProfileId: string; fullName: string }
export interface StudentConversationMessageDto { id: string; senderProfileId: string | null; senderName: string; body: string; createdAt: string }
export interface StudentConversationSummaryDto {
  id: string;
  type: "student_peer" | "admin_support";
  title: string;
  participantProfileId: string | null;
  lastMessage: null | { id: string; body: string; senderName: string; createdAt: string };
  unreadCount: number;
  updatedAt: string;
  status: "open" | "closed" | "archived";
}
interface Envelope<T> { ok: true; correlationId: string; data: T }

async function request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const api = await requireApiClient();
  const result = method === "GET"
    ? await api.getJson<Envelope<T>>(path, { signal })
    : await api.writeJson<Envelope<T>>(method, path, body, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Messages could not be loaded."));
  if (!result.data) throw new Error("The Messages API returned an incomplete response.");
  return result.data.data;
}

export const studentMessagesApi = {
  listContacts: (signal?: AbortSignal) => request<StudentMessageContactDto[]>("GET", "/v1/student/messages/contacts", undefined, signal),
  listConversations: (signal?: AbortSignal) => request<StudentConversationSummaryDto[]>("GET", "/v1/student/messages/conversations", undefined, signal),
  listMessages: (conversationId: string, signal?: AbortSignal) => request<StudentConversationMessageDto[]>("GET", `/v1/student/messages/conversations/${encodeURIComponent(conversationId)}/messages`, undefined, signal),
  startPeerConversation: (recipientStudentProfileId: string) => request<StudentConversationSummaryDto>("POST", "/v1/student/messages/conversations", { id: crypto.randomUUID(), recipientStudentProfileId }),
  startSupportConversation: (input: { subject: string; body: string }) => request<StudentConversationSummaryDto>("POST", "/v1/student/messages/support", { conversationId: crypto.randomUUID(), messageId: crypto.randomUUID(), ...input }),
  sendMessage: (conversationId: string, body: string) => request<StudentConversationMessageDto>("POST", `/v1/student/messages/conversations/${encodeURIComponent(conversationId)}/messages`, { id: crypto.randomUUID(), body }),
  markRead: (conversationId: string) => request<{ conversationId: string; readAt: string }>("PATCH", `/v1/student/messages/conversations/${encodeURIComponent(conversationId)}/read`),
};
