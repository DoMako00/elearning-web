import type { RouteObject } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { DashboardBento } from "../../components/ui/DashboardBento";
import { SearchBar } from "../../components/ui/SearchBar";
import { UserHeaderActions } from "../../components/ui/UserHeaderActions";
import "./student-dashboard.css";

function StudentHeaderPreview() {
  return (
    <div className="student-dashboard">
      <header
        className="student-dashboard__header"
        aria-label="Student dashboard header"
      >
        <div className="student-dashboard__search">
          <SearchBar />
        </div>
        <div className="student-dashboard__actions">
          <UserHeaderActions
            avatarSrc="https://i.pravatar.cc/112?img=47"
            avatarAlt="Juliana"
            hasNotification
          />
        </div>
      </header>
      <div className="student-dashboard__content">
        <DashboardBento />
      </div>
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
