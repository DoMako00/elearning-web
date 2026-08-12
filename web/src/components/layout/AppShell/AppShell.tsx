import type { ReactNode } from "react";
import { Sidebar } from "../Sidebar";

export interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      className="grid h-dvh w-screen grid-cols-[var(--sidebar-width)_minmax(0,1fr)] overflow-hidden bg-[var(--color-bg)]"
      data-app-shell
    >
      <Sidebar />
      <main
        className="h-full min-w-0 overflow-hidden bg-[var(--color-bg)]"
        aria-label="Student workspace"
        data-main-workspace
      >
        {children}
      </main>
    </div>
  );
}
