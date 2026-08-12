import type { RouteObject } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { SearchBar } from "../../components/ui/SearchBar";
import { UserHeaderActions } from "../../components/ui/UserHeaderActions";

function StudentHeaderPreview() {
  return (
    <div className="h-full overflow-auto px-[var(--main-padding-x)] pt-[var(--main-padding-top)]">
      <header
        className="flex min-w-[900px] items-center justify-between gap-8"
        aria-label="Student header preview"
      >
        <SearchBar className="max-w-[790px]" />
        <UserHeaderActions
          avatarSrc="https://i.pravatar.cc/112?img=47"
          avatarAlt="Juliana"
          hasNotification
        />
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