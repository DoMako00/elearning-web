import { Outlet } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { SearchBar } from "../../../components/ui/SearchBar";
import { UserHeaderActions } from "../../../components/ui/UserHeaderActions";

export function StudentLayout() {
  return (
    <AppShell>
      <div className="student-dashboard">
        <header className="student-dashboard__header" aria-label="Student dashboard header">
          <div className="student-dashboard__search"><SearchBar /></div>
          <div className="student-dashboard__actions">
            <UserHeaderActions avatarSrc="https://i.pravatar.cc/112?img=47" avatarAlt="Juliana" hasNotification />
          </div>
        </header>
        <div className="student-dashboard__content"><Outlet /></div>
      </div>
    </AppShell>
  );
}
