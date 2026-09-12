import React, { ReactNode } from "react";

export interface TrendingRowProps {
  rank: string; // e.g. "01", "02", "03"
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle: string; // e.g. "Intermediate · 8h · 12 docs"
  trailingSlot?: ReactNode; // e.g. trending up arrow + rating, or reply count
  onClick?: () => void;
  className?: string;
}

export const TrendingRow: React.FC<TrendingRowProps> = ({
  rank,
  icon,
  iconBgColor = "bg-emerald-50",
  iconColor = "text-emerald-600",
  title,
  subtitle,
  trailingSlot,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`w-full bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-200 transition-all cursor-pointer select-none ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank Number */}
        <span className="text-sm sm:text-base font-extrabold text-emerald-600/70 tracking-tight shrink-0 w-6">
          {rank}
        </span>

        {/* Circular / Rounded Icon */}
        <div
          className={`w-10 h-10 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>

        {/* Title & Subtitle */}
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Trailing slot (generic for future Community reuse) */}
      {trailingSlot && <div className="shrink-0 pl-1">{trailingSlot}</div>}
    </div>
  );
};
