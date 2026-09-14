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
    /* mobile-section-header → title + action label shrink on ≤375px via mobile-se.css */
    <div className={`mobile-section-header flex items-center justify-between gap-2 mb-2.5 ${className}`}>
      <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
        {title}
      </h2>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer group"
        >
          <span className="section-action-label text-[12px]">{actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.2] text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};
