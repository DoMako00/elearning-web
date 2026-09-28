import {
  MessageSquare,
  Eye,
  ThumbsUp,
  X,
  Send,
  Sparkles,
  Wifi,
} from "lucide-react";
import { useState, type FormEvent, useEffect, useRef } from "react";
import type { DiscussionPost } from "../types/community";

interface DiscussionDetailModalProps {
  post: DiscussionPost | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
  onAddReply: (postId: string, content: string) => void;
  isConnected?: boolean;
}

export function DiscussionDetailModal({
  post,
  isOpen,
  onClose,
  onLike,
  onAddReply,
  isConnected = true,
}: DiscussionDetailModalProps) {
  const [replyText, setReplyText] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, post?.replies?.length]);

  if (!isOpen || !post) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(post.id, replyText.trim());
    setReplyText("");
  };

  const getCategoryBadgeColor = (color?: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/80";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getCategoryBadgeColor(
                post.category.badgeColor
              )}`}
            >
              {post.category.label}
            </span>
            <span
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                isConnected
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200/60"
                  : "text-amber-600 bg-amber-50 border-amber-200/60"
              }`}
            >
              <Wifi className="size-3" />
              {isConnected ? "Live thread sync" : "Syncing..."}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          {/* Post Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="size-11 rounded-full object-cover ring-2 ring-slate-100 shadow-xs"
              />
              <div>
                <h4 className="text-[15px] font-bold text-slate-900 leading-tight">
                  {post.author.name}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {post.author.role || "Community Member"} • {post.timeAgo}
                </p>
              </div>
            </div>

            {/* Like button */}
            <button
              type="button"
              onClick={() => onLike(post.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all text-xs font-semibold shadow-2xs"
            >
              <ThumbsUp className="size-3.5" />
              <span>{post.upvotesCount || 0}</span>
            </button>
          </div>

          {/* Post Title & Content */}
          <div className="flex flex-col gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {post.title}
            </h3>
            {post.content && (
              <p className="text-[13.5px] text-slate-600 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            )}
          </div>

          {/* Engagement Metrics Bar */}
          <div className="flex items-center gap-4 py-2 border-y border-slate-100 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              <span>{post.repliesCount} replies</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              <span>{post.viewsCount} views</span>
            </div>
          </div>

          {/* Replies Section */}
          <div className="flex flex-col gap-3">
            <h5 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              <span>Discussion Replies ({post.replies?.length || 0})</span>
            </h5>

            {(!post.replies || post.replies.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                No replies yet. Be the first to start the conversation!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {post.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={reply.author.avatarUrl}
                          alt={reply.author.name}
                          className="size-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          {reply.author.name}
                        </span>
                        {reply.author.role && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {reply.author.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400">
                        {reply.timeAgo}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed pl-8">
                      {reply.content}
                    </p>
                  </div>
                ))}
                <div ref={repliesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Reply Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2.5"
        >
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a live response to this discussion..."
            className="flex-1 h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="size-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
