import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { adminSupportApi } from "./adminSupportApi";

export const adminSupportKeys = {
  conversations: ["admin", "support", "conversations"] as const,
  messages: (id: string) => ["admin", "support", "conversation", id] as const,
};

export function useAdminSupportConversations() {
  const auth = useAuth();
  return useQuery({ queryKey: adminSupportKeys.conversations, queryFn: async () => (await adminSupportApi.list()).items, enabled: auth.status === "authenticated" });
}
export function useAdminSupportMessages(id: string | null) {
  const auth = useAuth();
  return useQuery({ queryKey: adminSupportKeys.messages(id ?? ""), queryFn: () => adminSupportApi.detail(id!), enabled: auth.status === "authenticated" && Boolean(id) });
}
export function useAdminSupportActions() {
  const client = useQueryClient();
  const reconcile = (id?: string) => Promise.all([
    client.invalidateQueries({ queryKey: adminSupportKeys.conversations }),
    ...(id ? [client.invalidateQueries({ queryKey: adminSupportKeys.messages(id) })] : []),
  ]);
  return {
    markRead: useMutation({ mutationFn: adminSupportApi.markRead, onSuccess: async (_result, id) => reconcile(id) }),
    reply: useMutation({ mutationFn: ({ id, body, expectedVersion }: { id: string; body: string; expectedVersion: number }) => adminSupportApi.reply(id, body, expectedVersion), onSuccess: async (_result, input) => reconcile(input.id) }),
  };
}
