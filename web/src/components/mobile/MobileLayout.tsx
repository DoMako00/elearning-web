import React, { useMemo } from "react";
import {
  ScreenStackProvider,
  ScreenStackContainer,
  useScreenStack,
  TabId,
  ScreenItem,
} from "./ScreenStack";
import { BottomNav } from "./BottomNav";
import { HomeScreen } from "./screens/HomeScreen";
import { MyCoursesScreen } from "./screens/MyCoursesScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

const TAB_ROOT_SCREENS: Record<TabId, ScreenItem> = {
  home: {
    id: "tab-home",
    tabRoot: "home",
    variant: "main",
    component: <HomeScreen />,
  },
  "my-courses": {
    id: "tab-my-courses",
    tabRoot: "my-courses",
    variant: "main",
    component: <MyCoursesScreen />,
  },
  explore: {
    id: "tab-explore",
    tabRoot: "explore",
    variant: "main",
    component: <ExploreScreen />,
  },
  calendar: {
    id: "tab-calendar",
    tabRoot: "calendar",
    variant: "main",
    component: <CalendarScreen />,
  },
  settings: {
    id: "tab-settings",
    tabRoot: "settings",
    variant: "main",
    component: <SettingsScreen />,
  },
};

import { useLocation, useNavigate } from "react-router-dom";

import { MobileMessagesProvider } from "./data/useMobileMessages";

const MobileLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, replace } = useScreenStack();

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "home" && location.pathname !== "/") {
      navigate("/");
    } else if (tab === "my-courses" && location.pathname !== "/my-courses") {
      navigate("/my-courses");
    } else if (tab === "explore" && location.pathname !== "/explore") {
      navigate("/explore");
    } else if (tab === "calendar" && location.pathname !== "/calendar") {
      navigate("/calendar");
    } else if (tab === "settings" && location.pathname !== "/settings") {
      navigate("/settings");
    }

    const targetScreen = TAB_ROOT_SCREENS[tab];
    if (targetScreen) {
      replace(targetScreen);
    }
  };

  return (
    <div className="relative  h-dvh max-h-screen w-full bg-slate-50 flex flex-col text-slate-900 antialiased overflow-hidden">
      {/* Active Screen Area with Animated Stack Transitions */}
      <main className="flex-1 min-h-0 w-full flex flex-col pb-14 overflow-hidden">
        <ScreenStackContainer />
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabSelect={handleTabSelect} />
    </div>
  );
};

export const MobileLayout: React.FC = () => {
  const location = useLocation();
  const initialTab: TabId = location.pathname.startsWith("/my-courses")
    ? "my-courses"
    : location.pathname === "/explore"
    ? "explore"
    : location.pathname === "/calendar"
    ? "calendar"
    : location.pathname.startsWith("/settings")
    ? "settings"
    : "home";

  const initialScreen = useMemo(
    () => TAB_ROOT_SCREENS[initialTab] || TAB_ROOT_SCREENS.home,
    [initialTab]
  );

  return (
    <MobileMessagesProvider>
      <ScreenStackProvider initialScreen={initialScreen}>
        <MobileLayoutContent />
      </ScreenStackProvider>
    </MobileMessagesProvider>
  );
};

export default MobileLayout;
