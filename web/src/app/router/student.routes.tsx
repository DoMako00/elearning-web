import type { RouteObject } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { SearchBar } from "../../components/ui/SearchBar";
import { UserHeaderActions } from "../../components/ui/UserHeaderActions";

function StudentHeaderPreview() {
  return (
    <div className="w-full min-w-0">
      <header
        className="flex w-full min-w-0 flex-wrap items-center gap-8 px-8 pb-0 pl-10 pt-8"
        aria-label="Student header preview"
      >
        <div className="min-w-[320px] max-w-[790px] flex-[1_1_790px]">
          <SearchBar />
        </div>
        <div className="ml-auto shrink-0">
          <UserHeaderActions
            avatarSrc="https://i.pravatar.cc/112?img=47"
            avatarAlt="Juliana"
            hasNotification
          />
        </div>
      </header>
    </div>
  );
}

export const studentRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <AppShell>
        <StudentHeaderPreview />
      </AppShell>
    ),
  },
];