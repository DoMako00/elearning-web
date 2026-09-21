import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  ChevronDown,
  CirclePlay,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { useAuth } from "../../providers/AuthProvider";
import { CourseLibrary } from "../../../components/ui/CourseLibrary";
import { SearchBar } from "../../../components/ui/SearchBar";
import heroBackground from "../../../Assets/dashboard/my-courses-hero-background.png";
import { INITIAL_COURSES, type StudentCourse } from "../../../components/ui/CourseLibrary/courses.data";
import { listStudentCourses, type StudentCourseItem } from "../../../features/student/api/studentCoursesApi";

export type { StudentCourse };

const PACE_WEEKLY_DATA = [10, 18, 14, 22, 19, 28, 24, 30, 27, 30, 32, 40, 70, 78, 60, 32, 55, 56, 60, 50, 63, 65, 67, 72, 70, 80];
const PACE_MONTHLY_DATA = [25, 30, 35, 42, 48, 52, 55, 58, 60, 64, 68, 70, 75, 78, 80, 82, 85, 88];

const WEEK_SCHEDULE = [
  { day: "Mon", date: "12", hours: "2h planned", status: "completed" },
  { day: "Wed", date: "14", hours: "2h planned", status: "current" },
  { day: "Fri", date: "16", hours: "2h planned", status: "upcoming" },
];

const STUDENT_COURSE_BRAND = "elite" as const;

function normalizeCategory(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("anatomy")) return { label: "Anatomy", id: "anatomy" };
  if (lower.includes("histology")) return { label: "Histology", id: "histology" };
  if (lower.includes("physiology")) return { label: "Physiology", id: "physiology" };
  if (lower.includes("bio")) return { label: "Biochemistry", id: "biochemistry" };
  if (lower.includes("genetic") || lower.includes("cellular")) return { label: "Cell Biology", id: "histology" };
  return { label: "Medicine", id: "all" };
}

function visualPresetForCourse(course: StudentCourseItem) {
  const title = course.title.toLowerCase();
  return INITIAL_COURSES.find((item) => title.includes(item.categoryId) || title.includes(item.category.toLowerCase())) ?? INITIAL_COURSES[0];
}

function toDisplayCourse(course: StudentCourseItem): StudentCourse {
  const visual = visualPresetForCourse(course);
  const category = normalizeCategory(course.title);
  const subtitle = `${course.academicInstitution.name} • ${course.academicLevel.title} • ${course.academicSemester.title}`;
  const mediaReady = course.mediaSummary.lessonsWithMedia;

  return {
    id: course.courseId,
    title: course.title,
    subtitle,
    category: category.label,
    categoryId: category.id,
    level: course.unitLabel,
    progress: 0,
    lessonText: `${course.lessonCount} ${course.lessonCount === 1 ? "lesson" : "lessons"}`,
    completedLessons: 0,
    totalLessons: course.lessonCount,
    opened: mediaReady > 0 ? `${mediaReady} lessons have media metadata` : "Media coming soon",
    art: visual.art,
    image: visual.image,
    heroOverlay: visual.heroOverlay,
    Icon: visual.Icon,
    status: "in-progress",
    instructor: {
      initials: course.brand.code === "elite" ? "EL" : course.brand.name.slice(0, 2).toUpperCase(),
      name: course.brand.name,
      role: `${course.unitLabel}-based programme`,
    },
    summary: `${course.chapterCount} ${course.chapterCount === 1 ? "chapter" : "chapters"} • ${course.lessonCount} lessons`,
    slug: course.courseId,
  };
}
function buildPacePoints(values: number[]) {
  return values.map((value, index) => ({ index, value }));
}

interface PaceCustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
}

function PaceCustomTooltip({ active, payload }: PaceCustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pace-tooltip">
      {payload[0].value}%
    </div>
  );
}

export function MyCoursesPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [statusFilter, setStatusFilter] = useState<"in-progress" | "completed" | "saved">("in-progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"opened" | "progress" | "title">("opened");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [activeScheduleIndex, setActiveScheduleIndex] = useState<number>(1);
  const [isPaceMonthly, setIsPaceMonthly] = useState(false);

  const activeFocusCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null;
  }, [courses, selectedCourseId]);

  const inProgressCount = useMemo(() => courses.filter((c) => c.status === "in-progress").length, [courses]);
  const completedCount = useMemo(() => courses.filter((c) => c.status === "completed").length, [courses]);
  const savedCount = useMemo(() => courses.filter((c) => bookmarked[c.id]).length, [bookmarked, courses]);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (auth.status === "loading") {
      setIsCoursesLoading(true);
      return;
    }

    if (auth.status !== "authenticated") {
      setCourses([]);
      setSelectedCourseId("");
      setCoursesError(null);
      setIsCoursesLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsCoursesLoading(true);
    setCoursesError(null);
    listStudentCourses({ brand: STUDENT_COURSE_BRAND, page: 1, pageSize: 25, signal: controller.signal })
      .then((payload) => {
        const nextCourses = payload.items.map(toDisplayCourse);
        setCourses(nextCourses);
        setSelectedCourseId((current) => current || nextCourses[0]?.id || "");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setSelectedCourseId("");
        setCoursesError(error instanceof Error ? error.message : "The learning API request failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCoursesLoading(false);
      });

    return () => controller.abort();
  }, [auth.status]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pacePoints = buildPacePoints(isPaceMonthly ? PACE_MONTHLY_DATA : PACE_WEEKLY_DATA);

  const sortLabel = {
    opened: "Last opened",
    progress: "Progress: High to Low",
    title: "Title: A–Z",
  }[sortBy];

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
              />
            </div>
          </div>
        </header>

        {isCoursesLoading ? (
          <div className="dashboard-feedback" role="status">Loading your Elite subjects...</div>
        ) : auth.status !== "authenticated" ? (
          <div className="dashboard-feedback" role="status">
            <strong>Sign in to view your Elite subjects.</strong>
            <button type="button" onClick={() => navigate("/auth/sign-in", { state: { from: "/" } })}>Sign in</button>
          </div>
        ) : coursesError ? (
          <div className="dashboard-feedback dashboard-feedback--error" role="alert">{coursesError}</div>
        ) : !activeFocusCourse ? (
          <div className="dashboard-feedback" role="status">No Elite subjects are available for this student yet.</div>
        ) : (
        <div className="my-courses-overview">
          <article
            className="course-focus-card"
            aria-label={`Continue ${activeFocusCourse.title}`}
            style={{ backgroundImage: `url(${heroBackground})` }}
          >
            <div className="course-focus-card__art" aria-hidden="true">
              <img src={activeFocusCourse.heroOverlay} alt="" />
              <svg viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
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
              </svg>
            </div>

            <div className="course-focus-card__content">
              <span className={`course-focus-card__status ${activeFocusCourse.status === "completed" ? "!bg-[#16a34a]! !text-white!" : ""}`}>
                {activeFocusCourse.status === "completed" ? "Completed" : "In progress"}
              </span>
              <h2>{activeFocusCourse.title}</h2>
              <p className="course-focus-card__subtitle">{activeFocusCourse.subtitle}</p>
              <p className="course-focus-card__lesson">{activeFocusCourse.lessonText}</p>
              <div className="course-focus-card__progress">
                <i><b style={{ width: `${activeFocusCourse.progress}%` }} /></i>
                <strong>{activeFocusCourse.progress}%</strong>
              </div>
              <div className="course-focus-card__instructor">
                <span>{activeFocusCourse.instructor.initials}</span>
                <div>
                  <b>{activeFocusCourse.instructor.name}</b>
                  <small>{activeFocusCourse.instructor.role}</small>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="course-focus-card__play cursor-pointer"
              aria-label={`Play ${activeFocusCourse.title}`}
              onClick={() => navigate(`/my-courses/${activeFocusCourse.slug}`)}
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
                  onClick={() => navigate(`/my-courses/${activeFocusCourse.slug}`)}
                >
                  {activeFocusCourse.status === "completed" ? "Review Course" : "Continue Lesson"} <ArrowRight aria-hidden="true" />
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
              <div className="week-days" role="tablist" aria-label="Study days">
                {WEEK_SCHEDULE.map((item, idx) => (
                  <span
                    key={item.day}
                    onClick={() => setActiveScheduleIndex(idx)}
                    className={`cursor-pointer transition-all ${idx === activeScheduleIndex ? "is-current" : ""}`}
                    role="tab"
                    aria-selected={idx === activeScheduleIndex}
                  >
                    {item.day}
                    <b>{item.date}</b>
                    <small>{item.hours}</small>
                  </span>
                ))}
              </div>
              <footer>
                <Clock3 aria-hidden="true" />
                <b>6h planned</b>
                <span>Focus. Learn. Grow.</span>
              </footer>
            </article>

            <article className="course-summary course-summary--pace">
              <header className="flex justify-between items-start">
                <div>
                  <h2>Your pace</h2>
                  <strong>0%</strong>
                  <small>Course completion rate</small>
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
              <div className="pace-chart-container">
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
                    <YAxis domain={[0, 100]} hide width={0} />
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
                Progress starts after lesson completion
              </p>
            </article>
          </div>
        </div>
        )}

        {!isCoursesLoading && !coursesError && courses.length > 0 ? (
        <CourseLibrary
          courses={courses}
          unitLabel="subject"
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          sortBy={sortBy}
          bookmarked={bookmarked}
          selectedCourseId={selectedCourseId}
          onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
          onToggleBookmark={toggleBookmark}
          onClearSearch={() => setSearchQuery("")}
        />
        ) : null}
      </div>
    </section>
  );
}
