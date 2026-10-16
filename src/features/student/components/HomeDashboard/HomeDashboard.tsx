import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Flame,
  Layers,
  Play,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import anatomyImage from "../../../../Assets/dashboard/human-anatomy.webp";
import physioImage from "../../../../Assets/dashboard/medical-physiology.webp";
import histologyImage from "../../../../Assets/dashboard/histology-basics.webp";
import biochemistryImage from "../../../../Assets/dashboard/biochemistry-essentials.webp";
import type { StudentCourseItem } from "../../api/studentCoursesApi";
import type { StudentProgressSnapshotDto } from "../../api/studentLearningApi";
import {
  useSetWeeklyLessonGoal,
  useStudentLearningPreferences,
  useStudentProgress,
} from "../../api/useStudentLearning";
import { useStudentAssignments } from "../../api/useStudentAssignments";
import { useStudentCalendar } from "../../api/useStudentCalendar";
import "./HomeDashboard.css";

const GOAL_PRESETS = [3, 5, 7, 10] as const;
const DAY_MS = 86_400_000;

export function courseArtwork(course: Pick<StudentCourseItem, "code" | "title">) {
  const source = `${course.code} ${course.title}`.toLowerCase();
  if (source.includes("bio")) return biochemistryImage;
  if (source.includes("phys")) return physioImage;
  if (source.includes("histo")) return histologyImage;
  return anatomyImage;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(iso));
}

function dueLabel(iso: string) {
  const date = new Date(iso);
  const diff = date.getTime() - Date.now();
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  if (diff < 0) return "Past due";
  if (diff < DAY_MS && date.getDate() === new Date().getDate()) return `Today, ${time}`;
  if (diff < 2 * DAY_MS) return `Tomorrow, ${time}`;
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function Bar({ value, tone = "brand", label }: { value: number; tone?: "brand" | "light"; label: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`home-bar home-bar--${tone}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}>
      <span style={{ width: `${safe}%` }} />
    </div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="home-inline-error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true" />Retry</button>
    </div>
  );
}

/* ── Hero: continue learning ─────────────────────────────── */

interface HeroProps {
  courses: readonly StudentCourseItem[];
  progress: StudentProgressSnapshotDto | undefined;
  progressLoading: boolean;
}

function ContinueHero({ courses, progress, progressLoading }: HeroProps) {
  const navigate = useNavigate();
  const enrolled = useMemo(() => courses.filter((course) => course.access?.isEnrolled === true), [courses]);
  const lastActivity = progress?.recentActivity.find((item) => enrolled.some((course) => course.courseId === item.courseId));
  const defaultId = lastActivity?.courseId ?? enrolled[0]?.courseId ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const course = enrolled.find((item) => item.courseId === (selectedId ?? defaultId)) ?? enrolled[0];
  if (!course) return null;

  const courseProgress = progress?.courses.find((item) => item.courseId === course.courseId);
  const percent = courseProgress?.completionPercent ?? 0;
  const completed = courseProgress?.completedLessons ?? 0;
  const total = courseProgress?.totalLessons || course.lessonCount;
  const activity = progress?.recentActivity.find((item) => item.courseId === course.courseId);
  const hasStarted = Boolean(activity) || completed > 0;
  const lessonHref = activity ? `/my-courses/${course.courseId}/lessons/${activity.lessonId}` : `/my-courses/${course.courseId}`;
  const routeState = { courseTitle: course.title, courseId: course.courseId };
  const others = enrolled.filter((item) => item.courseId !== course.courseId).slice(0, 2);
  const canOpen = course.access?.canOpen !== false;
  const lessonTotal = course.lessonCount || courseProgress?.totalLessons || 0;

  return (
    <article className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__art" aria-hidden="true">
        <img src={courseArtwork(course)} alt="" decoding="async" />
      </div>
      <div className="home-hero__body">
        <div className="home-hero__top">
          <span className="home-chip home-chip--onDark">
            {hasStarted ? <><Play aria-hidden="true" />Continue learning</> : canOpen ? <><BookOpen aria-hidden="true" />Ready to start</> : <><BookOpen aria-hidden="true" />Your subject</>}
          </span>
          <span className="home-hero__context">{course.unitLabel} · {course.academicLevel.title} · {course.academicSemester.title}</span>
        </div>

        <div className="home-hero__titles">
          <h2 id="home-hero-title">{course.title}</h2>
          <p className="home-hero__lesson">
            {activity
              ? <><span>{activity.status === "completed" ? "Last completed" : "Up next"}</span>{activity.lessonTitle}</>
              : !canOpen
                ? <><span>Enrolled</span>Lessons open once your academy publishes them</>
                : <><span>{course.chapterCount > 0 ? `${course.chapterCount} chapters` : course.unitLabel}</span>{lessonTotal} lessons in this {course.unitLabel.toLowerCase()}</>}
          </p>
        </div>

        <div className="home-hero__progress">
          <div className="home-hero__progress-meta">
            <strong>{progressLoading ? "—" : `${Math.round(percent)}%`}</strong>
            <span>{progressLoading ? "Loading progress" : `${completed} of ${total} lessons complete`}</span>
          </div>
          <Bar value={percent} tone="light" label={`${course.title} progress`} />
        </div>

        <div className="home-hero__actions">
          {canOpen ? (
            <>
              <button type="button" className="home-btn home-btn--hero" onClick={() => navigate(lessonHref, { state: routeState })}>
                <Play aria-hidden="true" />
                {hasStarted ? "Resume lesson" : "Start course"}
              </button>
              <Link className="home-btn home-btn--ghostDark" to={`/my-courses/${course.courseId}`} state={routeState}>
                Course overview
              </Link>
            </>
          ) : (
            <>
              <span className="home-hero__locked" role="status"><Clock3 aria-hidden="true" />Lessons not open yet</span>
              <Link className="home-btn home-btn--ghostDark" to="/help">Ask for help</Link>
            </>
          )}
          {others.length > 0 ? (
            <div className="home-hero__switch" aria-label="Switch course">
              <span>Switch to</span>
              {others.map((item) => (
                <button key={item.courseId} type="button" onClick={() => setSelectedId(item.courseId)} title={item.title}>
                  {item.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function HeroSkeleton() {
  return (
    <div className="home-hero home-hero--skeleton" aria-hidden="true">
      <div className="home-hero__art"><span className="home-skel home-skel--block" /></div>
      <div className="home-hero__body">
        <span className="home-skel" style={{ width: 160, height: 28 }} />
        <span className="home-skel" style={{ width: "70%", height: 44 }} />
        <span className="home-skel" style={{ width: "50%", height: 18 }} />
        <span className="home-skel" style={{ width: "100%", height: 10, marginTop: "auto" }} />
        <span className="home-skel" style={{ width: 200, height: 48 }} />
      </div>
    </div>
  );
}

/* ── Right rail: progress, weekly goal, streak ───────────── */

function OverallProgressTile({ progress }: { progress: StudentProgressSnapshotDto }) {
  const percent = Math.round(progress.completionPercent);
  return (
    <section className="home-tile home-stat" aria-labelledby="home-progress-title">
      <header className="home-tile__head">
        <h2 id="home-progress-title"><TrendingUp aria-hidden="true" />Overall progress</h2>
        <Link to="/profile" className="home-link">Details<ArrowRight aria-hidden="true" /></Link>
      </header>
      <div className="home-stat__row">
        <strong className="home-kpi">{percent}<small>%</small></strong>
        <dl className="home-stat__facts">
          <div><dt>Lessons done</dt><dd>{progress.totalCompletedLessons}<span>/{progress.totalLessons}</span></dd></div>
          <div><dt>Active days</dt><dd>{progress.totalActiveDays}</dd></div>
        </dl>
      </div>
      <Bar value={percent} label="Overall course completion" />
    </section>
  );
}

export function WeeklyGoalTile({ progress }: { progress: StudentProgressSnapshotDto }) {
  const preferences = useStudentLearningPreferences();
  const setGoal = useSetWeeklyLessonGoal();
  const goal = preferences.data?.weeklyLessonGoal ?? null;
  const done = progress.weeklyCompletedLessons;
  const percent = goal ? Math.min(100, (done / goal) * 100) : 0;
  const dayLetters = progress.weekDays.map((day) => ({
    key: day.date,
    label: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(new Date(day.date)),
    active: day.completedLessons > 0,
  }));

  return (
    <section className="home-tile home-goal" aria-labelledby="home-goal-title">
      <header className="home-tile__head">
        <h2 id="home-goal-title"><Target aria-hidden="true" />Weekly goal</h2>
        {goal ? <span className="home-pill">{done >= goal ? "Goal reached" : `${goal - done} to go`}</span> : null}
      </header>
      {goal ? (
        <>
          <div className="home-goal__value">
            <strong className="home-kpi home-kpi--md">{done}<small>/{goal}</small></strong>
            <span>lessons this week</span>
          </div>
          <Bar value={percent} label="Weekly goal progress" />
          <ol className="home-goal__days" aria-label="Study days this week">
            {dayLetters.map((day) => (
              <li key={day.key} className={day.active ? "is-active" : undefined} aria-label={`${day.label}: ${day.active ? "studied" : "no lessons"}`}>{day.label}</li>
            ))}
          </ol>
        </>
      ) : (
        <div className="home-goal__setup">
          <p>Set how many lessons you want to finish each week.</p>
          <div className="home-goal__presets" role="group" aria-label="Weekly lesson goal">
            {GOAL_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                disabled={setGoal.isPending || preferences.isLoading}
                onClick={() => setGoal.mutate({ weeklyLessonGoal: value, expectedVersion: preferences.data?.version ?? null })}
              >
                {value}
              </button>
            ))}
          </div>
          {setGoal.error ? <p className="home-goal__error" role="alert">Your goal couldn&apos;t be saved. Try again.</p> : null}
        </div>
      )}
    </section>
  );
}

function StreakTile({ progress }: { progress: StudentProgressSnapshotDto }) {
  const days = progress.currentStreakDays;
  const studiedToday = progress.weekDays.some((day) => new Date(day.date).toDateString() === new Date().toDateString() && day.completedLessons > 0);
  return (
    <section className="home-tile home-streak" aria-labelledby="home-streak-title">
      <header className="home-streak__head">
        <span className={`home-streak__flame${days > 0 ? " is-lit" : ""}`} aria-hidden="true"><Flame /></span>
        <h2 id="home-streak-title">Study streak</h2>
      </header>
      <div className="home-streak__copy">
        <p className="home-streak__value"><strong className="home-kpi home-kpi--md">{days}</strong> {days === 1 ? "day" : "days"}</p>
        <p className="home-streak__note">
          {days === 0 ? "Complete a lesson today to start a streak." : studiedToday ? "You studied today — streak is safe." : "Finish a lesson today to keep it going."}
        </p>
      </div>
      <p className="home-streak__best">Best streak <strong>{progress.longestStreakDays} days</strong></p>
    </section>
  );
}

function RailSkeleton() {
  return (
    <>
      {["progress", "goal", "streak"].map((key) => (
        <div key={key} className="home-tile home-tile--skeleton" aria-hidden="true">
          <span className="home-skel" style={{ width: 140, height: 16 }} />
          <span className="home-skel" style={{ width: 96, height: 40 }} />
          <span className="home-skel" style={{ width: "100%", height: 8 }} />
        </div>
      ))}
    </>
  );
}

/* ── Lower row: subjects, up next, activity ──────────────── */

function SubjectsPanel({ courses, progress }: { courses: readonly StudentCourseItem[]; progress: StudentProgressSnapshotDto | undefined }) {
  const enrolled = courses.filter((course) => course.access?.isEnrolled === true);
  return (
    <section className="home-tile home-subjects" aria-labelledby="home-subjects-title">
      <header className="home-tile__head">
        <h2 id="home-subjects-title"><Layers aria-hidden="true" />Your subjects <span className="home-count">{enrolled.length}</span></h2>
        <Link to="/my-courses" className="home-link">All courses<ArrowRight aria-hidden="true" /></Link>
      </header>
      <ul className="home-subjects__list">
        {enrolled.slice(0, 4).map((course) => {
          const item = progress?.courses.find((entry) => entry.courseId === course.courseId);
          const percent = Math.round(item?.completionPercent ?? 0);
          return (
            <li key={course.courseId}>
              <Link to={`/my-courses/${course.courseId}`} state={{ courseTitle: course.title, courseId: course.courseId }} className="home-subject">
                <img src={courseArtwork(course)} alt="" aria-hidden="true" />
                <span className="home-subject__copy">
                  <strong>{course.title}</strong>
                  <span>{item ? `${item.completedLessons}/${item.totalLessons} lessons` : `${course.lessonCount} lessons`} · {course.academicSemester.title}</span>
                </span>
                <span className="home-subject__progress">
                  <b>{percent}%</b>
                  <Bar value={percent} label={`${course.title} progress`} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface AgendaItem { id: string; title: string; context: string; at: string; kind: "assignment" | "event"; href: string }

function UpNextPanel() {
  const range = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + 14 * DAY_MS);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);
  const calendar = useStudentCalendar(range.from, range.to);
  const assignments = useStudentAssignments();

  const items = useMemo<AgendaItem[]>(() => {
    const now = Date.now();
    const fromAssignments = (assignments.data ?? [])
      .filter((item) => item.dueAt && !item.submission && new Date(item.dueAt).getTime() > now - DAY_MS)
      .map((item) => ({ id: `a-${item.id}`, title: item.title, context: item.courseTitle ?? "Assignment", at: item.dueAt as string, kind: "assignment" as const, href: `/assignments/${item.id}` }));
    const fromCalendar = (calendar.data ?? [])
      .filter((item) => item.source !== "assignment" && new Date(item.startsAt).getTime() >= now - 3_600_000)
      .map((item) => ({ id: `c-${item.id}`, title: item.title, context: item.courseTitle ?? item.type.replace(/_/g, " "), at: item.startsAt, kind: "event" as const, href: "/calendar" }));
    return [...fromAssignments, ...fromCalendar].sort((a, b) => a.at.localeCompare(b.at)).slice(0, 2);
  }, [assignments.data, calendar.data]);

  const loading = calendar.isLoading || assignments.isLoading;
  const failed = calendar.isError && assignments.isError;

  if (loading) {
    return (
      <section className="home-tile home-upnext" aria-busy="true" aria-label="Up next">
        <span className="home-skel" style={{ width: 120, height: 16 }} />
        {[0, 1, 2].map((key) => <span key={key} className="home-skel" style={{ width: "100%", height: 44 }} />)}
      </section>
    );
  }

  if (failed) {
    return (
      <section className="home-tile home-upnext home-upnext--compact" aria-label="Up next">
        <InlineError message="Schedule couldn't load." onRetry={() => { void calendar.refetch(); void assignments.refetch(); }} />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="home-tile home-upnext home-upnext--compact" aria-labelledby="home-upnext-title">
        <span className="home-upnext__icon" aria-hidden="true"><CalendarDays /></span>
        <div>
          <h2 id="home-upnext-title">Nothing due in the next 2 weeks</h2>
          <p>Deadlines and sessions will show up here.</p>
        </div>
        <Link to="/calendar" className="home-link">Open calendar<ArrowRight aria-hidden="true" /></Link>
      </section>
    );
  }

  return (
    <section className="home-tile home-upnext" aria-labelledby="home-upnext-title">
      <header className="home-tile__head">
        <h2 id="home-upnext-title"><CalendarDays aria-hidden="true" />Up next</h2>
        <Link to="/calendar" className="home-link">Calendar<ArrowRight aria-hidden="true" /></Link>
      </header>
      <ul className="home-agenda">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={item.href} className="home-agenda__row">
              <span className={`home-agenda__icon home-agenda__icon--${item.kind}`} aria-hidden="true">
                {item.kind === "assignment" ? <ClipboardCheck /> : <Clock3 />}
              </span>
              <span className="home-agenda__copy"><strong>{item.title}</strong><span>{item.context}</span></span>
              <span className={`home-agenda__when${new Date(item.at).getTime() - Date.now() < DAY_MS ? " is-soon" : ""}`}>{dueLabel(item.at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActivityPanel({ progress }: { progress: StudentProgressSnapshotDto }) {
  const items = progress.recentActivity.slice(0, 4);
  return (
    <section className="home-tile home-activity" aria-labelledby="home-activity-title">
      <header className="home-tile__head">
        <h2 id="home-activity-title"><CheckCircle2 aria-hidden="true" />Recent activity</h2>
      </header>
      {items.length === 0 ? (
        <p className="home-activity__empty">No lessons yet — the lessons you open or finish will show here.</p>
      ) : (
        <ul className="home-activity__list">
          {items.map((item) => (
            <li key={`${item.lessonId}-${item.occurredAt}`}>
              <Link to={`/my-courses/${item.courseId}/lessons/${item.lessonId}`} state={{ courseTitle: item.courseTitle, courseId: item.courseId }}>
                <span className={`home-activity__dot${item.status === "completed" ? " is-done" : ""}`} aria-hidden="true" />
                <span className="home-activity__copy">
                  <strong>{item.lessonTitle}</strong>
                  <span>{item.status === "completed" ? "Completed" : "In progress"} · {item.courseTitle}</span>
                </span>
                <time dateTime={item.occurredAt}>{relativeTime(item.occurredAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export function HomeDashboard({ courses }: { courses: readonly StudentCourseItem[] }) {
  const progress = useStudentProgress();
  const data = progress.data;
  const enrolledCount = courses.filter((course) => course.access?.isEnrolled === true).length;
  const isSparse = enrolledCount <= 2 && (data?.recentActivity.length ?? 0) === 0;

  return (
    <section className={`home-dashboard${isSparse ? " home-dashboard--sparse" : ""}`} aria-label="Learning dashboard">
      <div className="home-dashboard__main">
        <ContinueHero courses={courses} progress={data} progressLoading={progress.isLoading} />
        <div className="home-dashboard__rail">
          {progress.isLoading ? <RailSkeleton /> : progress.isError || !data ? (
            <div className="home-tile home-tile--error">
              <InlineError message="Progress couldn't load." onRetry={() => void progress.refetch()} />
            </div>
          ) : (
            <>
              <OverallProgressTile progress={data} />
              <div className="home-dashboard__pair">
                <WeeklyGoalTile progress={data} />
                <StreakTile progress={data} />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="home-dashboard__lower">
        <SubjectsPanel courses={courses} progress={data} />
        <div className="home-dashboard__side">
          <UpNextPanel />
          {data ? <ActivityPanel progress={data} /> : null}
        </div>
      </div>
    </section>
  );
}

export function HomeDashboardSkeletonV2() {
  return (
    <section className="home-dashboard" aria-busy="true" aria-label="Loading dashboard">
      <div className="home-dashboard__main">
        <HeroSkeleton />
        <div className="home-dashboard__rail"><RailSkeleton /></div>
      </div>
      <div className="home-dashboard__lower">
        <div className="home-tile home-tile--skeleton"><span className="home-skel" style={{ width: 160, height: 16 }} />{[0, 1, 2].map((k) => <span key={k} className="home-skel" style={{ width: "100%", height: 52 }} />)}</div>
        <div className="home-dashboard__side"><div className="home-tile home-tile--skeleton"><span className="home-skel" style={{ width: "100%", height: 44 }} /></div></div>
      </div>
    </section>
  );
}
