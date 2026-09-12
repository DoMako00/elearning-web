import React from "react";
import {
  MessageSquare,
  Users,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useScreenStack } from "../ScreenStack";
import { DocsOnlyBanner } from "../common/DocsOnlyBanner";
import {
  MessagesListStubScreen,
  CommunityStubScreen,
  NotificationsStubScreen,
  SettingsStubScreen,
  HelpCenterStubScreen,
} from "./MoreDetailScreens";

interface MoreScreenProps {
  onSelectScreen?: (screenId: string) => void;
}

interface HubItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}

// NOTE: Confirm with product/design whether Messages and Community belong here
// or should be reachable elsewhere (e.g. bell icon or dedicated quick links)
// before building their real content.
const HUB_ITEMS: HubItem[] = [
  {
    id: "messages",
    title: "Messages",
    subtitle: "Conversations with instructors and peers",
    icon: MessageSquare,
  },
  {
    id: "community",
    title: "Community",
    subtitle: "Student discussion channels & question forums",
    icon: Users,
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Learning alerts, grades, and system updates",
    icon: Bell,
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "Account, security, devices, and preferences",
    icon: Settings,
  },
  {
    id: "help",
    title: "Help Center",
    subtitle: "Guides, FAQs, and student support tickets",
    icon: HelpCircle,
  },
  {
    id: "logout",
    title: "Log Out",
    subtitle: "Sign out of your student session",
    icon: LogOut,
    danger: true,
  },
];

export const MoreScreen: React.FC<MoreScreenProps> = ({ onSelectScreen }) => {
  const { push } = useScreenStack();

  const handleItemClick = (item: HubItem) => {
    if (item.id === "logout") {
      if (window.confirm("Are you sure you want to sign out?")) {
        window.location.href = "/";
      }
      return;
    }

    if (onSelectScreen) {
      onSelectScreen(item.id);
      return;
    }

    // Navigate to dedicated detail screen based on item id
    if (item.id === "messages") {
      push({
        id: "messages",
        title: "Messages",
        tabRoot: "more",
        variant: "detail",
        backLabel: "More",
        component: <MessagesListStubScreen />,
      });
      return;
    }

    if (item.id === "community") {
      push({
        id: "community",
        title: "Community",
        tabRoot: "more",
        variant: "detail",
        backLabel: "More",
        component: <CommunityStubScreen />,
      });
      return;
    }

    if (item.id === "notifications") {
      push({
        id: "notifications",
        title: "Notifications",
        tabRoot: "more",
        variant: "detail",
        backLabel: "More",
        component: <NotificationsStubScreen />,
      });
      return;
    }

    if (item.id === "settings") {
      push({
        id: "settings",
        title: "Settings",
        tabRoot: "more",
        variant: "detail",
        backLabel: "More",
        component: <SettingsStubScreen />,
      });
      return;
    }

    if (item.id === "help") {
      push({
        id: "help",
        title: "Help Center",
        tabRoot: "more",
        variant: "detail",
        backLabel: "More",
        component: <HelpCenterStubScreen />,
      });
      return;
    }

    // Default fallback
    push({
      id: item.id,
      title: item.title,
      tabRoot: "more",
      variant: "detail",
      backLabel: "More",
      component: (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <item.icon className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{item.subtitle}</p>
          <span className="mt-4 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Coming soon
          </span>
        </div>
      ),
    });
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Informative honest disclaimer banner */}
      <DocsOnlyBanner />

      {/* Hub list rows */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                item.danger
                  ? "hover:bg-rose-50/50 active:bg-rose-50"
                  : "hover:bg-slate-50/70 active:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.danger
                      ? "bg-rose-100/70 text-rose-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h3
                    className={`text-xs sm:text-sm font-bold leading-tight truncate ${
                      item.danger ? "text-rose-700" : "text-slate-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 ${
                  item.danger ? "text-rose-400" : "text-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
