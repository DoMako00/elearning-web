export interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  initials?: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen?: string;
  institution?: string;
  department?: string;
  email?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string; // e.g., "2.4 MB"
  bytes?: number;
  type: "pdf" | "image" | "doc" | "archive" | "audio" | "other";
  url: string;
  uploadedAt: string;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string; // formatted e.g. "10:30 AM" or ISO
  status: MessageStatus;
  attachments?: Attachment[];
  replyToMessageId?: string;
}

export type ConversationType = "direct" | "instructor" | "group";

export interface CourseContext {
  courseId: string;
  courseTitle: string; // e.g. "Human Anatomy I"
  courseSubtitle?: string; // e.g. "Structure & Organization"
  statusBadge?: string; // e.g. "In progress"
  currentModule: string; // e.g. "Module 2: Upper Limb"
  currentLesson: string; // e.g. "Lesson: Brachial Plexus & Nerves"
  lessonCountText?: string; // e.g. "6 lessons"
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string; // user name or group name
  avatarUrl?: string;
  initials?: string;
  avatarBg?: string; // custom background tint for initials/icons
  isOnline?: boolean;
  status?: "online" | "offline" | "away";
  unreadCount: number;
  lastMessage: {
    text: string;
    timestamp: string; // e.g. "10:35 AM", "Yesterday", "Aug 25"
    senderId?: string;
    isDraft?: boolean;
  };
  participants: User[];
  recipient: User; // primary other party in 1:1 or group representative
  courseContext?: CourseContext;
  sharedFiles?: Attachment[];
  pinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
}

export type ConversationFilter = "all" | "unread" | "instructors" | "groups";

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface UserStatusPayload {
  userId: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
}

export interface MarkAsReadPayload {
  conversationId: string;
  messageId?: string;
  userId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
  senderId: string;
  attachments?: Attachment[];
  tempId?: string;
}

export interface SocketEventMap {
  // Client to Server
  send_message: (payload: SendMessagePayload, ack?: (response: { status: "ok" | "error"; message?: Message; error?: string }) => void) => void;
  typing_start: (payload: { conversationId: string; userId: string; userName: string }) => void;
  typing_stop: (payload: { conversationId: string; userId: string }) => void;
  mark_as_read: (payload: MarkAsReadPayload) => void;

  // Server to Client
  new_message: (message: Message) => void;
  user_status_changed: (payload: UserStatusPayload) => void;
  message_read: (payload: { conversationId: string; messageId?: string; readAt: string }) => void;
  typing_indicator: (payload: TypingPayload) => void;
}
