import React from "react";
import { ChevronRight } from "lucide-react";

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 mb-2.5 ${className}`}>
      <h2 className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight">
        {title}
      </h2>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer group"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.2] text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};
