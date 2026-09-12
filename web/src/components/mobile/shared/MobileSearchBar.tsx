import React from "react";
import { Search, X } from "lucide-react";

export interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  rightSlot,
  className = "",
}) => {
  return (
    <div
      className={`relative w-full flex items-center bg-white rounded-2xl border border-slate-200/90 px-3.5 py-2.5 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all ${className}`}
    >
      <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" strokeWidth={2} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
      />
      {value.trim().length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="p-1 -mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {rightSlot && <div className="shrink-0 ml-2 pl-2 border-l border-slate-200">{rightSlot}</div>}
    </div>
  );
};
