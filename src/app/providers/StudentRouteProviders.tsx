import type { PropsWithChildren } from "react";
import { GamificationProvider } from "./GamificationProvider";
import { SavedItemsProvider } from "../../state/useSavedItems";

export function StudentRouteProviders({ children }: PropsWithChildren) {
  return (
    <GamificationProvider>
      <SavedItemsProvider>{children}</SavedItemsProvider>
    </GamificationProvider>
  );
}
