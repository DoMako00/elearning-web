import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Atom,
  Palette,
  BarChart2,
  Boxes,
  Code,
  FileCode,
  Stethoscope,
} from "lucide-react";
import type { DiscussionPost } from "../types/community";

interface DiscussionFeedProps {
  discussions: DiscussionPost[];
  onPostClick?: (post: DiscussionPost) => void;
  onLikePost?: (postId: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  showHeading?: boolean;
  onStartDiscussion?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showEmptyAction?: boolean;
}

export function DiscussionFeed({
  discussions,
  onPostClick,
  isLoading = false,
  errorMessage = null,
  showHeading = true,
  onStartDiscussion,
  emptyTitle = "No discussions in this view yet.",
  emptyDescription = "Start a discussion to share a question or idea with your course community.",
  showEmptyAction = true,
}: DiscussionFeedProps) {
  const renderTopicBadgeIcon = (icon: DiscussionPost["topicIcon"]) => {
    switch (icon) {
      case "js":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-amber-100 text-amber-800 font-bold text-sm tracking-tighter shrink-0 shadow-2xs">
            JS
          </div>
        );
      case "palette":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-purple-100 text-purple-700 shrink-0 shadow-2xs">
            <Palette className="size-5" />
          </div>
        );
      case "chart":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-blue-100 text-blue-600 shrink-0 shadow-2xs">
            <BarChart2 className="size-5" />
          </div>
        );
      case "cubes":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 shadow-2xs">
            <Boxes className="size-5" />
          </div>
        );
      case "atom":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-pink-100 text-pink-600 shrink-0 shadow-2xs">
            <Atom className="size-5" />
          </div>
        );
      case "code":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-indigo-100 text-indigo-700 shrink-0 shadow-2xs">
            <Code className="size-5" />
          </div>
        );
      case "message":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 shadow-2xs">
            <MessageSquare className="size-5" />
          </div>
        );
      case "book":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0 shadow-2xs">
            <BookOpen className="size-5" />
          </div>
        );
      case "stethoscope":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-purple-100 text-purple-700 shrink-0 shadow-2xs">
            <Stethoscope className="size-5" />
          </div>
        );
      case "clipboard":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-blue-100 text-blue-700 shrink-0 shadow-2xs">
            <ClipboardCheck className="size-5" />
          </div>
        );
      case "file":
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-amber-100 text-amber-800 shrink-0 shadow-2xs">
            <FileText className="size-5" />
          </div>
        );
      default:
        return (
          <div className="size-10 grid place-items-center rounded-xl bg-slate-100 text-slate-700 shrink-0 shadow-2xs">
            <FileCode className="size-5" />
          </div>
        );
    }
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
    <div className="community-feed flex flex-col gap-2 w-full h-full min-h-0">
      {showHeading ? <div className="flex items-center justify-between shrink-0">
        <h4 className="text-[13.5px] font-bold text-slate-900 tracking-tight">
          Recent discussions
        </h4>
        <span className="text-[11px] font-semibold text-slate-400">
          {discussions.length} threads
        </span>
      </div> : null}

      {/* Scrollable Threads List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {errorMessage ? <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700">{errorMessage}</p> : isLoading ? <p role="status" className="rounded-xl border border-slate-100 bg-white p-4 text-xs text-slate-500">Loading persisted discussions…</p> : discussions.length === 0 ? (
          <div className="community-empty-state" role="status">
            <img src="/assets/community/discussion-empty-state.png" alt="" />
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
            {showEmptyAction && onStartDiscussion ? (
              <button type="button" onClick={onStartDiscussion}>
                Start a discussion <ArrowRight aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
        {discussions.map((post) => (
          <article
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className={`flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border bg-white shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer group shrink-0 ${
              post.isOptimistic
                ? "border-emerald-400 bg-emerald-50/20 animate-in fade-in slide-in-from-top-2 duration-300"
                : "border-slate-200/90"
            }`}
          >
            {/* Left: Icon + Title & Metadata */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 scale-90 sm:scale-100 origin-left">
                {renderTopicBadgeIcon(post.topicIcon)}
              </div>

              <div className="flex flex-col min-w-0">
                <h5 className="text-[12.5px] sm:text-[13px] font-bold text-slate-900 leading-snug truncate group-hover:text-emerald-700 transition-colors">
                  {post.title}
                </h5>

                {/* Author Info + Category Tag + Time */}
                <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
                  <span className="text-slate-700 font-medium truncate max-w-27.5 sm:max-w-none">{post.author.name}</span>
                  <span className="size-1 rounded-full bg-slate-300 shrink-0" />
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] sm:text-[10.5px] font-semibold border shrink-0 ${getCategoryBadgeColor(
                      post.category.badgeColor
                    )}`}
                  >
                    {post.category.label}
                  </span>
                  <span className="size-1 rounded-full bg-slate-300 shrink-0" />
                  <span className="shrink-0">{post.timeAgo}</span>
                </div>
              </div>
            </div>

            {/* Right: Persisted reply count */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-medium text-slate-400 shrink-0 pl-1">
              <div
                className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                title={`${post.repliesCount} replies`}
              >
                <MessageSquare className="size-3.5" />
                <span>{post.repliesCount}</span>
              </div>

            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
