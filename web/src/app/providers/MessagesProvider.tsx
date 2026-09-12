import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type PropsWithChildren,
} from "react";
import type { Conversation } from "../../types/chat";
import { INITIAL_CONVERSATIONS } from "../../components/ui/Messages/messages.data";

interface MessagesContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  /** Number of chats that have at least one unread message */
  unreadChatsCount: number;
  /** Mark a single conversation as fully read */
  markAsRead: (conversationId: string) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: PropsWithChildren) {
  const [conversations, setConversations] =
    useState<Conversation[]>(INITIAL_CONVERSATIONS);

  const unreadChatsCount = useMemo(
    () => conversations.filter((c) => c.unreadCount > 0).length,
    [conversations]
  );

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  return (
    <MessagesContext.Provider
      value={{ conversations, setConversations, unreadChatsCount, markAsRead }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error("useMessages must be used inside <MessagesProvider>");
  }
  return ctx;
}
