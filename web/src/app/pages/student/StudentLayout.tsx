import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../../../components/layout/AppShell";
import { SearchBar } from "../../../components/ui/SearchBar";
import { UserHeaderActions } from "../../../components/ui/UserHeaderActions";

export function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const isHome = pathname === "/" || pathname === "";
  const isProfile = pathname === "/profile";
  const isMyCourses = pathname === "/my-courses";
  const isCourseOverview = pathname === "/my-courses/human-anatomy-i";
  const isLessonPlayer = pathname.startsWith("/my-courses/human-anatomy-i/lessons");
  const isExplore = pathname === "/explore";
  const isAssignments = pathname === "/assignments";
  const isAssignmentDetail = pathname.startsWith("/assignments/");
  const isCalendar = pathname === "/calendar";
  const isMessages = pathname === "/messages";
  const isTestXP = pathname === "/test-xp";
  const isTestInactivity = pathname === "/test-inactivity";
  const isTestStreak = pathname === "/test-streak";

  // Search bar in the topbar is exclusively for Home; explicitly removed on Profile and other pages
  const showCenteredSearch = isHome && !isProfile;

  const renderBreadcrumb = () => {
    if (isProfile) {
      return (
        <div className="student-dashboard__page-title">
          <span className="student-dashboard__page-title-label">Student Account</span>
          <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
          <h1>My Profile</h1>
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

    if (isAssignmentDetail) {
      return (
        <div className="student-dashboard__page-title">
          <span className="student-dashboard__page-title-label">Learning space</span>
          <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
          <Link to="/assignments" style={{ color: "inherit", textDecoration: "none" }}>
            <span style={{ color: "#64748b", fontWeight: 600 }}>Assignments</span>
          </Link>
          <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
          <h1>Clinical Case Review</h1>
        </div>
      );
    }

    let title = "Dashboard";
    if (isMyCourses) title = "My Courses";
    else if (isExplore) title = "Explore";
    else if (isAssignments) title = "Assignments";
    else if (isCalendar) title = "Calendar";
    else if (isMessages) title = "Messages";
    else if (isTestInactivity) title = "Inactivity Prompt Test";
    else if (isTestXP) title = "XP Reward Test";
    else if (isTestStreak) title = "Streak Analytics Test";
    else {
      const segments = pathname.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1] || "Dashboard";
      title = lastSegment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return (
      <div className="student-dashboard__page-title">
        <span className="student-dashboard__page-title-label">Learning space</span>
        <span className="student-dashboard__page-title-separator" aria-hidden="true">/</span>
        <h1>{title}</h1>
      </div>
    );
  };

  const isScrollablePage = isTestXP || isTestStreak || isTestInactivity;

  return (
    <AppShell>
      <div
        className={`student-dashboard${isHome ? " student-dashboard--home" : ""}${
          isProfile ? " student-dashboard--profile" : ""
        }${isMyCourses ? " student-dashboard--my-courses" : ""}${
          isCourseOverview ? " student-dashboard--course-overview" : ""
        }${isAssignments ? " student-dashboard--assignments" : ""}${
          isAssignmentDetail ? " student-dashboard--assignment-detail" : ""
        }${isCalendar ? " student-dashboard--calendar" : ""}${
          isMessages ? " student-dashboard--messages" : ""
        }${isScrollablePage ? " student-dashboard--scrollable" : ""}`}
      >
        <header
          className={`student-dashboard__header${showCenteredSearch ? " student-dashboard__header--home" : ""}`}
          aria-label="Student dashboard header"
        >
          {showCenteredSearch ? (
            <div className="student-dashboard__search">
              <SearchBar placeholder="Search courses, topics or skills..." />
            </div>
          ) : (
            renderBreadcrumb()
          )}
          <div className="student-dashboard__actions">
            <UserHeaderActions
              avatarSrc="https://i.pravatar.cc/112?img=47"
              avatarAlt="Juliana"
              hasNotification
              onViewProfile={() => navigate("/profile")}
              onMenuItemClick={(itemKey) => {
                if (itemKey === "profile") navigate("/profile");
                else if (itemKey === "certificates") navigate("/profile");
              }}
            />
          </div>
        </header>
        <div className="student-dashboard__content">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
