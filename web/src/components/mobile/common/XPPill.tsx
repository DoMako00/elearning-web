import React from "react";
import { Sparkles } from "lucide-react";

interface XPPillProps {
  xp?: number;
  className?: string;
  onClick?: () => void;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export const XPPill: React.FC<XPPillProps> = ({
  xp = 2450,
  className = "",
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-800 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer select-none ${className}`}
      aria-label={`${numberFormatter.format(xp)} XP points`}
    >
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.2} />
      <span className="leading-none whitespace-nowrap">
        {numberFormatter.format(xp)} XP
      </span>
    </button>
  );
};
