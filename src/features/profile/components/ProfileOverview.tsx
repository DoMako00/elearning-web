import { Link } from "react-router-dom";
import { ArrowRight, Award, CalendarDays, CheckCircle2, Flame, GraduationCap, Layers, Target } from "lucide-react";
import type { StudentCertificateSummaryDto, StudentProgressSnapshotDto } from "../../student/api/studentLearningApi";
import type { EnrolledCourseItem, MilestoneBadgeItem, RecentActivityItem, UpcomingEventItem } from "../types/profile.types";

interface ProfileOverviewProps {
  progress: StudentProgressSnapshotDto | undefined;
  weeklyGoal: number | null;
  courses: EnrolledCourseItem[];
  milestones: MilestoneBadgeItem[];
  certificates: StudentCertificateSummaryDto[];
  recent: RecentActivityItem[];
  upcoming: UpcomingEventItem[];
  onOpenAchievements: () => void;
}

function Bar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return <div className="pf-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><span style={{ width: `${safe}%` }} /></div>;
}

export function ProfileOverview({ progress, weeklyGoal, courses, milestones, certificates, recent, upcoming, onOpenAchievements }: ProfileOverviewProps) {
  const weekDone = progress?.weeklyCompletedLessons ?? 0;
  const issued = certificates.filter((item) => item.status === "issued");

  return (
    <div className="pf-grid">
      <section className={`pf-card pf-card--courses${courses.length < 3 ? " is-empty" : ""}`} aria-labelledby="pf-courses-title">
        <header className="pf-card__head">
          <h2 id="pf-courses-title"><Layers aria-hidden="true" />Subject progress</h2>
          <Link to="/my-courses" className="pf-link">My courses<ArrowRight aria-hidden="true" /></Link>
        </header>
        {courses.length === 0 ? (
          <p className="pf-empty">You&apos;re not enrolled in a subject yet. <Link to="/explore">Explore subjects</Link></p>
        ) : (
          <ul className="pf-courses">
            {courses.slice(0, 5).map((course) => (
              <li key={course.id}>
                <Link to={course.route}>
                  <strong>{course.title}</strong>
                  <Bar value={course.progressPercentage} label={`${course.title} progress`} />
                  <b>{Math.round(course.progressPercentage)}%</b>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pf-card pf-card--goal" aria-labelledby="pf-goal-title">
        <header className="pf-card__head"><h2 id="pf-goal-title"><Target aria-hidden="true" />Weekly goal</h2></header>
        {weeklyGoal ? (
          <>
            <p className="pf-kpi">{weekDone}<small>/{weeklyGoal}</small></p>
            <p className="pf-sub">lessons this week</p>
            <Bar value={(weekDone / weeklyGoal) * 100} label="Weekly goal progress" />
          </>
        ) : (
          <p className="pf-empty">No weekly goal yet. <Link to="/">Set one on Home</Link></p>
        )}
      </section>

      <section className="pf-card pf-card--streak" aria-labelledby="pf-streak-title">
        <header className="pf-card__head"><h2 id="pf-streak-title"><Flame aria-hidden="true" />Study streak</h2></header>
        <p className="pf-kpi">{progress?.currentStreakDays ?? 0}<small> days</small></p>
        <p className="pf-sub">Best streak: {progress?.longestStreakDays ?? 0} days</p>
      </section>

      <section className="pf-card pf-card--awards" aria-labelledby="pf-awards-title">
        <header className="pf-card__head">
          <h2 id="pf-awards-title"><Award aria-hidden="true" />Achievements</h2>
          <button type="button" className="pf-link" onClick={onOpenAchievements}>View all<ArrowRight aria-hidden="true" /></button>
        </header>
        {milestones.length === 0 ? (
          <p className="pf-empty">Achievements you earn will appear here.</p>
        ) : (
          <ul className="pf-list">
            {milestones.slice(0, 3).map((item) => (
              <li key={item.id}><span className="pf-list__icon"><Award aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.earnedDate}</small></span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="pf-card pf-card--certs" aria-labelledby="pf-certs-title">
        <header className="pf-card__head">
          <h2 id="pf-certs-title"><GraduationCap aria-hidden="true" />Certificates</h2>
          <button type="button" className="pf-link" onClick={onOpenAchievements}>Open<ArrowRight aria-hidden="true" /></button>
        </header>
        {issued.length === 0 ? (
          <p className="pf-empty">Certificates are issued when you complete a subject.</p>
        ) : (
          <ul className="pf-list">
            {issued.slice(0, 3).map((item) => (
              <li key={item.id}><span className="pf-list__icon"><GraduationCap aria-hidden="true" /></span><span><strong>{item.courseTitle}</strong><small>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.issuedAt))}</small></span></li>
            ))}
          </ul>
        )}
      </section>

      <section className="pf-card pf-card--activity" aria-labelledby="pf-activity-title">
        <header className="pf-card__head"><h2 id="pf-activity-title"><CheckCircle2 aria-hidden="true" />Recent activity</h2></header>
        {recent.length === 0 ? (
          <p className="pf-empty">Lessons you open or finish will appear here.</p>
        ) : (
          <ul className="pf-list">
            {recent.map((item) => (
              <li key={item.id}><span className="pf-list__dot" aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.timeAgo}</time></li>
            ))}
          </ul>
        )}
      </section>

      <section className="pf-card pf-card--upcoming" aria-labelledby="pf-upcoming-title">
        <header className="pf-card__head">
          <h2 id="pf-upcoming-title"><CalendarDays aria-hidden="true" />Upcoming</h2>
          <Link to="/calendar" className="pf-link">Calendar<ArrowRight aria-hidden="true" /></Link>
        </header>
        {upcoming.length === 0 ? (
          <p className="pf-empty">Nothing scheduled in the next 90 days.</p>
        ) : (
          <ul className="pf-list">
            {upcoming.map((item) => (
              <li key={item.id}><span className="pf-list__icon"><CalendarDays aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.dateStr}</small></span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
