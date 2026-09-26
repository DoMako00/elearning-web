import React from "react";
import {
  Bookmark,
  BookOpen,
  Video,
  FileText,
  MessageSquare,
  Trash2,
  ExternalLink,
  Clock,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SavedCategory, SavedItem } from "../../types/profile.types";

interface SavedTabProps {
  items: SavedItem[];
  currentCategory: SavedCategory | "all";
  onCategoryChange: (cat: SavedCategory | "all") => void;
  onRemoveItem: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

const CATEGORIES: { id: SavedCategory | "all"; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "all", label: "All Items", icon: Layers },
  { id: "courses", label: "Courses & Modules", icon: BookOpen },
  { id: "lessons", label: "Video Lessons", icon: Video },
  { id: "notes", label: "Lecture Notes & PDFs", icon: FileText },
  { id: "threads", label: "Community Threads", icon: MessageSquare },
];

export const SavedTab: React.FC<SavedTabProps> = ({
  items,
  currentCategory,
  onCategoryChange,
  onRemoveItem,
  onShowToast,
}) => {
  const navigate = useNavigate();

  const handleOpenItem = (item: SavedItem) => {
    if (item.route && item.route !== "#") {
      navigate(item.route);
    } else {
      onShowToast?.(`Opening saved resource: ${item.title}`);
    }
  };

  const handleRemove = (e: React.MouseEvent, item: SavedItem) => {
    e.stopPropagation();
    onRemoveItem(item.id);
    onShowToast?.(`Removed "${item.title}" from saved bookmarks`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden pt-1 gap-3">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-0.5 shrink-0">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = currentCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="size-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Saved Bookmarked Assets */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
          <Bookmark className="size-10 text-gray-300" />
          <h3 className="mt-2 text-base font-bold text-gray-800">No saved items in this category</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm">
            Bookmark courses, lecture notes, video segments, and threads to quickly find them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1 min-h-0 overflow-y-auto no-scrollbar items-stretch pb-1">
          {items.map((item) => {
            const isLesson = item.category === "lessons";
            const isCourse = item.category === "courses";
            const isNote = item.category === "notes";
            const isThread = item.category === "threads";

            return (
              <article
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div>
                  {/* Card Top: Category badge & bookmark remove action */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-black ${
                        isCourse
                          ? "bg-emerald-100 text-emerald-800"
                          : isLesson
                          ? "bg-blue-100 text-blue-800"
                          : isNote
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {isCourse && <BookOpen className="size-3.5" />}
                      {isLesson && <Video className="size-3.5" />}
                      {isNote && <FileText className="size-3.5" />}
                      {isThread && <MessageSquare className="size-3.5" />}
                      <span className="capitalize">{item.category}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, item)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Remove from saved bookmarks"
                      aria-label="Remove bookmark"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Thumbnail if available */}
                  {item.thumbnail && (
                    <div className="relative mb-2.5 h-24 w-full overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isLesson && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="grid size-8 place-items-center rounded-full bg-white/90 text-emerald-700 shadow-md">
                            <Video className="size-3.5 fill-emerald-600 text-emerald-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title & Subtitle */}
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 line-clamp-1 leading-snug group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs sm:text-[13px] text-gray-600 line-clamp-1 leading-normal font-medium">
                    {item.subtitle}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Meta info */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    {item.readTimeOrDuration && (
                      <>
                        <Clock className="size-3.5 text-gray-400" />
                        <span>{item.readTimeOrDuration}</span>
                        <span className="mx-1">•</span>
                      </>
                    )}
                    <span>{item.dateSaved}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ExternalLink className="size-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
