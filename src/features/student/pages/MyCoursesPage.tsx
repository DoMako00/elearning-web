import { canViewCourseDetails } from "../api/studentCoursesApi";
import { ArrowRight, Bookmark, CalendarDays, ChevronDown, CirclePlay, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { useAuth } from "../../../app/providers/AuthProvider";
import { CourseLibrary } from "../../../components/ui/CourseLibrary";
import { SearchBar } from "../../../components/ui/SearchBar";
import { MyCoursesSkeleton } from "../../../components/ui/Skeleton";
import heroBackground from "../../../Assets/dashboard/my-courses-hero-background.webp";
import { useStudentCourseList } from "../api/useStudentCourses";
import { useStudentProgress, useStudentSavedCourses, useToggleStudentSavedCourse } from "../api/useStudentLearning";
import { classifyStudentApiError } from "../api/studentApiErrors";
import type { StudentCourse } from "../../../components/ui/CourseLibrary/courses.data";
import { toReferenceCourse } from "./referenceCourseMapper";
export type { StudentCourse };

function courseRouteState(course: StudentCourse) { return { courseTitle: course.title, courseId: course.id }; }
function PaceCustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{value: number}> }) {
  return active && payload?.length ? <div className="pace-tooltip">{payload[0].value} lessons</div> : null;
}

export function MyCoursesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const mine = useStudentCourseList("mine");
  const explore = useStudentCourseList("explore");
  const progressQuery = useStudentProgress();
  const saved = useStudentSavedCourses();
  const save = useToggleStudentSavedCourse();
  const [statusFilter, setStatusFilter] = useState<"in-progress" | "completed" | "saved">("in-progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"opened" | "progress" | "title">("opened");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isPaceMonthly, setIsPaceMonthly] = useState(false);
  const bookmarked = useMemo(() => Object.fromEntries((saved.data ?? []).map((item) => [item.courseId, true])), [saved.data]);
  const enrolledCourses = useMemo(() => [...(mine.data ?? [])].sort((a,b) => {
    const activity = (id: string) => progressQuery.data?.courses.find(item => item.courseId === id)?.lastActivityAt ?? "";
    return activity(b.courseId).localeCompare(activity(a.courseId));
  }).map(course => toReferenceCourse(course, progressQuery.data)), [mine.data, progressQuery.data]);
  const recommendedCourses = useMemo(() => (explore.data ?? []).filter(course => !mine.data?.some(item => item.courseId === course.courseId)).map(course => toReferenceCourse(course, progressQuery.data)), [explore.data, mine.data, progressQuery.data]);
  const recommendedCourseIds = recommendedCourses.map(course => course.id);
  const activeFocusCourse = enrolledCourses.find(course => course.id === selectedCourseId) ?? enrolledCourses[0] ?? null;
  const canViewFocusCourse = Boolean(activeFocusCourse?.access && canViewCourseDetails({access: activeFocusCourse.access}));
  const inProgressCount = enrolledCourses.filter(course => course.status === "in-progress").length;
  const completedCount = enrolledCourses.filter(course => course.status === "completed").length;
  const savedCount = [...enrolledCourses, ...recommendedCourses].filter(course => bookmarked[course.id]).length;
  const isCoursesLoading = mine.isPending;
  const coursesError = mine.isError ? classifyStudentApiError(mine.error).message : null;
  const canRetry = !mine.isError || ["unavailable", "unknown"].includes(classifyStudentApiError(mine.error).kind);
  const toggleBookmark = (courseId: string) => save.mutate({ courseId, saved: !bookmarked[courseId] });
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!sortRef.current?.contains(event.target as Node)) setIsSortOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  // The API provides a seven-day window only; a monthly series is never invented.
  const pacePoints = isPaceMonthly ? [] : (progressQuery.data?.weekDays ?? []).map(day => ({value: day.completedLessons}));
  const sortLabel = { opened: "Last opened", progress: "Progress: High to Low", title: "Title: A–Z" }[sortBy];
  return (
    <section className="student-page student-page--courses" aria-labelledby="my-courses-title">
      <div className="my-courses-workspace">
        <header className="my-courses-heading">
          <div className="my-courses-heading__controls" aria-label="Course status controls">
            <div className="course-status-tabs" role="tablist" aria-label="Course status">
              <button
                type="button"
                className={`course-status-tabs__tab ${statusFilter === "in-progress" ? "is-active" : ""}`}
                role="tab"
                aria-selected={statusFilter === "in-progress"}
                onClick={() => setStatusFilter("in-progress")}
              >
                In progress <b>{inProgressCount}</b>
              </button>
              <button
                type="button"
                className={`course-status-tabs__tab ${statusFilter === "completed" ? "is-active" : ""}`}
                role="tab"
                aria-selected={statusFilter === "completed"}
                onClick={() => setStatusFilter("completed")}
              >
                Completed <b>{completedCount}</b>
              </button>
              <button
                type="button"
                className={`course-status-tabs__tab ${statusFilter === "saved" ? "is-active" : ""}`}
                role="tab"
                aria-selected={statusFilter === "saved"}
                onClick={() => setStatusFilter("saved")}
              >
                Saved <b>{savedCount}</b>
              </button>
            </div>

            <div className="relative" ref={sortRef}>
              <button
                type="button"
                className="course-sort cursor-pointer inline-flex items-center gap-2"
                aria-label="Sort courses"
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <Clock3 aria-hidden="true" />
                <span>{sortLabel}</span>
                <ChevronDown aria-hidden="true" className={`size-3.5 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortOpen && (
                <ul
                  className="absolute top-[calc(100%+6px)] right-0 z-30 min-w-47.5 p-1.5 list-none bg-white border border-[#dfe9e3] rounded-xl shadow-lg"
                  role="listbox"
                  aria-label="Sort options"
                >
                  <li
                    role="option"
                    aria-selected={sortBy === "opened"}
                    tabIndex={0}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSortBy("opened"); setIsSortOpen(false); } }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                      sortBy === "opened" ? "bg-[#eefaf2] text-[#15803d]" : "text-[#334155] hover:bg-[#f8faf9]"
                    }`}
                    onClick={() => {
                      setSortBy("opened");
                      setIsSortOpen(false);
                    }}
                  >
                    Last opened
                  </li>
                  <li
                    role="option"
                    aria-selected={sortBy === "progress"}
                    tabIndex={0}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSortBy("progress"); setIsSortOpen(false); } }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                      sortBy === "progress" ? "bg-[#eefaf2] text-[#15803d]" : "text-[#334155] hover:bg-[#f8faf9]"
                    }`}
                    onClick={() => {
                      setSortBy("progress");
                      setIsSortOpen(false);
                    }}
                  >
                    Progress: High to Low
                  </li>
                  <li
                    role="option"
                    aria-selected={sortBy === "title"}
                    tabIndex={0}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSortBy("title"); setIsSortOpen(false); } }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                      sortBy === "title" ? "bg-[#eefaf2] text-[#15803d]" : "text-[#334155] hover:bg-[#f8faf9]"
                    }`}
                    onClick={() => {
                      setSortBy("title");
                      setIsSortOpen(false);
                    }}
                  >
                    Title: A–Z
                  </li>
                </ul>
              )}
            </div>

            <div className="my-courses-heading__search">
              <SearchBar
                value={searchQuery}
                placeholder="Search your courses..."
                onChange={(val) => setSearchQuery(val)}
                isLoading={isCoursesLoading}
              />
            </div>
          </div>
        </header>

        {isCoursesLoading ? (
          <MyCoursesSkeleton />
        ) : auth.status !== "authenticated" ? (
          <div className="dashboard-feedback" role="status">
            <strong>Sign in to view your courses.</strong>
            <button type="button" onClick={() => navigate("/auth/sign-in", { state: { from: "/" } })}>Sign in</button>
          </div>
        ) : coursesError ? (
          <div className="dashboard-feedback dashboard-feedback--error" role="alert">
            <span>{coursesError}</span>
            {canRetry ? <button type="button" onClick={() => void mine.refetch()}>Try again</button> : null}
          </div>
        ) : !activeFocusCourse ? (
          <div className="dashboard-feedback" role="status">No enrolled subjects are available for this student yet.</div>
        ) : (
        <div className="my-courses-overview">
          <article
            className="course-focus-card"
            aria-label={`Continue ${activeFocusCourse.title}`}
            style={{ backgroundImage: `url(${heroBackground})` }}
          >
            <div className="course-focus-card__art" aria-hidden="true">
              {activeFocusCourse.heroOverlay ? <img src={activeFocusCourse.heroOverlay} alt="" /> : null}
              {activeFocusCourse.art === "anatomy" ? <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
                <g className="course-focus-card__grid">
                  <path d="M17 70H170M17 103H170M17 136H170M17 169H170M17 202H170M17 235H170M17 268H170M206 28V295M258 28V295M310 28V295M362 28V295M414 28V295M466 28V295" />
                </g>
                <g className="course-focus-card__labels">
                  <path d="M31 77H160M31 132H160M31 187H160" />
                  <text x="34" y="68">SKELETAL SYSTEM</text>
                  <text x="34" y="123">MUSCULAR SYSTEM</text>
                  <text x="34" y="178">BODY STRUCTURE</text>
                </g>
                <g className="course-focus-card__skeleton">
                  <circle cx="350" cy="71" r="36" />
                  <path d="M325 69h50M350 37v67M332 95l-23 35 18 15 23-20 23 20 18-15-23-35M350 107v59M327 136l-13 66M373 136l13 66M350 166l-28 85M350 166l28 85M317 205l-13 65M383 205l13 65" />
                  <path d="M322 117q28 33 56 0M323 128q27 34 54 0M328 140q22 26 44 0" />
                  <path d="M340 61h20M342 82h16" />
                </g>
                <g className="course-focus-card__molecules">
                  <circle cx="455" cy="77" r="8" />
                  <circle cx="477" cy="96" r="5" />
                  <circle cx="449" cy="116" r="6" />
                  <path d="M460 83 473 92M472 100 454 112" />
                  <circle cx="431" cy="181" r="6" />
                  <circle cx="462" cy="190" r="9" />
                  <path d="M437 183 453 188" />
                </g>
              </svg> : null}
            </div>

            <div className="course-focus-card__content">
              <span className={`course-focus-card__status ${activeFocusCourse.status === "completed" ? "!bg-[#16a34a]! !text-white!" : ""}`}>
                {activeFocusCourse.status === "completed" ? "Completed" : "Enrolled"}
              </span>
              <h2>{activeFocusCourse.title}</h2>
              <p className="course-focus-card__subtitle">{activeFocusCourse.subtitle}</p>
              <p className="course-focus-card__lesson">{activeFocusCourse.lessonText}</p>
              <p className="course-focus-card__availability">{activeFocusCourse.opened}</p>
            </div>

            <button
              type="button"
              className="course-focus-card__play cursor-pointer"
              aria-label={canViewFocusCourse ? `Open ${activeFocusCourse.title}` : `${activeFocusCourse.title} details unavailable`}
              disabled={!canViewFocusCourse}
              onClick={() => { if (canViewFocusCourse) navigate(`/my-courses/${activeFocusCourse.slug}`, { state: courseRouteState(activeFocusCourse) }); }}
            >
              <CirclePlay aria-hidden="true" />
            </button>

            <footer className="course-focus-card__footer">
              <div>
                <small>Course overview</small>
                <b>{activeFocusCourse.summary}</b>
              </div>
              <div className="course-focus-card__actions">
                <button
                  type="button"
                  className={`course-focus-card__bookmark cursor-pointer ${bookmarked[activeFocusCourse.id] ? "is-saved text-[#79f3ae]" : ""}`}
                  aria-label={`Save ${activeFocusCourse.title}`}
                  onClick={() => toggleBookmark(activeFocusCourse.id)}
                >
                  <Bookmark
                    aria-hidden="true"
                    className={bookmarked[activeFocusCourse.id] ? "fill-current" : ""}
                  />
                </button>
                <button
                  type="button"
                  className="cursor-pointer"
                  disabled={!canViewFocusCourse}
                  onClick={() => { if (canViewFocusCourse) navigate(`/my-courses/${activeFocusCourse.slug}`, { state: courseRouteState(activeFocusCourse) }); }}
                >
                  {canViewFocusCourse ? (activeFocusCourse.status === "completed" ? "Review Subject" : "Open Subject") : "Details unavailable"} <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </footer>
          </article>

          <div className="my-courses-overview__summaries">
            <article className="course-summary course-summary--week">
              <header>
                <h2>This week</h2>
                <CalendarDays aria-hidden="true" />
              </header>
              <div className="week-days" role="status">
                <p>{progressQuery.isLoading ? "Loading your activity…" : progressQuery.isError ? "Your activity could not be loaded." : `${progressQuery.data?.weeklyCompletedLessons ?? 0} lessons completed this week.`}</p>
              </div>
              <footer>
                <Clock3 aria-hidden="true" />
                <b>Weekly activity</b>
                <span>{progressQuery.data ? "Based on recorded lesson activity." : "Activity is currently unavailable."}</span>
              </footer>
            </article>

            <article className="course-summary course-summary--pace">
              <header className="flex justify-between items-start">
                <div>
                  <h2>Your pace</h2>
                  <strong>{progressQuery.data ? `${progressQuery.data.completionPercent}%` : "—"}</strong>
                  <small>Overall completion</small>
                </div>
                <div className="pace-header-actions">
                  <div className="pace-switch" role="group" aria-label="Pace timeframe selector">
                    <button
                      type="button"
                      className={`pace-switch__btn ${!isPaceMonthly ? "is-active" : ""}`}
                      onClick={() => setIsPaceMonthly(false)}
                      aria-pressed={!isPaceMonthly}
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      className={`pace-switch__btn ${isPaceMonthly ? "is-active" : ""}`}
                      onClick={() => setIsPaceMonthly(true)}
                      aria-pressed={isPaceMonthly}
                    >
                      Monthly
                    </button>
                  </div>
                  <TrendingUp aria-hidden="true" />
                </div>
              </header>
              <div className="pace-chart-container" role="status" aria-label={isPaceMonthly ? "Monthly activity is unavailable" : "Recorded weekly lesson activity"}>
                {isPaceMonthly || progressQuery.isError ? <p>{isPaceMonthly ? "Monthly activity is not available." : "Activity could not be loaded."}</p> : null}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={pacePoints}
                    margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
                  >
                    <defs>
                      <linearGradient id="paceFillGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#24ad68" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#24ad68" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={[0, "auto"]} hide width={0} />
                    <Tooltip content={<PaceCustomTooltip />} cursor={false} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#24ad68"
                      strokeWidth={2.5}
                      fill="url(#paceFillGradient)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "#24ad68",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p>
                <Sparkles aria-hidden="true" />
                {isPaceMonthly ? "Select Weekly to see recorded activity" : "Based on your completed lessons this week"}
              </p>
            </article>
          </div>
        </div>
        )}

        {!isCoursesLoading && !coursesError && enrolledCourses.length > 0 ? (
          <CourseLibrary courses={[...enrolledCourses, ...recommendedCourses]} unitLabel="course" statusFilter={statusFilter} searchQuery={searchQuery} sortBy={sortBy}
            bookmarked={bookmarked} selectedCourseId={selectedCourseId} onSelectCourse={setSelectedCourseId}
            lockedCourseIds={recommendedCourseIds}
            onToggleBookmark={toggleBookmark} onClearSearch={() => setSearchQuery("")} />
        ) : null}
      </div>
    </section>
  );
}
