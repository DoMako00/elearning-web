import React from "react";
import {
  User,
  ShieldCheck,
  // KeyRound,
  Laptop,
  Bell,
  Lock,
  Palette,
  type LucideIcon,
} from "lucide-react";
import type { SettingsTabId } from "../../../types/settings";

interface TabItem {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: ShieldCheck },
  // { id: "security", label: "Security", icon: KeyRound },
  { id: "devices", label: "Devices", icon: Laptop },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
];

interface SettingsTabNavProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

export const SettingsTabNav: React.FC<SettingsTabNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav
      aria-label="Settings navigation"
      className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/80"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border border-transparent"
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                isActive ? "text-emerald-600" : "text-gray-400"
              }`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
