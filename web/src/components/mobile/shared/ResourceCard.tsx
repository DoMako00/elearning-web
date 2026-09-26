import React from "react";
import { FileText, Users, ArrowRight } from "lucide-react";

export interface ResourceCardData {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryId: string;
  imageSrc: string;
  documentsCount: number;
  learnersCount: string; // e.g. "15.2k"
  slug: string;
  level?: string;
  duration?: string;
  rating?: number;
}

export interface ResourceCardProps {
  resource: ResourceCardData;
  onClick?: () => void;
  className?: string;
}

export function getCategoryBadgeStyle(category: string): {
  bg: string;
  text: string;
  border: string;
} {
  const cat = category.toUpperCase();
  switch (cat) {
    case "ANATOMY":
      return {
        bg: "bg-emerald-600",
        text: "text-white",
        border: "border-emerald-500",
      };
    case "HISTOLOGY":
      return {
        bg: "bg-purple-600",
        text: "text-white",
        border: "border-purple-500",
      };
    case "PHYSIOLOGY":
      return {
        bg: "bg-rose-500",
        text: "text-white",
        border: "border-rose-400",
      };
    case "BIOCHEMISTRY":
      return {
        bg: "bg-amber-500",
        text: "text-white",
        border: "border-amber-400",
      };
    case "NEUROSCIENCE":
      return {
        bg: "bg-sky-600",
        text: "text-white",
        border: "border-sky-500",
      };
    case "PHARMACOLOGY":
      return {
        bg: "bg-indigo-600",
        text: "text-white",
        border: "border-indigo-500",
      };
    default:
      return {
        bg: "bg-emerald-600",
        text: "text-white",
        border: "border-emerald-500",
      };
  }
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onClick,
  className = "",
}) => {
  const badgeStyle = getCategoryBadgeStyle(resource.category);

  return (
    <div
      onClick={onClick}
      className={`flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs hover:border-emerald-200 transition-all flex flex-col cursor-pointer select-none ${className}`}
    >
      {/* Top Banner image area with category badge */}
      <div className="relative h-20 sm:h-22 w-full bg-slate-100 overflow-hidden">
        <img
          src={resource.imageSrc}
          alt={resource.title}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-md ${badgeStyle.bg} ${badgeStyle.text} text-[8.5px] font-extrabold tracking-wider uppercase shadow-2xs`}
        >
          {resource.category}
        </span>
      </div>

      {/* Content Area */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug truncate">
            {resource.title}
          </h3>
          <p className="text-[10.5px] text-slate-500 truncate mt-0.5 font-medium">
            {resource.subtitle}
          </p>
        </div>

        {/* Discovery stats + Arrow */}
        <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-1">
          <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-medium truncate">
            <span className="flex items-center gap-1 truncate">
              <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{resource.documentsCount} docs</span>
            </span>
            <span className="flex items-center gap-1 truncate">
              <Users className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{resource.learnersCount}</span>
            </span>
          </div>

          <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200/80 text-slate-600 flex items-center justify-center shrink-0 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            <ArrowRight className="w-3 h-3 stroke-[2.2]" />
          </div>
        </div>
      </div>
    </div>
  );
};
