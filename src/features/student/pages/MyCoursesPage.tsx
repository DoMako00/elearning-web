import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Flame,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { COURSE_VISUAL_PRESETS, type StudentCourse } from "../../../components/ui/CourseLibrary/courses.data";
import type { StudentCourseItem } from "../api/studentCoursesApi";
import { useStudentCourseList } from "../api/useStudentCourses";
import { classifyStudentApiError } from "../api/studentApiErrors";
import type { StudentProgressCourseDto } from "../api/studentLearningApi";
import { useStudentProgress, useStudentSavedCourses, useToggleStudentSavedCourse } from "../api/useStudentLearning";
import "./MyCoursesPage.css";

export type { StudentCourse };

type StatusFilter = "all" | "in-progress" | "completed" | "saved";
type SortKey = "recent" | "progress" | "title";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Recently studied",
  progress: "Progress: high to low",
  title: "Title: A–Z",
};

/** Decorative artwork only. A course's subject category is never inferred
 * from its title; unmatched courses get no themed image at all. Generic
 * words such as "basics" are ignored so they cannot map to a subject. */
const GENERIC_VISUAL_KEYWORDS = new Set(["basics"]);
function imageFor(course: StudentCourseItem): string | null {
  const title = course.title.toLowerCase();
  const preset = COURSE_VISUAL_PRESETS.find((candidate) => candidate.keywords.some((keyword) => !GENERIC_VISUAL_KEYWORDS.has(keyword) && title.includes(keyword)));
  return preset?.image ?? null;
}

function CourseArt({ src, className }: { src: string | null; className?: string }) {
  return src
    ? <img className={className} src={src} alt="" aria-hidden="true" loading="lazy" />
    : <span className={`${className ?? ""} grid place-items-center bg-emerald-50 text-emerald-700`} aria-hidden="true"><BookOpen /></span>;
}

interface CourseRow {
  course: StudentCourseItem;
  progress: StudentProgressCourseDto | undefined;
  percent: number;
  completed: boolean;
  lastActivityAt: string | null;
  image: string | null;
  /** Unit label and code from the course DTO, e.g. "Module · ANA101". */
  label: string;
}

function routeState(course: StudentCourseItem) {
  return { courseTitle: course.title, courseId: course.courseId };
}

function Bar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="mc-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}>
      <span style={{ width: `${safe}%` }} />
    </div>
  );
}

function MyCoursesLoading() {
  return (
    <div className="mc-page" aria-busy="true" aria-label="Loading courses">
      <div className="mc-top">
        <div className="mc-feature mc-feature--skeleton"><span className="mc-skel" style={{ width: "100%", height: "100%" }} /></div>
        <div className="mc-summary"><span className="mc-skel" style={{ width: "60%", height: 20 }} /><span className="mc-skel" style={{ width: "100%", height: 120 }} /></div>
      </div>
      <div className="mc-grid">
        {[0, 1, 2, 3].map((key) => <div key={key} className="mc-card"><span className="mc-skel" style={{ width: "100%", height: 132 }} /><span className="mc-skel" style={{ width: "70%", height: 18, margin: 18 }} /></div>)}
      </div>
    </div>
  );
}

export function MyCoursesPage() {
  const navigate = useNavigate();
  const progressQuery = useStudentProgress();
  const savedQuery = useStudentSavedCourses();
  const toggleSaved = useToggleStudentSavedCourse();
  // Same scoped "mine" contract and cache as Home and mobile My Courses; the
  // catalogue is a separate "explore" read used only for "Available for your year".
  const mineQuery = useStudentCourseList("mine");
  const exploreQuery = useStudentCourseList("explore");
  const courses = useMemo(() => mineQuery.data ?? [], [mineQuery.data]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const progress = progressQuery.data;
  const savedIds = useMemo(() => new Set((savedQuery.data ?? []).map((item) => item.courseId)), [savedQuery.data]);

  const rows = useMemo<CourseRow[]>(() => courses
    .map((course) => {
      const entry = progress?.courses.find((item) => item.courseId === course.courseId);
      const percent = Math.round(entry?.completionPercent ?? 0);
      return {
        course,
        progress: entry,
        percent,
        completed: course.access?.enrollmentStatus === "completed" || percent >= 100,
        lastActivityAt: entry?.lastActivityAt ?? null,
        image: imageFor(course),
        label: [course.unitLabel, course.code].filter(Boolean).join(" · "),
      };
    }), [courses, progress]);

  const recommended = useMemo(() => {
    const enrolledIds = new Set(courses.map((course) => course.courseId));
    return (exploreQuery.data ?? []).filter((course) => !enrolledIds.has(course.courseId) && course.access?.isEnrolled !== true);
  }, [courses, exploreQuery.data]);

  const counts = {
    all: rows.length,
    "in-progress": rows.filter((row) => !row.completed).length,
    completed: rows.filter((row) => row.completed).length,
    saved: rows.filter((row) => savedIds.has(row.course.courseId)).length,
  };

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (filter === "in-progress" && row.completed) return false;
      if (filter === "completed" && !row.completed) return false;
      if (filter === "saved" && !savedIds.has(row.course.courseId)) return false;
      return !term || `${row.course.title} ${row.course.code}`.toLowerCase().includes(term);
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "progress") return b.percent - a.percent;
      if (sortBy === "title") return a.course.title.localeCompare(b.course.title);
      return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
    });
  }, [rows, filter, query, sortBy, savedIds]);

  const recentRow = useMemo(() => [...rows].sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""))[0], [rows]);
  const featured = rows.find((row) => row.course.courseId === featuredId) ?? recentRow;
  const featuredActivity = featured ? progress?.recentActivity.find((item) => item.courseId === featured.course.courseId) : undefined;

  const toggleBookmark = (course: StudentCourseItem) => {
    toggleSaved.mutate({ courseId: course.courseId, saved: !savedIds.has(course.courseId) });
  };

  if (mineQuery.isPending) return <MyCoursesLoading />;

  if (mineQuery.isError) {
    const failure = classifyStudentApiError(mineQuery.error);
    const retryable = failure.kind === "unavailable" || failure.kind === "unknown";
    return (
      <div className="mc-page">
        <div className="mc-notice mc-notice--error" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div><strong>{failure.kind === "unavailable" ? "We couldn’t load your courses" : failure.title}</strong><span>{failure.message}</span></div>
          {retryable ? <button type="button" className="mc-btn mc-btn--secondary" onClick={() => void mineQuery.refetch()}><RefreshCw aria-hidden="true" />Try again</button> : null}
        </div>
      </div>
    );
  }

  const featuredCanOpen = featured ? featured.course.access?.canOpen !== false : false;
  const featuredLessons = featured ? featured.course.lessonCount || featured.progress?.totalLessons || 0 : 0;
  const resumeHref = featured
    ? featuredActivity ? `/my-courses/${featured.course.courseId}/lessons/${featuredActivity.lessonId}` : `/my-courses/${featured.course.courseId}`
    : "/explore";

  return (
    <div className="mc-page">
      {featured ? (
        <div className="mc-top">
          <article className="mc-feature" aria-labelledby="mc-feature-title">
            <CourseArt className="mc-feature__img" src={featured.image} />
            <div className="mc-feature__body">
              <div className="mc-feature__meta">
                <span className="mc-tag">{featured.completed ? <><CheckCircle2 aria-hidden="true" />Completed</> : featuredActivity ? <><Play aria-hidden="true" />Continue where you left off</> : <><BookOpen aria-hidden="true" />Enrolled</>}</span>
                <span>{featured.course.academicInstitution.name} · {featured.course.academicLevel.title} · {featured.course.academicSemester.title}</span>
              </div>
              <h2 id="mc-feature-title">{featured.course.title}</h2>
              <p className="mc-feature__lesson">
                {featuredActivity ? <><small>{featuredActivity.status === "completed" ? "Last completed" : "Current lesson"}</small>{featuredActivity.lessonTitle}</> : !featuredCanOpen ? <><small>Enrolled</small>Lessons open once your academy publishes them</> : <><small>{featured.course.unitLabel}</small>{featured.course.chapterCount > 0 ? `${featured.course.chapterCount} chapters · ` : ""}{featuredLessons} lessons</>}
              </p>
              <div className="mc-feature__progress">
                <strong>{featured.percent}%</strong>
                <div>
                  <Bar value={featured.percent} label={`${featured.course.title} progress`} />
                  <span>{featured.progress ? `${featured.progress.completedLessons} of ${featured.progress.totalLessons} lessons complete` : `${featured.course.lessonCount} lessons`}</span>
                </div>
              </div>
              <div className="mc-feature__actions">
                {featuredCanOpen ? (
                  <>
                    <button type="button" className="mc-btn mc-btn--primary mc-btn--lg" onClick={() => navigate(resumeHref, { state: routeState(featured.course) })}>
                      <Play aria-hidden="true" />{featuredActivity ? "Resume lesson" : featured.completed ? "Review subject" : "Start subject"}
                    </button>
                    <Link className="mc-btn mc-btn--secondary mc-btn--lg" to={`/my-courses/${featured.course.courseId}`} state={routeState(featured.course)}>Course overview</Link>
                  </>
                ) : (
                  <>
                    <span className="mc-locked" role="status"><Clock3 aria-hidden="true" />Lessons not open yet</span>
                    <Link className="mc-btn mc-btn--secondary mc-btn--lg" to="/help">Ask for help</Link>
                  </>
                )}
                <button
                  type="button"
                  className={`mc-icon-btn${savedIds.has(featured.course.courseId) ? " is-saved" : ""}`}
                  aria-label={savedIds.has(featured.course.courseId) ? `Remove ${featured.course.title} from saved` : `Save ${featured.course.title}`}
                  aria-pressed={savedIds.has(featured.course.courseId)}
                  onClick={() => toggleBookmark(featured.course)}
                >
                  <Bookmark aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>

          <aside className="mc-summary" aria-labelledby="mc-summary-title">
            <h2 id="mc-summary-title">Your learning</h2>
            {progressQuery.isError ? (
              <p className="mc-summary__error"><AlertTriangle aria-hidden="true" />Progress couldn&apos;t load.<button type="button" onClick={() => void progressQuery.refetch()}>Retry</button></p>
            ) : (
              <>
                <div className="mc-summary__kpi">
                  <strong>{progress ? Math.round(progress.completionPercent) : "—"}<small>%</small></strong>
                  <span>overall completion</span>
                </div>
                <Bar value={progress?.completionPercent ?? 0} label="Overall completion" />
                <dl className="mc-summary__facts">
                  <div><dt><Layers aria-hidden="true" />Subjects</dt><dd>{rows.length}</dd></div>
                  <div><dt><CheckCircle2 aria-hidden="true" />Lessons done</dt><dd>{progress?.totalCompletedLessons ?? "—"}<span>/{progress?.totalLessons ?? "—"}</span></dd></div>
                  <div><dt><Flame aria-hidden="true" />Day streak</dt><dd>{progress?.currentStreakDays ?? "—"}</dd></div>
                  <div><dt><Clock3 aria-hidden="true" />This week</dt><dd>{progress?.weeklyCompletedLessons ?? "—"}<span> lessons</span></dd></div>
                </dl>
              </>
            )}
          </aside>
        </div>
      ) : (
        <div className="mc-notice">
          <Compass aria-hidden="true" />
          <div><strong>You&apos;re not enrolled in any subjects yet</strong><span>Browse subjects published for your academic year.</span></div>
          <Link className="mc-btn mc-btn--primary" to="/explore">Explore subjects<ArrowRight aria-hidden="true" /></Link>
        </div>
      )}

      {rows.length > 0 ? (
        <section className="mc-section" aria-labelledby="mc-list-title">
          <header className="mc-toolbar">
            <h2 id="mc-list-title">My subjects</h2>
            <div className="mc-tabs" role="tablist" aria-label="Filter subjects">
              {(["all", "in-progress", "completed", "saved"] as const).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? "is-active" : undefined} onClick={() => setFilter(key)}>
                  {{ all: "All", "in-progress": "In progress", completed: "Completed", saved: "Saved" }[key]}
                  <b>{counts[key]}</b>
                </button>
              ))}
            </div>
            <label className="mc-search">
              <Search aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects" aria-label="Search subjects" />
            </label>
            <div className="mc-sort" ref={sortRef}>
              <button type="button" aria-haspopup="listbox" aria-expanded={isSortOpen} onClick={() => setIsSortOpen((open) => !open)}>
                <Clock3 aria-hidden="true" />{SORT_LABELS[sortBy]}<ChevronDown aria-hidden="true" />
              </button>
              {isSortOpen ? (
                <ul role="listbox" aria-label="Sort subjects">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <li key={key} role="option" aria-selected={sortBy === key} tabIndex={0}
                      onClick={() => { setSortBy(key); setIsSortOpen(false); }}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSortBy(key); setIsSortOpen(false); } }}>
                      {SORT_LABELS[key]}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </header>

          {visibleRows.length === 0 ? (
            <p className="mc-empty">No subjects match this filter.{query ? <button type="button" onClick={() => setQuery("")}>Clear search</button> : null}</p>
          ) : (
            <ul className="mc-grid">
              {visibleRows.map((row) => {
                const isFeatured = featured?.course.courseId === row.course.courseId;
                return (
                  <li key={row.course.courseId} className={`mc-card${isFeatured ? " is-featured" : ""}`}>
                    <div className="mc-card__media">
                      <CourseArt src={row.image} />
                      {row.label ? <span className="mc-card__category">{row.label}</span> : null}
                      <button
                        type="button"
                        className={`mc-card__save${savedIds.has(row.course.courseId) ? " is-saved" : ""}`}
                        aria-label={savedIds.has(row.course.courseId) ? `Remove ${row.course.title} from saved` : `Save ${row.course.title}`}
                        aria-pressed={savedIds.has(row.course.courseId)}
                        onClick={() => toggleBookmark(row.course)}
                      >
                        <Bookmark aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mc-card__body">
                      <h3>{row.course.title}</h3>
                      <p>{row.course.academicLevel.title} · {row.course.academicSemester.title}</p>
                      <div className="mc-card__progress">
                        <Bar value={row.percent} label={`${row.course.title} progress`} />
                        <b>{row.percent}%</b>
                      </div>
                      <div className="mc-card__foot">
                        <span>{row.progress ? `${row.progress.completedLessons}/${row.progress.totalLessons} lessons` : `${row.course.lessonCount} lessons`}</span>
                        <div className="mc-card__actions">
                          {!isFeatured ? <button type="button" className="mc-text-btn" onClick={() => setFeaturedId(row.course.courseId)}>Feature</button> : null}
                          {row.course.access?.canOpen === false ? (
                            <span className="mc-lock"><Clock3 aria-hidden="true" />Not open yet</span>
                          ) : (
                            <Link to={`/my-courses/${row.course.courseId}`} state={routeState(row.course)} className="mc-card__cta">
                              {row.completed ? "Review" : row.percent > 0 ? "Continue" : "Start"}<ArrowRight aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {recommended.length > 0 ? (
        <section className="mc-section" aria-labelledby="mc-rec-title">
          <header className="mc-toolbar">
            <h2 id="mc-rec-title">Available for your year <span className="mc-count">{recommended.length}</span></h2>
            <Link className="mc-link" to="/explore">Explore all<ArrowRight aria-hidden="true" /></Link>
          </header>
          {rows.length <= 2 ? (
            <ul className="mc-grid mc-grid--catalogue">
              {recommended.map((course) => (
                <li key={course.courseId} className="mc-card mc-card--locked">
                  <div className="mc-card__media">
                    <CourseArt src={imageFor(course)} />
                    <span className="mc-card__category">{[course.unitLabel, course.code].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="mc-card__body">
                    <h3>{course.title}</h3>
                    <p>{course.academicInstitution.name} · {course.academicLevel.title} · {course.academicSemester.title}</p>
                    <div className="mc-card__foot">
                      <span>{course.lessonCount > 0 ? `${course.chapterCount} chapters · ${course.lessonCount} lessons` : "Lessons coming soon"}</span>
                      <span className="mc-lock"><Lock aria-hidden="true" />Not enrolled</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
          <ul className="mc-grid mc-grid--compact">
            {recommended.slice(0, 8).map((course) => (
              <li key={course.courseId} className="mc-row">
                <CourseArt src={imageFor(course)} />
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.chapterCount} chapters · {course.lessonCount} lessons</span>
                </div>
                <span className="mc-lock"><Lock aria-hidden="true" />Not enrolled</span>
              </li>
            ))}
          </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
