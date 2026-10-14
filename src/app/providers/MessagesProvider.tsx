import { createContext, useContext, type PropsWithChildren } from "react";
import type { Conversation } from "../../types/chat";
import { useStudentConversations } from "../../features/student/api/useStudentMessages";
import { useStudentProfile } from "../../features/student/api/useStudentLearning";
import { mapStudentConversation } from "../../features/student/api/studentMessagesMapper";

interface MessagesContextValue {
  conversations: Conversation[];
  unreadChatsCount: number;
  currentUserId: string;
  currentUserName: string;
  isPending: boolean;
  isError: boolean;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: PropsWithChildren) {
  const conversationQuery = useStudentConversations();
  const profileQuery = useStudentProfile();
  const currentUserId = profileQuery.data?.studentProfileId ?? "";
  const currentUserName = profileQuery.data?.fullName ?? "Student";
  const conversations = (conversationQuery.data ?? []).map((item) => mapStudentConversation(item, currentUserId, currentUserName));
  const value: MessagesContextValue = {
    conversations,
    unreadChatsCount: conversations.filter((conversation) => conversation.unreadCount > 0).length,
    currentUserId,
    currentUserName,
    isPending: conversationQuery.isPending || profileQuery.isPending,
    isError: conversationQuery.isError || profileQuery.isError,
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages(): MessagesContextValue {
  const context = useContext(MessagesContext);
  if (!context) throw new Error("useMessages must be used inside <MessagesProvider>");
  return context;
}
