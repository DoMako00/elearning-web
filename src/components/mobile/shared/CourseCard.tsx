import React from "react";
import { FileText, Clock, ArrowRight, Bookmark } from "lucide-react";
import { useSavedItems } from "../../../state/useSavedItems";

export interface CourseCardData {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  completedDocs: number;
  totalDocs: number;
  status?: string; // e.g. "IN PROGRESS" | "COMPLETED"
  opened?: string; // e.g. "Last opened today" | "Last opened 3 days ago"
  slug?: string;
}

export interface CourseCardProps {
  course: CourseCardData;
  layout?: "compact" | "full";
  onClick?: () => void;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  layout = "compact",
  onClick,
  className = "",
}) => {
  const { isSaved, toggleSaved } = useSavedItems();
  const saved = isSaved(course.id);

  const percentage = Math.min(
    100,
    Math.round((course.completedDocs / Math.max(1, course.totalDocs)) * 100)
  );

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(course.id, "course");
  };

  if (layout === "full") {
    return (
      <div
        onClick={onClick}
        className={`w-full bg-white rounded-3xl border border-slate-100/90 p-3.5 sm:p-4 shadow-2xs hover:border-emerald-200/80 hover:shadow-xs transition-all flex gap-3.5 sm:gap-4 cursor-pointer select-none ${className}`}
      >
        {/* Left Thumbnail: Large rounded square with soft border */}
        <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 flex items-center justify-center relative">
          <img
            src={course.imageSrc}
            alt={course.title}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top row: IN PROGRESS pill + Bookmark Button */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-200/40">
              {course.status || "IN PROGRESS"}
            </span>

            <button
              type="button"
              onClick={handleBookmarkClick}
              aria-label={saved ? "Remove from saved courses" : "Save course"}
              className={`p-1 -mr-1 rounded-lg transition-colors cursor-pointer ${
                saved
                  ? "text-emerald-600 hover:text-emerald-700"
                  : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Bookmark
                className="w-4.5 h-4.5"
                fill={saved ? "currentColor" : "none"}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Course Title & Subtitle */}
          <div className="mt-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
              {course.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-medium">
              {course.subtitle}
            </p>
          </div>

          {/* Progress row: X of Y documents + percentage */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} />
                <span className="truncate">
                  {course.completedDocs} of {course.totalDocs} documents
                </span>
              </span>
              <span className="text-emerald-600 font-bold ml-1">{percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Bottom row: Last opened + circular arrow button */}
          <div className="mt-2.5 pt-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-400 font-medium truncate">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{course.opened || "Last opened recently"}</span>
            </div>

            <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.4]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact layout: side-by-side card (used on Home for 2 side-by-side cards)
  return (
    <div
      onClick={onClick}
      className={`flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:border-emerald-200 transition-all flex flex-col cursor-pointer select-none ${className}`}
    >
      {/* Top Banner image area with In Progress pill & Bookmark */}
      <div className="relative h-20 sm:h-22 w-full bg-emerald-50/50 overflow-hidden">
        <img
          src={course.imageSrc}
          alt={course.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-50/95 backdrop-blur-xs text-emerald-700 text-[9px] font-bold tracking-wider uppercase shadow-2xs border border-emerald-200/60">
          {course.status || "IN PROGRESS"}
        </span>

        <button
          type="button"
          onClick={handleBookmarkClick}
          aria-label={saved ? "Remove from saved courses" : "Save course"}
          className={`absolute top-1.5 right-1.5 p-1 rounded-full bg-white/80 backdrop-blur-xs shadow-2xs transition-colors cursor-pointer ${
            saved
              ? "text-emerald-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Bookmark
            className="w-3.5 h-3.5"
            fill={saved ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug truncate">
            {course.title}
          </h3>
          <p className="text-[10.5px] text-slate-500 truncate mt-0.5 font-medium">
            {course.subtitle}
          </p>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
            <span className="flex items-center gap-1 truncate">
              <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">
                {course.completedDocs} of {course.totalDocs} documents
              </span>
            </span>
            <span className="text-emerald-600 font-bold ml-1">{percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
