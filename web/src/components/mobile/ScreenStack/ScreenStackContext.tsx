import React, { createContext, useContext, useState, useCallback } from "react";

export type TabId = "home" | "my-courses" | "explore" | "calendar" | "more";

export interface ScreenItem {
  id: string;
  title?: string;
  tabRoot: TabId;
  variant: "main" | "detail";
  backLabel?: string;
  rightSlot?: React.ReactNode;
  component: React.ReactNode;
}

interface ScreenStackContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  currentScreen: ScreenItem;
  push: (screen: Omit<ScreenItem, "tabRoot"> & { tabRoot?: TabId }) => void;
  pop: () => void;
  replace: (screen: Omit<ScreenItem, "tabRoot"> & { tabRoot?: TabId }) => void;
  canPop: boolean;
  stackDepth: number;
}

const ScreenStackContext = createContext<ScreenStackContextType | null>(null);

interface ScreenStackProviderProps {
  initialScreen: ScreenItem;
  children: React.ReactNode;
}

export const ScreenStackProvider: React.FC<ScreenStackProviderProps> = ({
  initialScreen,
  children,
}) => {
  const [activeTab, setActiveTabState] = useState<TabId>(initialScreen.tabRoot);
  const [stack, setStack] = useState<ScreenItem[]>([initialScreen]);

  // Sync if initialScreen tab changes (e.g. navigation via URL)
  React.useEffect(() => {
    setActiveTabState(initialScreen.tabRoot);
    setStack([initialScreen]);
  }, [initialScreen.id, initialScreen.tabRoot]);

  const currentScreen = stack[stack.length - 1];
  const canPop = stack.length > 1;

  const push = useCallback(
    (screen: Omit<ScreenItem, "tabRoot"> & { tabRoot?: TabId }) => {
      setStack((prev) => [
        ...prev,
        {
          ...screen,
          tabRoot: screen.tabRoot || activeTab,
        },
      ]);
    },
    [activeTab]
  );

  const pop = useCallback(() => {
    setStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, prev.length - 1);
      // Sync active tab to popped screen's root tab
      const newCurrent = next[next.length - 1];
      if (newCurrent) {
        setActiveTabState(newCurrent.tabRoot);
      }
      return next;
    });
  }, []);

  const replace = useCallback(
    (screen: Omit<ScreenItem, "tabRoot"> & { tabRoot?: TabId }) => {
      setStack((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...screen,
          tabRoot: screen.tabRoot || activeTab,
        };
        return next;
      });
    },
    [activeTab]
  );

  const setActiveTab = useCallback(
    (tab: TabId) => {
      setActiveTabState(tab);
      // When switching tabs via bottom nav, reset or switch root screen
    },
    []
  );

  return (
    <ScreenStackContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentScreen,
        push,
        pop,
        replace,
        canPop,
        stackDepth: stack.length,
      }}
    >
      {children}
    </ScreenStackContext.Provider>
  );
};

export function useScreenStack(): ScreenStackContextType {
  const context = useContext(ScreenStackContext);
  if (!context) {
    throw new Error("useScreenStack must be used within a ScreenStackProvider");
  }
  return context;
}
