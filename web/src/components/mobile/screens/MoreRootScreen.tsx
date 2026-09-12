import React from "react";
import { TopAppBar } from "../TopAppBar";
import { MoreScreen } from "./MoreScreen";

export const MoreRootScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="main" />
      <div className="flex-1 overflow-y-auto">
        <MoreScreen />
      </div>
    </div>
  );
};
