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
import { CalendarStubScreen } from "./screens/TabScreens";
import { MoreRootScreen } from "./screens/MoreRootScreen";

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
    component: <CalendarStubScreen />,
  },
  more: {
    id: "tab-more",
    tabRoot: "more",
    variant: "main",
    component: <MoreRootScreen />,
  },
};

import { useLocation, useNavigate } from "react-router-dom";

const MobileLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, replace } = useScreenStack();

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
    // If selecting home, update url to /; if my-courses, to /my-courses
    if (tab === "home" && location.pathname !== "/") {
      navigate("/");
    } else if (tab === "my-courses" && location.pathname !== "/my-courses") {
      navigate("/my-courses");
    }

    const targetScreen = TAB_ROOT_SCREENS[tab];
    if (targetScreen) {
      replace(targetScreen);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-50 flex flex-col justify-between text-slate-900 antialiased">
      {/* Active Screen Area with Animated Stack Transitions */}
      <main className="flex-1 flex flex-col min-h-0 w-full pb-16">
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
    : "home";

  const initialScreen = useMemo(
    () => TAB_ROOT_SCREENS[initialTab] || TAB_ROOT_SCREENS.home,
    [initialTab]
  );

  return (
    <ScreenStackProvider initialScreen={initialScreen}>
      <MobileLayoutContent />
    </ScreenStackProvider>
  );
};

export default MobileLayout;
