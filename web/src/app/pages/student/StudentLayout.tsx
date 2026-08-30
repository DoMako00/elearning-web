import { Link, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { SearchBar } from "../../../components/ui/SearchBar";
import { UserHeaderActions } from "../../../components/ui/UserHeaderActions";

export function StudentLayout() {
  const location = useLocation();
  const pathname = location.pathname;

  const isHome = pathname === "/" || pathname === "";
  const isMyCourses = pathname === "/my-courses";
  const isCourseOverview = pathname === "/my-courses/human-anatomy-i";
  const isLessonPlayer = pathname.startsWith("/my-courses/human-anatomy-i/lessons");
  const isExplore = pathname === "/explore";
  const isAssignments = pathname === "/assignments";
  const showCenteredSearch = isHome || isAssignments;

const isTestXP = pathname === "/test-xp";

    const renderBreadcrumb = () => {
      if (isMyCourses) {
      return (
        <div className="student-dashboard__page-title">
          <span className="student-dashboard__page-title-label">Learning space</span>
          <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
          <h1 id="my-courses-title">My Courses</h1>
        </div>
      );
    }

    if (isCourseOverview) {
      return (
        <nav className="student-dashboard__course-breadcrumb" aria-label="Lesson breadcrumb">
          <Link to="/my-courses">My Courses</Link>
          <span aria-hidden="true">›</span>
          <h1 id="course-overview-title" className="student-dashboard__course-breadcrumb-title">Human Anatomy</h1>
          <span aria-hidden="true">›</span>
          <strong aria-current="page">Lesson 1</strong>
        </nav>
      );
    }

    if (isLessonPlayer) {
      return (
        <nav className="student-dashboard__course-breadcrumb" aria-label="Lesson breadcrumb">
          <Link to="/my-courses">My Courses</Link>
          <span aria-hidden="true">›</span>
          <Link to="/my-courses/human-anatomy-i">Human Anatomy</Link>
          <span aria-hidden="true">›</span>
          <strong aria-current="page">Lesson Player</strong>
        </nav>
      );
    }

    if (isExplore) {
      return (
        <div className="student-dashboard__page-title">
          <span className="student-dashboard__page-title-label">Learning space</span>
          <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
          <h1 id="explore-header-title">Explore</h1>
        </div>
      );
    }

if (isAssignments) {
        return (
          <div className="student-dashboard__page-title">
            <span className="student-dashboard__page-title-label">Learning space</span>
            <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
            <h1 id="assignments-header-title">Assignments</h1>
          </div>
        );
      }

      const isTestInactivity = pathname === "/test-inactivity";

      if (isTestInactivity) {
        return (
          <div className="student-dashboard__page-title">
            <span className="student-dashboard__page-title-label">Learning space</span>
            <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
            <h1 id="test-inactivity-header-title">Inactivity Prompt Test</h1>
          </div>
        );
      }

      if (isTestXP) {
        return (
          <div className="student-dashboard__page-title">
            <span className="student-dashboard__page-title-label">Learning space</span>
            <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
            <h1 id="test-xp-header-title">XP Reward Test</h1>
          </div>
        );
      }

    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "Dashboard";
    const formattedTitle = lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <div className="student-dashboard__page-title">
        <span className="student-dashboard__page-title-label">Learning space</span>
        <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
        <h1>{formattedTitle}</h1>
      </div>
    );
  };

  return (
    <AppShell>
      <div
        className={`student-dashboard${isHome ? " student-dashboard--home" : ""}${
          isMyCourses ? " student-dashboard--my-courses" : ""
        }${isCourseOverview ? " student-dashboard--course-overview" : ""}${
          isAssignments ? " student-dashboard--assignments" : ""
        }`}
      >
        <header
          className={`student-dashboard__header${showCenteredSearch ? " student-dashboard__header--home" : ""}`}
          aria-label="Student dashboard header"
        >
          {showCenteredSearch ? (
            <div className="student-dashboard__search">
              <SearchBar placeholder="Search topics, subjects or skills..." />
            </div>
          ) : (
            renderBreadcrumb()
          )}
          <div className="student-dashboard__actions">
            <UserHeaderActions avatarSrc="https://i.pravatar.cc/112?img=47" avatarAlt="Juliana" hasNotification />
          </div>
        </header>
        <div className="student-dashboard__content">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}

