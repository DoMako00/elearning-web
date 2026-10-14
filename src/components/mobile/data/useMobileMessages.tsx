import React, { createContext, useContext, type PropsWithChildren } from "react";
import type { Conversation } from "../../../types/chat";
import { useStudentConversations } from "../../../features/student/api/useStudentMessages";
import { useStudentProfile } from "../../../features/student/api/useStudentLearning";
import { mapStudentConversation } from "../../../features/student/api/studentMessagesMapper";

interface MobileMessagesContextValue {
  conversations: Conversation[];
  unreadChatsCount: number;
  currentUserId: string;
  currentUserName: string;
  isPending: boolean;
  isError: boolean;
}

const MobileMessagesContext = createContext<MobileMessagesContextValue | null>(
  null
);

export const MobileMessagesProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const conversationsQuery = useStudentConversations();
  const profileQuery = useStudentProfile();
  const currentUserId = profileQuery.data?.studentProfileId ?? "";
  const currentUserName = profileQuery.data?.fullName ?? "Student";
  const conversations = (conversationsQuery.data ?? []).map((item) => mapStudentConversation(item, currentUserId, currentUserName));

  return (
    <MobileMessagesContext.Provider
      value={{
        conversations,
        unreadChatsCount: conversations.filter((conversation) => conversation.unreadCount > 0).length,
        currentUserId,
        currentUserName,
        isPending: conversationsQuery.isPending || profileQuery.isPending,
        isError: conversationsQuery.isError || profileQuery.isError,
      }}
    >
      {children}
    </MobileMessagesContext.Provider>
  );
};

export const useMobileMessages = (): MobileMessagesContextValue => {
  const ctx = useContext(MobileMessagesContext);
  if (!ctx) {
    throw new Error(
      "useMobileMessages must be used within <MobileMessagesProvider>"
    );
  }
  return ctx;
};
