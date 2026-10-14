import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentMessagesApi } from "./studentMessagesApi";

export const studentMessagesKeys = {
  contacts: ["student", "messages", "contacts"] as const,
  conversations: ["student", "messages", "conversations"] as const,
  messages: (conversationId: string) => ["student", "messages", "conversation", conversationId] as const,
};

export function useStudentMessageContacts() {
  const auth = useAuth();
  return useQuery({ queryKey: studentMessagesKeys.contacts, queryFn: ({ signal }) => studentMessagesApi.listContacts(signal), enabled: auth.status === "authenticated" });
}
export function useStudentConversations() {
  const auth = useAuth();
  return useQuery({ queryKey: studentMessagesKeys.conversations, queryFn: ({ signal }) => studentMessagesApi.listConversations(signal), enabled: auth.status === "authenticated" });
}
export function useStudentConversationMessages(conversationId: string | null) {
  const auth = useAuth();
  return useQuery({ queryKey: studentMessagesKeys.messages(conversationId ?? ""), queryFn: ({ signal }) => studentMessagesApi.listMessages(conversationId!, signal), enabled: auth.status === "authenticated" && Boolean(conversationId) });
}
export function useStudentMessageMutations() {
  const client = useQueryClient();
  const reconcile = async (conversationId?: string) => Promise.all([
    client.invalidateQueries({ queryKey: studentMessagesKeys.conversations }),
    ...(conversationId ? [client.invalidateQueries({ queryKey: studentMessagesKeys.messages(conversationId) })] : []),
  ]);
  const startPeer = useMutation({ mutationFn: (profileId: string) => studentMessagesApi.startPeerConversation(profileId), onSuccess: async () => reconcile() });
  const startSupport = useMutation({ mutationFn: (input: { subject: string; body: string }) => studentMessagesApi.startSupportConversation(input), onSuccess: async () => reconcile() });
  const send = useMutation({ mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) => studentMessagesApi.sendMessage(conversationId, body), onSuccess: async (_value, input) => reconcile(input.conversationId) });
  const markRead = useMutation({ mutationFn: (conversationId: string) => studentMessagesApi.markRead(conversationId), onSuccess: async (_value, conversationId) => reconcile(conversationId) });
  return { startPeer, startSupport, send, markRead };
}
