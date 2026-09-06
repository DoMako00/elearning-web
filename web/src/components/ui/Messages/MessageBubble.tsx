import React from "react";
import { Check, CheckCheck, Clock, AlertCircle, FileText, Download } from "lucide-react";
import type { Message, Attachment } from "../../../types/chat";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  recipientAvatar?: string;
  recipientInitials?: string;
  onRetry?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  recipientAvatar,
  recipientInitials = "AH",
  onRetry,
}) => {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasText = Boolean(message.text && message.text.trim().length > 0);

  const renderStatusIcon = () => {
    switch (message.status) {
      case "sending":
        return <Clock className="w-3.5 h-3.5 text-emerald-300 animate-spin" aria-label="Sending" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-emerald-200" aria-label="Sent" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-emerald-200" aria-label="Delivered" />;
      case "read":
        return (
          <span className="flex items-center text-emerald-400 font-bold text-xs tracking-tighter" title="Read">
            ✓✓
          </span>
        );
      case "failed":
        return (
          <button
            type="button"
            onClick={() => onRetry?.(message.id)}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
            title="Failed to send. Click to retry."
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] underline">Retry</span>
          </button>
        );
      default:
        return null;
    }
  };

  const renderAttachmentCard = (att: Attachment) => {
    return (
      <div
        key={att.id}
        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
          isCurrentUser
            ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-950"
            : "bg-white border-slate-200/90 shadow-sm text-slate-800"
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[13px] font-semibold truncate leading-tight">{att.name}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 uppercase font-bold text-[9px]">
              {att.type}
            </span>
            <span>{att.size}</span>
          </div>
        </div>
        <a
          href={att.url}
          download={att.name}
          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Download attachment"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  };

  return (
    <div
      className={`group flex items-end gap-2.5 w-full my-2 transition-all ${
        isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* Left Avatar for Recipient (Hidden for user) */}
      {!isCurrentUser && (
        <div className="shrink-0 mb-1">
          {recipientAvatar ? (
            <img
              src={recipientAvatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100/90 text-emerald-800 font-semibold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-sm">
              {recipientInitials}
            </div>
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`max-w-[78%] md:max-w-[68%] lg:max-w-[62%] flex flex-col ${
          isCurrentUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-xs transition-shadow ${
            isCurrentUser
              ? "bg-[#eaf7ee] text-slate-900 rounded-br-xs border border-[#d2ecd9]"
              : "bg-[#f1f5f3] text-slate-800 rounded-bl-xs border border-[#e4ebe6]"
          }`}
        >
          {/* Text Message */}
          {hasText && (
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap font-normal select-text">
              {message.text}
            </p>
          )}

          {/* Attachments inside bubble */}
          {hasAttachments && (
            <div className={`flex flex-col gap-2 ${hasText ? "mt-2.5" : ""}`}>
              {message.attachments!.map(renderAttachmentCard)}
            </div>
          )}

          {/* Inline Timestamp and Status on User Messages */}
          <div
            className={`flex items-center gap-1.5 mt-1.5 justify-end text-[11px] ${
              isCurrentUser ? "text-emerald-700/80 font-medium" : "text-slate-400 font-normal"
            }`}
          >
            <span>{message.timestamp}</span>
            {isCurrentUser && <span className="inline-flex items-center">{renderStatusIcon()}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
