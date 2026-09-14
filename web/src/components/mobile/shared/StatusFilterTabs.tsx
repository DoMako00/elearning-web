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
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Single row: pills grow equally, sort button stays on the right */}
      <div className="flex items-center gap-1.5">
        {/* Tab Pills — each takes equal share of available width */}
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl font-semibold transition-all cursor-pointer select-none min-w-0 ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <span className="text-[11px] leading-tight truncate">{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[9px] px-1 py-0.5 rounded-full font-bold leading-tight shrink-0 ${
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

        {/* Right Slot (Sort button) — always visible, never pushed off screen */}
        {rightSlot && <div className="shrink-0 pl-0.5">{rightSlot}</div>}
      </div>
    </div>
  );
};
