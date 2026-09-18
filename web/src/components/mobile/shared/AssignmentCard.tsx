import React from "react";
import { CalendarDays, Bookmark } from "lucide-react";
import type { AssignmentItem, AssignmentStatus } from "../../ui/Assignments/assignments.types";
import { useSavedItems } from "../../../state/useSavedItems";

export interface AssignmentCardProps {
  item: AssignmentItem;
  onOpenDetail: (item: AssignmentItem) => void;
  onBookmarkToast?: (isSaved: boolean) => void;
}

// Category Tone styling mapped from desktop Assignments.css
const CATEGORY_TONE_STYLES: Record<string, { text: string }> = {
  green: { text: "text-[#16a34a]" },
  purple: { text: "text-[#7c3aed]" },
  blue: { text: "text-[#2563eb]" },
  orange: { text: "text-[#ea580c]" },
  rose: { text: "text-[#e11d48]" },
  teal: { text: "text-[#0f766e]" },
};

// Urgency Pill styles mapped verbatim from desktop Assignments.css:333-336
const URGENCY_STYLES: Record<string, { bg: string; text: string }> = {
  today: { bg: "bg-[#fee4e2]", text: "text-[#b42318]" },
  soon: { bg: "bg-[#ffead5]", text: "text-[#b54708]" },
  later: { bg: "bg-[#f2f4f7]", text: "text-[#475467]" },
  done: { bg: "bg-[#eefaf2]", text: "text-[#087f55]" },
};

// Status Badge styles mapped verbatim from desktop Assignments.css:374-377
const STATUS_STYLES: Record<AssignmentStatus, { label: string; bg: string; text: string }> = {
  "in-progress": { label: "In progress", bg: "bg-[#e7f8ee]", text: "text-[#15803d]" },
  submitted: { label: "Submitted", bg: "bg-[#e8f1ff]", text: "text-[#175cd3]" },
  graded: { label: "Graded", bg: "bg-[#f3e8ff]", text: "text-[#7c3aed]" },
  "not-started": { label: "Not started", bg: "bg-[#f2f4f7]", text: "text-[#475467]" },
};

// CTA Button labels mirrored directly from desktop AssignmentsWorkspace.tsx:47-52
function getActionLabel(status: AssignmentStatus): string {
  if (status === "in-progress") return "Continue";
  if (status === "submitted") return "View submission";
  if (status === "graded") return "View feedback";
  return "Start assignment";
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  item,
  onOpenDetail,
  onBookmarkToast,
}) => {
  const { isSaved, toggleSaved } = useSavedItems();
  const saved = isSaved(item.id);

  const categoryStyle = CATEGORY_TONE_STYLES[item.categoryTone] || CATEGORY_TONE_STYLES.green;
  const urgencyStyle = URGENCY_STYLES[item.urgency] || URGENCY_STYLES.soon;
  const statusConfig = STATUS_STYLES[item.status] || STATUS_STYLES["not-started"];
  const actionText = getActionLabel(item.status);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(item.id, "assignment");
    onBookmarkToast?.(!saved);
  };

  return (
    <article
      onClick={() => onOpenDetail(item)}
      className="w-full bg-white rounded-3xl border border-slate-100 shadow-2xs hover:border-slate-200 transition-all p-4 flex flex-col gap-3 cursor-pointer group"
    >
      {/* Top row: Category tag + Status Badge + Bookmark */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[10px] font-black tracking-wider uppercase truncate ${categoryStyle.text}`}
          >
            {item.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}
          >
            {statusConfig.label}
          </span>
          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-label={saved ? `Remove bookmark from ${item.title}` : `Bookmark ${item.title}`}
            aria-pressed={saved}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50 transition-colors cursor-pointer ${
              saved ? "text-emerald-600 fill-emerald-600" : ""
            }`}
          >
            <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Middle row: Organ Illustration + Title & Description */}
      <div className="flex items-start gap-3.5">
        <div className="size-16 sm:size-18 rounded-2xl bg-slate-50 border border-slate-100/80 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={item.image}
            alt=""
            aria-hidden="true"
            className="size-full object-contain drop-shadow-xs"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug truncate">
            {item.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5 leading-relaxed">
            {item.description}
          </p>

          {/* Due row + Urgency Pill */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <CalendarDays className="size-3.5 text-slate-400 shrink-0" />
              {item.dueLabel}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${urgencyStyle.bg} ${urgencyStyle.text}`}
            >
              {item.relativeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Points / Progress + CTA Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Points & Progress bar (only for in-progress, matching desktop) */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>{item.points} points</span>
            {item.status === "in-progress" && typeof item.progress === "number" && (
              <span className="text-emerald-700">{item.progress}%</span>
            )}
          </div>

          {item.status === "in-progress" && typeof item.progress === "number" ? (
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-1.5 bg-transparent" />
          )}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(item);
          }}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            item.status === "submitted" || item.status === "graded"
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-2xs"
          }`}
        >
          {actionText}
        </button>
      </div>
    </article>
  );
};
