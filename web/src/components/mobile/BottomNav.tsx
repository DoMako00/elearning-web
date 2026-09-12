import React from "react";
import { Home, BookOpen, Compass, Calendar, Grid } from "lucide-react";
import type { TabId } from "./ScreenStack/ScreenStackContext";

interface BottomNavProps {
  activeTab: TabId;
  onTabSelect: (tab: TabId) => void;
}

interface NavItemConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "my-courses", label: "My Courses", icon: BookOpen },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "more", label: "More", icon: Grid },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabSelect,
}) => {
  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg select-none"
      style={{
        paddingBottom: "max(0.4rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="h-14 flex items-center justify-around px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabSelect(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-colors cursor-pointer ${
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? "text-emerald-600 scale-105" : "text-slate-400"
                }`}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <span className="text-[10.5px] leading-none tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
