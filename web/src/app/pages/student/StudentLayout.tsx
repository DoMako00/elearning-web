import { Link, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { SearchBar } from "../../../components/ui/SearchBar";
import { UserHeaderActions } from "../../../components/ui/UserHeaderActions";

export function StudentLayout() {
  const location = useLocation();
  const isMyCourses = location.pathname === "/my-courses";
  const isCourseOverview = location.pathname === "/my-courses/human-anatomy-i";

  return (
    <AppShell>
      <div className={`student-dashboard${isMyCourses ? " student-dashboard--my-courses" : ""}${isCourseOverview ? " student-dashboard--course-overview" : ""}`}>
        <header className="student-dashboard__header" aria-label="Student dashboard header">
          {isMyCourses ? (
            <div className="student-dashboard__page-title">
              <span className="student-dashboard__page-title-label">Learning space</span>
              <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
              <h1 id="my-courses-title">My Courses</h1>
            </div>
          ) : null}
          {isCourseOverview ? (
            <nav className="student-dashboard__course-breadcrumb" aria-label="Lesson breadcrumb">
              <Link to="/my-courses">My Courses</Link>
              <span aria-hidden="true">›</span>
              <h1 id="course-overview-title" className="student-dashboard__course-breadcrumb-title">Human Anatomy</h1>
              <span aria-hidden="true">›</span>
              <strong aria-current="page">Lesson 1</strong>
            </nav>
          ) : null}
          {!isMyCourses && !isCourseOverview && <div className="student-dashboard__search"><SearchBar /></div>}
          <div className="student-dashboard__actions">
            <UserHeaderActions avatarSrc="https://i.pravatar.cc/112?img=47" avatarAlt="Juliana" hasNotification />
          </div>
        </header>
        <div className="student-dashboard__content"><Outlet /></div>
      </div>
    </AppShell>
  );
}
