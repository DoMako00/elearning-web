import React from "react";

export interface StatusFilterTabItem {
  key: string;
  label: string;
  count?: number;
}

export interface StatusFilterTabsProps {
  tabs: StatusFilterTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const StatusFilterTabs: React.FC<StatusFilterTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  rightSlot,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}>
      {/* Tab Pills */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                    isActive
                      ? "bg-emerald-200/80 text-emerald-900"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Slot (e.g. Sort button) */}
      {rightSlot && <div className="shrink-0 pl-1">{rightSlot}</div>}
    </div>
  );
};
