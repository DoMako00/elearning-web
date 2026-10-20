import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, CircleHelp, Compass, LogIn, MessageSquare, RefreshCw } from "lucide-react";
import { useAuth } from "../../../../app/providers/AuthProvider";
import { useStudentCourseList } from "../../api/useStudentCourses";
import { useBrand } from "../../../../app/providers/BrandProvider";
import { useStudentProgress } from "../../api/useStudentLearning";
import { courseArtwork, WeeklyGoalTile } from "./HomeDashboard";
import "./HomeDashboard.css";

/** Home for students who are signed out or not yet enrolled in any subject. */
export function HomeOnboarding() {
  const auth = useAuth();
  const { brand } = useBrand();
  const isAuthenticated = auth.status === "authenticated";
  const progress = useStudentProgress();
  const catalogue = useStudentCourseList("explore");
  const available = catalogue.data ?? [];
  const placement = available[0] ? `${available[0].academicLevel.title} · ${available[0].academicSemester.title}` : null;

  return (
    <section className="home-dashboard home-dashboard--onboarding" aria-label="Getting started">
      <div className="home-dashboard__main">
        <article className="home-hero home-hero--onboarding" aria-labelledby="home-onboard-title">
          <div className="home-hero__body">
            <div className="home-hero__top">
              <span className="home-chip home-chip--onDark"><Compass aria-hidden="true" />Getting started</span>
              {placement ? <span className="home-hero__context">{placement}</span> : null}
            </div>
            <div className="home-hero__titles">
              <h2 id="home-onboard-title">{isAuthenticated ? "Your learning space is ready" : `Welcome to ${brand.name}`}</h2>
              <p className="home-hero__lead">
                {isAuthenticated
                  ? "You're not enrolled in a subject yet. Once you are, your lessons, progress and deadlines will appear here."
                  : "Sign in to see the subjects published for your academic year and pick up where you left off."}
              </p>
            </div>
            {isAuthenticated && available.length > 0 ? (
              <div className="home-hero__kpi">
                <strong>{available.length}</strong>
                <span>{available.length === 1 ? "subject is" : "subjects are"} published for your year</span>
              </div>
            ) : null}
            <div className="home-hero__actions">
              {isAuthenticated ? (
                <Link className="home-btn home-btn--hero" to="/explore"><Compass aria-hidden="true" />Explore subjects</Link>
              ) : (
                <Link className="home-btn home-btn--hero" to="/auth/sign-in" state={{ from: "/" }}><LogIn aria-hidden="true" />Sign in</Link>
              )}
              <Link className="home-btn home-btn--ghostDark" to="/help">How learning works</Link>
            </div>
          </div>
          <div className="home-hero__steps" aria-label="How it works">
            <ol>
              <li><b>1</b><span><strong>Get enrolled</strong>Your academy enrolls you in your year's subjects.</span></li>
              <li><b>2</b><span><strong>Study lessons</strong>Watch lessons and read materials at your pace.</span></li>
              <li><b>3</b><span><strong>Track progress</strong>Goals, streaks and deadlines keep you on course.</span></li>
            </ol>
          </div>
        </article>

        <div className="home-dashboard__rail home-dashboard__rail--onboarding">
          {isAuthenticated && progress.data ? <WeeklyGoalTile progress={progress.data} /> : (
            <section className="home-tile home-goal" aria-labelledby="home-goal-signed-out">
              <header className="home-tile__head"><h2 id="home-goal-signed-out">Weekly goal</h2></header>
              <p className="home-activity__empty">Sign in to set a weekly lesson goal.</p>
            </section>
          )}
          <section className="home-tile home-help" aria-labelledby="home-help-title">
            <header className="home-tile__head"><h2 id="home-help-title"><CircleHelp aria-hidden="true" />Need access?</h2></header>
            <p>If you expected to see your subjects, contact your academy or check the Help Center.</p>
            <div className="home-help__links">
              <Link to="/help" className="home-help__link"><CircleHelp aria-hidden="true" />Help Center<ArrowRight aria-hidden="true" /></Link>
              <Link to="/messages" className="home-help__link"><MessageSquare aria-hidden="true" />Messages<ArrowRight aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
      </div>

      {isAuthenticated ? (
        <section className="home-tile home-catalogue" aria-labelledby="home-catalogue-title">
          <header className="home-tile__head">
            <h2 id="home-catalogue-title"><BookOpen aria-hidden="true" />Subjects for your year {available.length ? <span className="home-count">{available.length}</span> : null}</h2>
            <Link to="/explore" className="home-link">Explore all<ArrowRight aria-hidden="true" /></Link>
          </header>
          {catalogue.isLoading ? (
            <ul className="home-catalogue__grid" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((key) => <li key={key} className="home-catalogue__card"><span className="home-skel" style={{ width: "100%", height: "100%" }} /></li>)}
            </ul>
          ) : catalogue.isError ? (
            <div className="home-inline-error" role="alert">
              <AlertTriangle aria-hidden="true" /><span>Subjects couldn&apos;t load.</span>
              <button type="button" onClick={() => void catalogue.refetch()}><RefreshCw aria-hidden="true" />Retry</button>
            </div>
          ) : available.length === 0 ? (
            <p className="home-activity__empty">No subjects have been published for your year yet.</p>
          ) : (
            <ul className="home-catalogue__grid">
              {available.slice(0, 5).map((course) => (
                <li key={course.courseId} className="home-catalogue__card">
                  <img src={courseArtwork(course)} alt="" aria-hidden="true" loading="lazy" />
                  <div>
                    <strong>{course.title}</strong>
                    <span>{course.lessonCount > 0 ? `${course.chapterCount} chapters · ${course.lessonCount} lessons` : "Lessons coming soon"}</span>
                  </div>
                  <span className="home-catalogue__state">{course.access?.isEnrolled ? "Enrolled" : "Not enrolled"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  );
}
