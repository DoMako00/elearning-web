import type { ReactNode } from "react";
import { Sidebar } from "../Sidebar";
import { MyProgress } from "../../ui/MyProgress";
import Continue_learning from "../../ui/Continue_Learning/continue_learning";
import { Upcoming } from "../../ui/Upcoming";

export interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      className="grid h-dvh min-h-0 w-full grid-cols-[var(--sidebar-width)_minmax(0,1fr)] overflow-hidden bg-[var(--color-bg)]"
      data-app-shell
    >
      <Sidebar />
      <main
        className="grid h-full min-h-0 min-w-0 place-items-center overflow-hidden bg-[var(--color-bg)]"
        aria-label="Student workspace"
        data-main-workspace
      >
        {children ?? (
          <div className="flex min-h-full min-w-0 flex-wrap items-start justify-center gap-6 p-8">
            <Continue_learning />
            <MyProgress />
            <Upcoming />
          </div>
        )}
      </main>
    </div>
  );
}
