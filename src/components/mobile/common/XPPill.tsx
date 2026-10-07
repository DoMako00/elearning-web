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
    /* mobile-xp-pill → font/padding/icon shrink on ≤375px via mobile-se.css */
    <button
      type="button"
      onClick={onClick}
      className={`mobile-xp-pill inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-800 text-[10px] font-semibold shadow-2xs transition-colors cursor-pointer select-none ${className}`}
      aria-label={`${numberFormatter.format(xp)} XP points`}
    >
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.2} />
      <span className="leading-none text-[14px] font-semibold whitespace-nowrap">
        {numberFormatter.format(xp)} XP
      </span>
    </button>
  );
};
