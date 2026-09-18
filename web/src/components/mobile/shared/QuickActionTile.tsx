import React, { ReactNode } from "react";

export interface QuickActionTileProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  className?: string;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex-1 min-w-19 bg-white rounded-2xl border border-slate-100 p-2.5 sm:p-3 flex flex-col items-center text-center shadow-xs hover:border-emerald-200 hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer ${className}`}
    >
      {/* Icon with soft circular mint background */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#eefaf3] text-emerald-600 flex items-center justify-center mb-2 shrink-0">
        {icon}
      </div>

      {/* Bold Title */}
      <h3 className="text-xs font-bold text-slate-800 tracking-tight leading-tight">
        {title}
      </h3>

      {/* Small gray subtitle */}
      <p className="text-[10px] text-slate-400 font-medium leading-snug mt-0.5 line-clamp-2">
        {subtitle}
      </p>
    </button>
  );
};
