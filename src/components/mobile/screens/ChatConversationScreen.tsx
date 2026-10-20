import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../../../hooks/useToast";
import {
  Video,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Download,
  FileText,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import { useMobileMessages } from "../data/useMobileMessages";
import { MobileToast } from "../shared/MobileToast";
import { useStudentConversationMessages, useStudentMessageMutations } from "../../../features/student/api/useStudentMessages";
import { mapStudentMessage } from "../../../features/student/api/studentMessagesMapper";

export interface ChatConversationScreenProps {
  conversationId: string;
  initialName?: string;
  initialRole?: string;
  initialAvatar?: string;
  initialInitials?: string;
  backLabel?: string;
}

export const ChatConversationScreen: React.FC<ChatConversationScreenProps> = ({
  conversationId,
  initialName,
  initialRole,
  initialAvatar,
  initialInitials,
  backLabel = "Back",
}) => {
  const { pop } = useScreenStack();
  const { conversations, currentUserId } = useMobileMessages();
  const messagesQuery = useStudentConversationMessages(conversationId);
  const messagesMutations = useStudentMessageMutations();

  const [inputText, setInputText] = useState("");
  const { toastMessage, toastTone, showToast } = useToast(2500);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((item) => item.id === conversationId);
  const messages = (messagesQuery.data ?? []).map((item) => mapStudentMessage(item, conversationId));

  const name = conversation?.title || initialName || "Conversation";
  const role =
    conversation?.recipient?.role ||
    initialRole ||
    (conversation?.type === "group" ? "Group Chat" : "Contact");
  const avatarUrl = conversation?.avatarUrl || initialAvatar;
  const initials =
    conversation?.initials ||
    initialInitials ||
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const isOnline = conversation?.isOnline ?? false;

  // Mark as read when opened
  useEffect(() => {
    void messagesMutations.markRead.mutateAsync(conversationId).catch(() => undefined);
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSend = () => {
    if (!inputText.trim()) return;
    void messagesMutations.send.mutateAsync({ conversationId, body: inputText.trim() }).then(() => setInputText("")).catch((error: unknown) => showToast(error instanceof Error ? error.message : "Message could not be sent.", "error"));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) showToast("File attachments are not supported by the current messaging API.", "info");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50">
      <MobileToast message={toastMessage} tone={toastTone} />

      {/* Detail TopAppBar */}
      <TopAppBar
        variant="detail"
        title={name}
        backLabel={backLabel}
        onBack={pop}
        rightSlot={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => showToast("Not available on mobile", "info")}
              aria-label="Start video call"
              className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => showToast("Not available on mobile", "info")}
              aria-label="Start audio call"
              className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => showToast("Not available on mobile", "info")}
              aria-label="More actions"
              className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Sub-header with interlocutor status */}
      <div className="bg-white/90 backdrop-blur-xs border-b border-slate-100 px-4 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center ring-1 ring-emerald-200">
                {initials}
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-900 truncate leading-tight">
              {name}
            </h2>
            <p className="text-[10.5px] text-slate-500 truncate leading-tight mt-0.5">
              {role} {isOnline ? "• Online" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messagesQuery.isPending && <p role="status" className="py-6 text-center text-xs text-slate-400">Loading saved messages…</p>}
        {messagesQuery.isError && <p role="alert" className="py-6 text-center text-xs text-rose-600">Messages could not be loaded.</p>}
        {!messagesQuery.isPending && !messagesQuery.isError && messages.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No messages yet. Send the first message to begin.</p>}
        {/* Date Divider */}
        {messages.length > 0 && <div className="flex justify-center my-2"><span className="px-3 py-0.5 rounded-full bg-slate-200/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Conversation history</span></div>}

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 w-full ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {/* Their Avatar */}
              {!isMe && (
                <div className="shrink-0 mb-0.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl p-3 shadow-2xs text-xs ${
                  isMe
                    ? "bg-emerald-600 text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs"
                }`}
              >
                {/* Text */}
                {msg.text && (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`space-y-1.5 ${msg.text ? "mt-2" : ""}`}>
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                          isMe
                            ? "bg-emerald-700/60 border-emerald-500/80 text-white"
                            : "bg-slate-50 border-slate-200/90 text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isMe
                              ? "bg-white/15 text-white"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-[11.5px] font-bold truncate leading-tight">
                            {att.name}
                          </p>
                          <p
                            className={`text-[9.5px] mt-0.5 ${
                              isMe ? "text-emerald-100/80" : "text-slate-400"
                            }`}
                          >
                            {att.size}
                          </p>
                        </div>
                        <a
                          href={att.url}
                          download={att.name}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isMe
                              ? "text-emerald-100 hover:text-white hover:bg-emerald-600/60"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="Download attachment"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp & read receipts */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isMe ? "text-emerald-100/90 font-medium" : "text-slate-400"
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span className="font-bold text-[11px] leading-none">
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Input for Paperclip */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileAttach}
        className="hidden"
        accept=".pdf,.doc,.docx,.pptx,.png,.jpg"
      />

      {/* Bottom Chat Input Bar - stays pinned at the bottom on top of bottom bar */}
      <div className="shrink-0 sticky bottom-0 z-20 p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-1.5 shadow-md">
        <button
          type="button"
          disabled
          aria-label="Attach document"
          title="File attachments are not supported by the current messaging API"
          className="p-2 text-slate-400 rounded-xl transition-colors shrink-0 cursor-not-allowed opacity-45"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
        />

        <button
          type="button"
          onClick={() => showToast("Emoji picker not available on mobile", "info")}
          aria-label="Add emoji"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          <Smile className="w-4.5 h-4.5" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || messagesMutations.send.isPending}
          aria-label="Send message"
          className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
            inputText.trim() && !messagesMutations.send.isPending
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
