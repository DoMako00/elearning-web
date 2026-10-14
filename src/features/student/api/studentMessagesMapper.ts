import type { Conversation, Message, User } from "../../../types/chat";
import type { StudentConversationMessageDto, StudentConversationSummaryDto } from "./studentMessagesApi";

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

export function mapStudentConversation(dto: StudentConversationSummaryDto, currentProfileId: string, currentName: string): Conversation {
  const recipient: User = {
    id: dto.participantProfileId ?? `support-${dto.id}`,
    name: dto.title,
    role: dto.type === "admin_support" ? "Student Support" : "Student",
    initials: dto.title.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    status: "offline",
    institution: undefined,
  };
  const me: User = { id: currentProfileId, name: currentName, role: "Student", status: "offline" };
  return {
    id: dto.id,
    type: dto.type === "admin_support" ? "support" : "direct",
    title: dto.title,
    initials: recipient.initials,
    avatarBg: "#d2ecd9",
    isOnline: false,
    status: "offline",
    unreadCount: dto.unreadCount,
    lastMessage: { text: dto.lastMessage?.body ?? "No messages yet", timestamp: dto.lastMessage ? formatMessageTime(dto.lastMessage.createdAt) : "", senderId: dto.lastMessage?.senderName === "You" ? currentProfileId : recipient.id },
    participants: [me, recipient],
    recipient,
  };
}

export function mapStudentMessage(dto: StudentConversationMessageDto, conversationId: string): Message {
  return { id: dto.id, conversationId, senderId: dto.senderProfileId ?? `support-${conversationId}`, text: dto.body, timestamp: formatMessageTime(dto.createdAt), status: "sent" };
}
