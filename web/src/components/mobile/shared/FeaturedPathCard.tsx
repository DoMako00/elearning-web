import React from "react";
import { ArrowRight, Bookmark, FileText } from "lucide-react";
import { useSavedItems } from "../../../state/useSavedItems";

export interface LearningPath {
  slug: string;
  title: string;
  description: string;
  weeks: number;
  tags: string[];
  learnerCount: string;
  illustration: string;
  avatars: string[];
}

export interface FeaturedPathCardProps {
  path: LearningPath;
  onExplore?: () => void;
  className?: string;
}

export const FeaturedPathCard: React.FC<FeaturedPathCardProps> = ({
  path,
  onExplore,
  className = "",
}) => {
  const { isSaved, toggleSaved } = useSavedItems();
  const saved = isSaved(path.slug);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(path.slug, "path");
  };

  return (
    <div
      onClick={onExplore}
      className={`relative w-full rounded-3xl overflow-hidden bg-linear-to-br from-[#032e1e] via-[#05422b] to-[#04281b] p-4.5 sm:p-5 text-white shadow-md cursor-pointer select-none border border-emerald-800/40 ${className}`}
    >
      {/* Background illustration / graphic */}
      <div className="absolute top-0 right-0 w-66 sm:w-80 h-full pointer-events-none flex items-center justify-end overflow-hidden pr-1">
        <img
          src={path.illustration}
          alt=""
          className="w-full h-full object-contain object-right drop-shadow-md select-none"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#032e1e] via-[#032e1e]/40 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[70%] sm:max-w-[75%] flex flex-col justify-between">
        <div>
          {/* Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-extrabold tracking-wider uppercase">
              EDITOR'S PICK
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-emerald-200 text-[9px] font-extrabold tracking-wider uppercase">
              {path.weeks}-WEEK PATH
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug text-white">
            {path.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium leading-relaxed mt-1 line-clamp-3">
            {path.description}
          </p>
        </div>

        {/* Learner Avatars */}
        <div className="flex items-center gap-2 mt-3.5 mb-3.5">
          <div className="flex -space-x-1.5 overflow-hidden">
            {path.avatars.map((avatar, idx) => (
              <img
                key={idx}
                src={avatar}
                alt="Learner avatar"
                className="inline-block h-6 w-6 rounded-full ring-2 ring-emerald-950 object-cover"
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-emerald-200">
            {path.learnerCount} learners
          </span>
        </div>

        {/* Actions row: View study resources + Bookmark */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-800" />
            <span>View study resources</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          <button
            type="button"
            onClick={handleBookmark}
            aria-label={saved ? "Remove path bookmark" : "Bookmark path"}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              saved
                ? "bg-emerald-500/30 text-emerald-300 border-emerald-400/60"
                : "bg-white/10 hover:bg-white/20 text-white/80 border-white/15"
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              fill={saved ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
