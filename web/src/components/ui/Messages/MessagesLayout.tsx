import React, { useState, useCallback, useEffect } from "react";
import type {
  Conversation,
  ConversationFilter,
  Message,
  Attachment,
  UserStatusPayload,
} from "../../../types/chat";
import {
  CURRENT_USER,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES_MAP,
} from "./messages.data";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { ChatContextSidebar } from "./ChatContextSidebar";
import { useChatSocket } from "../../../hooks/useChatSocket";
import "./Messages.css";

export const MessagesLayout: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>("c1");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(INITIAL_MESSAGES_MAP);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<ConversationFilter>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Socket Integration Hook
  const {
    activeTypers,
    handleUserTyping,
    sendMessage: socketSendMessage,
    markConversationAsRead,
  } = useChatSocket({
    conversationId: activeConversationId,
    currentUserId: CURRENT_USER.id,
    currentUserName: CURRENT_USER.name,
    onNewMessage: useCallback(
      (incomingMsg: Message) => {
        setMessagesMap((prev) => {
          const list = prev[incomingMsg.conversationId] || [];
          if (list.some((m) => m.id === incomingMsg.id)) return prev;
          return {
            ...prev,
            [incomingMsg.conversationId]: [...list, incomingMsg],
          };
        });

        // Update conversation preview snippet
        setConversations((prev) =>
          prev.map((c) =>
            c.id === incomingMsg.conversationId
              ? {
                  ...c,
                  lastMessage: {
                    text: incomingMsg.text || "Sent an attachment",
                    timestamp: incomingMsg.timestamp,
                    senderId: incomingMsg.senderId,
                  },
                  unreadCount:
                    c.id === activeConversationId ? 0 : c.unreadCount + 1,
                }
              : c
          )
        );
      },
      [activeConversationId]
    ),
    onUserStatusChange: useCallback((statusPayload: UserStatusPayload) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.recipient.id === statusPayload.userId
            ? {
                ...c,
                isOnline: statusPayload.status === "online",
                status: statusPayload.status,
              }
            : c
        )
      );
    }, []),
  });

  // When active conversation changes, mark as read
  useEffect(() => {
    markConversationAsRead();
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeConversationId, markConversationAsRead]);

  // Handle Send with Optimistic UI updates
  const handleSendMessage = useCallback(
    (text: string, attachments?: Attachment[]) => {
      socketSendMessage(
        text,
        attachments,
        // 1. Optimistic insert
        (optimisticMsg) => {
          setMessagesMap((prev) => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMsg],
          }));

          // Update conversation list preview
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? {
                    ...c,
                    lastMessage: {
                      text: text || "Sent an attachment",
                      timestamp: optimisticMsg.timestamp,
                      senderId: CURRENT_USER.id,
                    },
                  }
                : c
            )
          );
        },
        // 2. Server/Socket ACK resolved
        (status, confirmedMsg) => {
          if (status === "sent" && confirmedMsg) {
            setMessagesMap((prev) => ({
              ...prev,
              [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
                m.id === confirmedMsg.id ? confirmedMsg : m
              ),
            }));
          } else if (status === "failed") {
            // Mark failed for retry
            setMessagesMap((prev) => ({
              ...prev,
              [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
                m.status === "sending" ? { ...m, status: "failed" } : m
              ),
            }));
          }
        }
      );
    },
    [activeConversationId, socketSendMessage]
  );

  const handleRetryMessage = (messageId: string) => {
    const targetMsg = (messagesMap[activeConversationId] || []).find((m) => m.id === messageId);
    if (!targetMsg) return;

    // Retry sending
    handleSendMessage(targetMsg.text, targetMsg.attachments);
    // Remove failed version
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).filter((m) => m.id !== messageId),
    }));
  };

  const handleNewMessageClick = () => {
    showToast("Starting a new message composition...");
  };

  return (
    <div className="messages-module h-full w-full flex overflow-hidden bg-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 bg-[#174b35] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg border border-[#20a862]/30 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Column 1: Conversations Sidebar (~320px) */}
      <div className="w-[320px] shrink-0 h-full flex flex-col">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(conv) => setActiveConversationId(conv.id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          onNewMessageClick={handleNewMessageClick}
        />
      </div>

      {/* Column 2: Active Chat Window (Flex-1) */}
      <div className="flex-1 min-w-0 h-full flex flex-col">
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messagesMap[activeConversationId] || []}
            currentUserId={CURRENT_USER.id}
            onSendMessage={handleSendMessage}
            onUserTyping={handleUserTyping}
            activeTypers={activeTypers}
            onRetryMessage={handleRetryMessage}
            onVideoCall={() => showToast(`Initiating video call with ${activeConversation.title}...`)}
            onAudioCall={() => showToast(`Calling ${activeConversation.title}...`)}
            onMoreActions={() => showToast("Conversation settings & options")}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* Column 3: Context & Info Sidebar (~280px) */}
      {activeConversation && (
        <div className="w-70 shrink-0 h-full hidden lg:flex flex-col">
          <ChatContextSidebar
            conversation={activeConversation}
            onViewProfile={() => showToast(`Opening ${activeConversation.recipient.name}'s profile...`)}
            onSearchInChat={() => showToast("Search within this conversation")}
            onMute={() => showToast(`Muted notifications for ${activeConversation.title}`)}
            onArchive={() => showToast(`Archived conversation with ${activeConversation.title}`)}
            onBlock={() => showToast(`Blocked ${activeConversation.title}`)}
            onFileClick={(file) => showToast(`Opening file: ${file.name}`)}
          />
        </div>
      )}
    </div>
  );
};
