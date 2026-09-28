import { useEffect, useState, useCallback, useRef } from "react";
import type { Message, TypingPayload, UserStatusPayload, Attachment } from "../types/chat";
import { socketService, type ConnectionStatus } from "../shared/utils/socketService";

interface UseChatSocketProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  onNewMessage?: (message: Message) => void;
  onUserStatusChange?: (status: UserStatusPayload) => void;
  onTypingChange?: (typing: TypingPayload) => void;
}

export function useChatSocket({
  conversationId,
  currentUserId,
  currentUserName,
  onNewMessage,
  onUserStatusChange,
  onTypingChange,
}: UseChatSocketProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(socketService.getStatus());
  const [activeTypers, setActiveTypers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Monitor connection status
  useEffect(() => {
    socketService.connect();
    const unsub = socketService.onStatusChange((status: ConnectionStatus) => {
      setConnectionStatus(status);
    });

    return () => {
      unsub();
    };
  }, []);

  // Listen to real-time events
  useEffect(() => {
    const unsubNewMessage = socketService.on("new_message", (message: Message) => {
      if (message.conversationId === conversationId) {
        onNewMessage?.(message);
      }
    });

    const unsubUserStatus = socketService.on("user_status_changed", (status: UserStatusPayload) => {
      onUserStatusChange?.(status);
    });

    const unsubTyping = socketService.on("typing_indicator", (payload: TypingPayload) => {
      if (payload.conversationId === conversationId && payload.userId !== currentUserId) {
        setActiveTypers((prev) => {
          const next = new Map(prev);
          if (payload.isTyping) {
            next.set(payload.userId, payload.userName);
          } else {
            next.delete(payload.userId);
          }
          return next;
        });
        onTypingChange?.(payload);
      }
    });

    return () => {
      unsubNewMessage();
      unsubUserStatus();
      unsubTyping();
    };
  }, [conversationId, currentUserId, onNewMessage, onUserStatusChange, onTypingChange]);

  // Emit typing start / stop with debounce
  const handleUserTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.emitTypingStart(conversationId, currentUserId, currentUserName);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.emitTypingStop(conversationId, currentUserId);
    }, 2000);
  }, [conversationId, currentUserId, currentUserName]);

  const stopTypingImmediately = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.emitTypingStop(conversationId, currentUserId);
    }
  }, [conversationId, currentUserId]);

  const markConversationAsRead = useCallback(() => {
    socketService.emitMarkAsRead(conversationId, currentUserId);
  }, [conversationId, currentUserId]);

  /**
   * Send message with Optimistic UI:
   * 1. Returns a provisional message with status "sending"
   * 2. Calls the socket service ack
   * 3. On success, updates status to "sent"
   * 4. On failure, allows retry handler
   */
  const sendMessage = useCallback(
    async (
      text: string,
      attachments?: Attachment[],
      onOptimisticCreated?: (optimisticMsg: Message) => void,
      onResolved?: (status: "sent" | "failed", confirmedMsg?: Message) => void
    ) => {
      stopTypingImmediately();

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const now = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(new Date());

      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        text,
        timestamp: now,
        status: "sending",
        attachments,
      };

      // Notify caller immediately for instant UI update
      onOptimisticCreated?.(optimisticMessage);

      // Emit over WebSocket with acknowledgment callback
      socketService.emitSendMessage(
        {
          conversationId,
          text,
          senderId: currentUserId,
          attachments,
          tempId,
        },
        (ack: { status: "ok" | "error"; message?: Message; error?: string }) => {
          if (ack.status === "ok" && ack.message) {
            onResolved?.("sent", ack.message);
          } else {
            onResolved?.("failed");
          }
        }
      );
    },
    [conversationId, currentUserId, stopTypingImmediately]
  );

  return {
    connectionStatus,
    activeTypers: Array.from(activeTypers.values()),
    handleUserTyping,
    stopTypingImmediately,
    sendMessage,
    markConversationAsRead,
  };
}
