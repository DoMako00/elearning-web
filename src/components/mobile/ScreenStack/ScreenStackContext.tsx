import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type TabId = "home" | "my-courses" | "explore" | "calendar" | "settings";

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
  const navigate = useNavigate();
  const location = useLocation();
  // Each pushed screen gets its own browser-history entry (same URL, with
  // the stack depth in history state) so the system/browser Back button
  // closes the pushed screen instead of skipping past it.
  const historyDepth = typeof (location.state as { mobileScreenDepth?: unknown } | null)?.mobileScreenDepth === "number"
    ? (location.state as { mobileScreenDepth: number }).mobileScreenDepth
    : 0;
  const historyDepthRef = useRef(historyDepth);
  historyDepthRef.current = historyDepth;
  const stackLengthRef = useRef(stack.length);
  stackLengthRef.current = stack.length;

  // Sync if initialScreen tab changes (e.g. navigation via URL)
  React.useEffect(() => {
    setActiveTabState(initialScreen.tabRoot);
    setStack([initialScreen]);
  }, [initialScreen.id, initialScreen.tabRoot]);

  // Browser Back/Forward changed the history depth: drop screens above it.
  React.useEffect(() => {
    setStack((prev) => {
      if (prev.length - 1 <= historyDepth) return prev;
      const next = prev.slice(0, Math.max(1, historyDepth + 1));
      const newCurrent = next[next.length - 1];
      if (newCurrent) setActiveTabState(newCurrent.tabRoot);
      return next;
    });
  }, [historyDepth]);

  const currentScreen = stack[stack.length - 1];
  const canPop = stack.length > 1;

  const push = useCallback(
    (screen: Omit<ScreenItem, "tabRoot"> & { tabRoot?: TabId }) => {
      const depth = stackLengthRef.current;
      setStack((prev) => [
        ...prev,
        {
          ...screen,
          tabRoot: screen.tabRoot || activeTab,
        },
      ]);
      navigate(`${location.pathname}${location.search}`, { state: { mobileScreenDepth: depth } });
    },
    [activeTab, location.pathname, location.search, navigate]
  );

  const pop = useCallback(() => {
    // A pushed screen with its own history entry is closed through history,
    // keeping the in-app Back button and the browser Back button in sync.
    if (historyDepthRef.current > 0 && historyDepthRef.current === stackLengthRef.current - 1) {
      navigate(-1);
      return;
    }
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

/** Same as useScreenStack, but returns null outside a ScreenStackProvider. */
export function useOptionalScreenStack(): ScreenStackContextType | null {
  return useContext(ScreenStackContext);
}

export function useScreenStack(): ScreenStackContextType {
  const context = useContext(ScreenStackContext);
  if (!context) {
    throw new Error("useScreenStack must be used within a ScreenStackProvider");
  }
  return context;
}
