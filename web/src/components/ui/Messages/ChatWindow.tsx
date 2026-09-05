import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  X,
  FileText,
  ChevronLeft,
} from "lucide-react";
import type { Conversation, Message, Attachment } from "../../../types/chat";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onUserTyping?: () => void;
  activeTypers: string[];
  onRetryMessage?: (messageId: string) => void;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
  onMoreActions?: () => void;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onUserTyping,
  activeTypers,
  onRetryMessage,
  onVideoCall,
  onAudioCall,
  onMoreActions,
  onBack,
}) => {
  const [inputText, setInputText] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTypers]);

  const handleSend = () => {
    if (!inputText.trim() && pendingAttachments.length === 0) return;

    onSendMessage(inputText, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setInputText("");
    setPendingAttachments([]);
    setIsEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onUserTyping?.();
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAtts: Attachment[] = Array.from(files).map((file, idx) => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = Number(sizeMb) > 0.1 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      return {
        id: `upload-${Date.now()}-${idx}`,
        name: file.name,
        size: sizeStr,
        type: file.name.endsWith(".pdf") ? "pdf" : "doc",
        url: URL.createObjectURL(file),
        uploadedAt: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: true }).format(new Date()),
      };
    });

    setPendingAttachments((prev) => [...prev, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd] min-w-0 flex-1 relative select-none">
      {/* 1. Header Bar */}
      <div className="h-16 border-b border-[#e8ecef] px-3.5 sm:px-5 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back button for responsive tablet/mobile view */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="chat-back-btn mr-0.5 p-1.5 -ml-1 rounded-xl text-[#64748b] hover:text-[#20a862] hover:bg-[#f1f5f3] transition-colors shrink-0 flex items-center justify-center"
              title="Back to conversations"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative shrink-0">
            {conversation.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt={conversation.title}
                className="w-10 h-10 rounded-full object-cover shadow-2xs"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: conversation.avatarBg || "#d2ecd9",
                  color: "#166534",
                }}
              >
                {conversation.initials || conversation.title.substring(0, 2).toUpperCase()}
              </div>
            )}
            {conversation.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#20a862] border-2 border-white rounded-full" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[14.5px] font-bold text-slate-900 truncate">
                {conversation.title}
              </h2>
              {conversation.isOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#20a862] inline-block" />
              )}
            </div>
            <p className="text-[11.5px] text-[#64748b] truncate">
              {conversation.recipient.role || "Instructor"} •{" "}
              <span className={conversation.isOnline ? "text-[#20a862] font-medium" : "text-[#94a3b8]"}>
                {conversation.isOnline ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#64748b]">
          <button
            type="button"
            onClick={onVideoCall}
            className="p-2 rounded-xl hover:bg-[#f1f5f3] hover:text-[#20a862] transition-colors"
            title="Start video call"
            aria-label="Start video call"
          >
            <Video className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={onAudioCall}
            className="p-2 rounded-xl hover:bg-[#f1f5f3] hover:text-[#20a862] transition-colors"
            title="Start audio call"
            aria-label="Start audio call"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={onMoreActions}
            className="p-2 rounded-xl hover:bg-[#f1f5f3] hover:text-[#20a862] transition-colors"
            title="More options"
            aria-label="More options"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#fbfdfc]">
        {/* Date Divider badge */}
        <div className="flex items-center justify-center my-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-[#64748b] text-[11px] font-medium tracking-wide">
            Today
          </span>
        </div>

        {/* Feed List */}
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === currentUserId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={isCurrentUser}
              recipientAvatar={conversation.avatarUrl}
              recipientInitials={conversation.initials}
              onRetry={onRetryMessage}
            />
          );
        })}

        {/* Live Typing Indicator */}
        {activeTypers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#64748b] pl-2 animate-pulse">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-[#20a862] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-[#20a862] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#20a862] rounded-full animate-bounce" />
            </span>
            <span>{activeTypers.join(", ")} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Attachments Staging Strip */}
      {pendingAttachments.length > 0 && (
        <div className="px-5 py-2 bg-[#f0f9f4] border-t border-[#d2ecd9] flex items-center gap-2 overflow-x-auto">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#20a862]/30 text-xs shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-35 font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => removePendingAttachment(att.id)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. Input Toolbar */}
      <div className="p-4 bg-white border-t border-[#e8ecef] shrink-0">
        <div className="flex items-center gap-2 bg-[#f8faf9] border border-[#e5ebe7] rounded-2xl px-3 py-2 focus-within:border-[#20a862] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#20a862]/10 transition-all">
          {/* Attachment Clip */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl text-[#64748b] hover:text-[#20a862] hover:bg-[#eff9f2] transition-colors"
            title="Attach diagram or document"
            aria-label="Attach diagram or document"
          >
            <Paperclip className="w-4.5 h-4.5 -rotate-45" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileAttach}
          />

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-[13.5px] text-slate-800 placeholder-[#94a3b8] focus:outline-none px-2"
          />

          {/* Emoji Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              className="p-1.5 rounded-xl text-[#64748b] hover:text-[#20a862] hover:bg-[#eff9f2] transition-colors"
              title="Insert emoji"
              aria-label="Insert emoji"
            >
              <Smile className="w-4.5 h-4.5" />
            </button>

            {/* Quick Emoji Popup */}
            {isEmojiPickerOpen && (
              <div className="absolute bottom-10 right-0 bg-white border border-[#e5ebe7] rounded-xl shadow-lg p-2 flex gap-1 z-30">
                {["👍", "👏", "🔥", "💡", "🙌", "🩺", "📚"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="p-1 text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() && pendingAttachments.length === 0}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              inputText.trim() || pendingAttachments.length > 0
                ? "bg-[#20a862] text-white hover:bg-[#188a50] shadow-sm hover:scale-105 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
