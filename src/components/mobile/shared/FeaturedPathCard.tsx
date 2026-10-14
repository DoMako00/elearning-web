import React from "react";
import { ArrowRight, BookOpen, FileText } from "lucide-react";

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  levelTitle: string;
  courseCount: number;
  illustration: string;
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
  return (
    <div
      onClick={onExplore}
      className={`relative w-full rounded-3xl overflow-hidden bg-[#032e1e] p-4.5 sm:p-5 text-white shadow-md cursor-pointer select-none border border-emerald-800/40 ${className}`}
    >
      {/* Background illustration / graphic */}
      <div className="absolute top-0 right-0 w-66 sm:w-80 h-full pointer-events-none flex items-center justify-end overflow-hidden pr-1">
        <img
          src={path.illustration}
          alt=""
          className="w-full h-full object-contain object-right drop-shadow-md select-none"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#032e1e] via-[#032e1e]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[70%] sm:max-w-[75%] flex flex-col justify-between">
        <div>
          {/* Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-extrabold tracking-wider uppercase">
              LEARNING PATH
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-emerald-200 text-[9px] font-extrabold tracking-wider uppercase">
              {path.courseCount} COURSES
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

        <div className="flex items-center gap-2 mt-3.5 mb-3.5 text-[11px] font-bold text-emerald-200">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>{path.courseCount} included courses · {path.levelTitle}</span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-6 h-6 text-emerald-800" />
            <span className="text-xs">View learning path</span>
            <ArrowRight className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
