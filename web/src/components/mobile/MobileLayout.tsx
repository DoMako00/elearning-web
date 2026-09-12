import React, { useMemo } from "react";
import {
  ScreenStackProvider,
  ScreenStackContainer,
  useScreenStack,
  TabId,
  ScreenItem,
} from "./ScreenStack";
import { BottomNav } from "./BottomNav";
import { HomeStubScreen } from "./screens/HomeScreens";
import {
  MyCoursesStubScreen,
  ExploreStubScreen,
  CalendarStubScreen,
} from "./screens/TabScreens";
import { MoreRootScreen } from "./screens/MoreRootScreen";

const TAB_ROOT_SCREENS: Record<TabId, ScreenItem> = {
  home: {
    id: "tab-home",
    tabRoot: "home",
    variant: "main",
    component: <HomeStubScreen />,
  },
  "my-courses": {
    id: "tab-my-courses",
    tabRoot: "my-courses",
    variant: "main",
    component: <MyCoursesStubScreen />,
  },
  explore: {
    id: "tab-explore",
    tabRoot: "explore",
    variant: "main",
    component: <ExploreStubScreen />,
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

const MobileLayoutContent: React.FC = () => {
  const { activeTab, setActiveTab, replace } = useScreenStack();

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
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
  const initialScreen = useMemo(() => TAB_ROOT_SCREENS.home, []);

  return (
    <ScreenStackProvider initialScreen={initialScreen}>
      <MobileLayoutContent />
    </ScreenStackProvider>
  );
};

export default MobileLayout;
