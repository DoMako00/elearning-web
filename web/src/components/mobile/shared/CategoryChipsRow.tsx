import React, { ReactNode } from "react";

export interface CategoryItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface CategoryChipsRowProps {
  categories: CategoryItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const CategoryChipsRow: React.FC<CategoryChipsRowProps> = ({
  categories,
  activeKey,
  onChange,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {categories.map((cat) => {
        const isActive = cat.key === activeKey;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onChange(cat.key)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
              isActive
                ? "bg-emerald-100/80 text-emerald-900 border border-emerald-300 shadow-2xs font-bold"
                : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200/90 hover:bg-slate-50"
            }`}
          >
            {cat.icon && (
              <span className={`shrink-0 ${isActive ? "text-emerald-700" : "text-slate-500"}`}>
                {cat.icon}
              </span>
            )}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
