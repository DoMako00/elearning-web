import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type PropsWithChildren,
} from "react";
import type { Conversation, Message, Attachment } from "../../../types/chat";
import {
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES_MAP,
  CURRENT_USER,
} from "../../ui/Messages/messages.data";

interface MobileMessagesContextValue {
  conversations: Conversation[];
  unreadChatsCount: number;
  messagesMap: Record<string, Message[]>;
  getConversationById: (id: string) => Conversation | undefined;
  getMessagesByConversationId: (id: string) => Message[];
  markAsRead: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    text: string,
    attachments?: Attachment[]
  ) => void;
}

const MobileMessagesContext = createContext<MobileMessagesContextValue | null>(
  null
);

export const MobileMessagesProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [conversations, setConversations] =
    useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messagesMap, setMessagesMap] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES_MAP);

  const unreadChatsCount = useMemo(
    () => conversations.filter((c) => c.unreadCount > 0).length,
    [conversations]
  );

  const getConversationById = useCallback(
    (id: string) => {
      return conversations.find((c) => c.id === id);
    },
    [conversations]
  );

  const getMessagesByConversationId = useCallback(
    (id: string) => {
      return messagesMap[id] || [];
    },
    [messagesMap]
  );

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  const sendMessage = useCallback(
    (
      conversationId: string,
      text: string,
      attachments?: Attachment[]
    ) => {
      const now = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(new Date());

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: CURRENT_USER.id,
        text,
        timestamp: now,
        status: "read",
        attachments,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: {
                text: text || (attachments && attachments.length > 0 ? attachments[0].name : "Attachment"),
                timestamp: now,
                senderId: CURRENT_USER.id,
              },
            };
          }
          return c;
        })
      );
    },
    []
  );

  return (
    <MobileMessagesContext.Provider
      value={{
        conversations,
        unreadChatsCount,
        messagesMap,
        getConversationById,
        getMessagesByConversationId,
        markAsRead,
        sendMessage,
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
