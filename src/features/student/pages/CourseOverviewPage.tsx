import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CirclePlay,
  LayoutGrid,
  MessageSquareText,
  Paperclip,
  Play,
  StickyNote,
  FolderOpen,
} from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Skeleton, SkeletonText, SkeletonAvatar } from "../../../components/ui/Skeleton";
import { CourseDiscussionPanel } from "../../../components/learning-space/CourseDiscussionPanel";
import { CourseResourcesPanel } from "../../../components/learning-space/CourseResourcesPanel";
import {
  DiscussionWorkspaceRail,
  NotesWorkspaceRail,
  ResourcesWorkspaceRail,
} from "../../../components/learning-space/LearningSpaceRails";
import { LearningNotesPanel } from "../../../components/learning-space/LearningNotesPanel";
import { mapCourseModules, mapCourseResources } from "../../../components/learning-space/learningSpaceMappers";
import { studentInstructorApi } from "../api/studentInstructorApi";
import {
  getStudentCourse,
  type StudentCourseDetail,
  type StudentLessonItem,
} from "../api/studentCoursesApi";
import { useStudentProgress, useStudentSavedCourses, useToggleStudentSavedCourse } from "../api/useStudentLearning";
import "../../../components/learning-space/learningSpace.css";
import "./CourseOverviewPage.css";
import "./CourseDetail.css";
import { courseArtwork } from "../components/HomeDashboard/HomeDashboard";
import { useStudentAssignments } from "../api/useStudentAssignments";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "resources", label: "Resources", icon: Paperclip },
  { id: "discussion", label: "Discussion", icon: MessageSquareText },
] as const;

type CourseTabId = (typeof TABS)[number]["id"];

export interface CourseOverviewPageProps {
  onStartLesson?: (lessonId: string) => void;
}

function InstructorPortrait() {
  return (
    <span className="course-overview-hero__portrait" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="presentation">
        <circle cx="24" cy="16" r="8" />
        <path d="M11 44c1-11 5-17 13-17s12 6 13 17" />
        <path d="m17 29 7 8 7-8M24 37v7" />
        <path d="M11 44h26" />
      </svg>
    </span>
  );
}

function toLessonLabel(lesson: StudentLessonItem) {
  if (lesson.mediaStatus === "pending_media") return "Pending media";
  if (lesson.mediaStatus === "ready") return "Ready soon";
  return "No media";
}

function FeedbackState({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  const notFound = /not found/i.test(message);
  return (
    <section className="route-notice-page" aria-labelledby="course-overview-title">
      <div className={`route-notice${tone === "error" ? " route-notice--error" : ""}`} role={tone === "error" ? "alert" : "status"}>
        <span className="route-notice__icon" aria-hidden="true"><BookOpen /></span>
        <div className="route-notice__copy">
          <h2 id="course-overview-title">{notFound ? "This subject isn't open yet" : "We couldn't open this subject"}</h2>
          <p>{notFound ? "Its lessons haven't been published for your account. Your enrollment isn't affected." : message}</p>
        </div>
        <div className="route-notice__actions">
          <Link to="/my-courses" className="route-notice__btn route-notice__btn--primary">Back to My Courses</Link>
          {tone === "error" && !notFound ? <button type="button" className="route-notice__btn" onClick={() => window.location.reload()}>Try again</button> : <Link to="/help" className="route-notice__btn">Get help</Link>}
        </div>
      </div>
    </section>
  );
}

function CourseOverviewSkeleton() {
  return (
    <section className="course-overview-page" aria-busy="true" aria-label="Loading course overview">
      <div className="course-overview-layout">
        <div className="course-overview-primary">
          <div className="course-overview-hero bg-white border border-[#dfe9e4] rounded-2xl p-6 flex flex-col justify-between" style={{ minHeight: "340px" }}>
            <div className="space-y-4 max-w-xl">
              <Skeleton width={160} height={24} borderRadius={999} />
              <Skeleton width="85%" height={32} borderRadius={6} />
              <div className="flex gap-3">
                <Skeleton width={120} height={16} borderRadius={4} />
                <Skeleton width={100} height={16} borderRadius={4} />
              </div>
            </div>
            <div className="pt-6 border-t border-[#edf3f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonAvatar size={44} />
                <div className="space-y-1.5">
                  <Skeleton width={140} height={14} borderRadius={4} />
                  <Skeleton width={90} height={12} borderRadius={4} />
                </div>
              </div>
              <Skeleton width={150} height={40} borderRadius={10} />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Skeleton width={100} height={36} borderRadius={8} />
            <Skeleton width={90} height={36} borderRadius={8} />
            <Skeleton width={100} height={36} borderRadius={8} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-5 rounded-2xl border border-[#dfe9e4] bg-white space-y-3">
              <Skeleton width="40%" height={20} borderRadius={4} />
              <SkeletonText lines={3} />
            </div>
            <div className="p-5 rounded-2xl border border-[#dfe9e4] bg-white space-y-3">
              <Skeleton width="50%" height={20} borderRadius={4} />
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>

        <aside className="course-overview-rail space-y-3" style={{ minWidth: "300px" }}>
          <div className="p-5 rounded-2xl border border-[#dfe9e4] bg-white space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton width={120} height={18} borderRadius={4} />
              <Skeleton width={60} height={14} borderRadius={4} />
            </div>
            <div className="space-y-2.5">
              <Skeleton width="100%" height={44} borderRadius={10} />
              <Skeleton width="100%" height={44} borderRadius={10} />
              <Skeleton width="100%" height={44} borderRadius={10} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function CourseOverviewPage({ onStartLesson }: CourseOverviewPageProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const courseId = slug ?? "";
  const [activeTab, setActiveTab] = useState<CourseTabId>("overview");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [course, setCourse] = useState<StudentCourseDetail | null>(null);
  const [lessons, setLessons] = useState<readonly StudentLessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const progressQuery = useStudentProgress();
  const savedCoursesQuery = useStudentSavedCourses();
  const toggleSavedCourse = useToggleStudentSavedCourse();
  const instructorQuery = useQuery({ queryKey: ["student", "instructors"], queryFn: ({ signal }) => studentInstructorApi.list(signal), enabled: auth.status === "authenticated" });
  const assignmentsQuery = useStudentAssignments();
  const isBookmarked = savedCoursesQuery.data?.some((item) => item.courseId === courseId) ?? false;
  const courseProgress = progressQuery.data?.courses.find((item) => item.courseId === courseId);
  const progressPercent = progressQuery.isSuccess ? (courseProgress?.completionPercent ?? 0) : null;

  useEffect(() => {
    if (!courseId) {
      setError("A valid course identifier is required.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    void getStudentCourse({ courseId, signal: controller.signal })
      .then((nextCourse) => {
        if (controller.signal.aborted) return;
        setCourse(nextCourse);
        setLessons(nextCourse.chapters.flatMap((chapter) => chapter.lessons));
        const resumeLesson = nextCourse.chapters.flatMap((chapter) => chapter.lessons)
          .find((lesson) => lesson.progressStatus !== "completed" && lesson.playbackAvailable);
        setExpandedModuleId(resumeLesson?.chapterId ?? nextCourse.chapters[0]?.chapterId ?? null);
      })
      .catch((nextError: unknown) => {
        if (controller.signal.aborted) return;
        setCourse(null);
        setLessons([]);
        setError(nextError instanceof Error ? nextError.message : "The course could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [courseId]);

  const learningSpaceModules = useMemo(() => course ? mapCourseModules(course) : [], [course]);
  const learningSpaceResources = useMemo(() => course ? mapCourseResources(course) : [], [course]);
  const firstLesson = lessons[0] ?? course?.chapters[0]?.lessons[0] ?? null;
  const totalLessons = lessons.length || course?.lessonCount || 0;
  const assignedInstructor = instructorQuery.data?.find((item) => item.courses.some((assigned) => assigned.courseId === courseId));

  const startLesson = (lessonId: string) => {
    onStartLesson?.(lessonId);
    navigate(`/my-courses/${courseId}/lessons/${lessonId}`, { state: { courseTitle: course?.title, courseId } });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabIndex: number) => {
    let nextIndex = tabIndex;

    if (event.key === "ArrowRight") nextIndex = (tabIndex + 1) % TABS.length;
    else if (event.key === "ArrowLeft") nextIndex = (tabIndex - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = TABS.length - 1;
    else return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab.id);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`#course-overview-tab-${nextTab.id}`)
      ?.focus();
  };

  const toggleBookmark = () => toggleSavedCourse.mutate({ courseId, saved: !isBookmarked });

  if (isLoading) return <CourseOverviewSkeleton />;
  if (error) return <FeedbackState message={error} tone="error" />;
  if (!course) return <FeedbackState message="This course is not available for this student." />;

  const allLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const completedCount = allLessons.filter((lesson) => lesson.progressStatus === "completed").length;
  const nextLesson = allLessons.find((lesson) => lesson.progressStatus === "in_progress" && lesson.playbackAvailable)
    ?? allLessons.find((lesson) => lesson.progressStatus !== "completed" && lesson.playbackAvailable)
    ?? allLessons.find((lesson) => lesson.playbackAvailable)
    ?? null;
  const nextChapterIndex = nextLesson ? course.chapters.findIndex((chapter) => chapter.chapterId === nextLesson.chapterId) : -1;
  const hasStarted = allLessons.some((lesson) => lesson.progressStatus !== "not_started");
  const percent = progressPercent === null ? Math.round(totalLessons ? (completedCount / totalLessons) * 100 : 0) : Math.round(progressPercent);
  const courseAssignments = (assignmentsQuery.data ?? []).filter((item) => item.courseId === courseId);
  const lessonStatusLabel = (lesson: StudentLessonItem) => lesson.progressStatus === "completed" ? "Completed"
    : lesson.progressStatus === "in_progress" ? "In progress"
      : lesson.playbackAvailable ? (lesson.resourceType === "pdf" ? "Reading" : "Ready") : toLessonLabel(lesson);

  const tabList = (
    <div className="course-overview-tabs cd-tabs" role="tablist" aria-label="Course sections">
      {TABS.map(({ id, label, icon: Icon }, index) => (
        <button
          type="button"
          role="tab"
          id={`course-overview-tab-${id}`}
          aria-selected={activeTab === id}
          aria-controls={`course-overview-panel-${id}`}
          tabIndex={activeTab === id ? 0 : -1}
          className={activeTab === id ? "is-active" : ""}
          key={id}
          onClick={() => setActiveTab(id)}
          onKeyDown={(event) => handleTabKeyDown(event, index)}
        >
          <Icon aria-hidden="true" /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <section className={`course-overview-page cd-page${activeTab === "overview" ? " cd-page--overview" : ""}`} aria-labelledby="cd-title">
      <header className={`cd-hero${activeTab === "overview" ? "" : " cd-hero--compact"}`}>
        <img className="cd-hero__art" src={courseArtwork(course)} alt="" aria-hidden="true" />
        <div className="cd-hero__body">
          <div className="cd-hero__meta">
            <span className="cd-chip"><CirclePlay aria-hidden="true" />{course.unitLabel}</span>
            <span>{course.academicInstitution.name} · {course.academicLevel.title} · {course.academicSemester.title}</span>
          </div>
          <h2 id="cd-title">{course.title}</h2>
          {activeTab === "overview" ? (
            <p className="cd-hero__instructor">
              <InstructorPortrait />
              <span><strong>{assignedInstructor?.displayName ?? "No instructor assigned yet"}</strong><small>{assignedInstructor ? "Instructor" : "Instructor details appear once assigned"}</small></span>
            </p>
          ) : null}
        </div>
        <dl className="cd-hero__stats">
          <div><dt>Progress</dt><dd>{progressQuery.isLoading ? "—" : `${percent}%`}</dd></div>
          <div><dt>Chapters</dt><dd>{course.chapterCount}</dd></div>
          <div><dt>Lessons</dt><dd>{totalLessons}</dd></div>
          <div><dt>With media</dt><dd>{course.mediaSummary.lessonsWithMedia}</dd></div>
        </dl>
        <div className="cd-hero__actions">
          <button type="button" className="cd-btn cd-btn--hero" disabled={!nextLesson} onClick={() => nextLesson && startLesson(nextLesson.lessonId)}>
            <Play aria-hidden="true" />
            {nextLesson ? (hasStarted ? "Resume lesson" : "Start first lesson") : "Lessons coming soon"}
          </button>
          <button
            type="button"
            className={`cd-icon-btn${isBookmarked ? " is-saved" : ""}`}
            aria-label={isBookmarked ? "Remove course from saved" : "Save course"}
            aria-pressed={isBookmarked}
            onClick={toggleBookmark}
            disabled={savedCoursesQuery.isLoading || toggleSavedCourse.isPending}
          >
            <Bookmark aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
        {savedCoursesQuery.isError || toggleSavedCourse.isError ? <p className="cd-hero__error" role="alert">Saved courses couldn&apos;t be updated. Try again.</p> : null}
      </header>

      {tabList}

      {activeTab === "overview" ? (
        <div className="course-overview-panel cd-overview" role="tabpanel" id="course-overview-panel-overview" aria-labelledby="course-overview-tab-overview">
          <section className="cd-card cd-curriculum" aria-labelledby="cd-curriculum-title">
            <header className="cd-card__head">
              <h3 id="cd-curriculum-title">Course content</h3>
              <span>{course.chapterCount} chapters · {totalLessons} lessons · {completedCount} completed</span>
            </header>
            {course.chapters.length === 0 ? (
              <p className="cd-muted"><FolderOpen aria-hidden="true" />No chapters have been published yet.</p>
            ) : (
              <div className="cd-chapters">
                {course.chapters.map((chapter, chapterIndex) => {
                  const isExpanded = expandedModuleId === chapter.chapterId;
                  const done = chapter.lessons.filter((lesson) => lesson.progressStatus === "completed").length;
                  return (
                    <section key={chapter.chapterId} className={`cd-chapter${isExpanded ? " is-open" : ""}`}>
                      <button
                        type="button"
                        className="cd-chapter__trigger"
                        aria-expanded={isExpanded}
                        aria-controls={`cd-chapter-${chapter.chapterId}`}
                        onClick={() => setExpandedModuleId(isExpanded ? null : chapter.chapterId)}
                      >
                        <span className="cd-chapter__num">{String(chapterIndex + 1).padStart(2, "0")}</span>
                        <span className="cd-chapter__title"><strong>{chapter.title}</strong><small>{chapter.lessons.length} lessons · {done} completed</small></span>
                        <span className="cd-chapter__bar" aria-hidden="true"><span style={{ width: `${chapter.lessons.length ? (done / chapter.lessons.length) * 100 : 0}%` }} /></span>
                        <ChevronDown className="cd-chapter__chevron" aria-hidden="true" />
                      </button>
                      <ol className="cd-lessons" id={`cd-chapter-${chapter.chapterId}`} hidden={!isExpanded}>
                        {chapter.lessons.map((lesson, lessonIndex) => {
                          const isNext = nextLesson?.lessonId === lesson.lessonId;
                          return (
                            <li key={lesson.lessonId}>
                              <button
                                type="button"
                                className={`cd-lesson cd-lesson--${lesson.progressStatus}${isNext ? " is-next" : ""}`}
                                disabled={!lesson.playbackAvailable}
                                onClick={() => startLesson(lesson.lessonId)}
                              >
                                <span className="cd-lesson__marker" aria-hidden="true">
                                  {lesson.progressStatus === "completed" ? <CheckCircle2 /> : lesson.resourceType === "pdf" ? <BookOpen /> : <Play />}
                                </span>
                                <span className="cd-lesson__num">{chapterIndex + 1}.{lessonIndex + 1}</span>
                                <span className="cd-lesson__title">{lesson.title}</span>
                                {isNext ? <span className="cd-lesson__next">Up next</span> : null}
                                <span className="cd-lesson__status">{lessonStatusLabel(lesson)}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  );
                })}
              </div>
            )}
          </section>

          <div className="cd-side">
            <section className="cd-card cd-progress" aria-labelledby="cd-progress-title">
              <header className="cd-card__head"><h3 id="cd-progress-title">Your progress</h3></header>
              <div className="cd-progress__kpi">
                <strong>{progressQuery.isLoading ? "—" : percent}<small>%</small></strong>
                <span>{completedCount} of {totalLessons} lessons completed</span>
              </div>
              <div className="cd-bar" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
              {progressQuery.isError ? <p className="cd-warn" role="alert">Progress couldn&apos;t load from your account.</p> : null}
              {nextLesson ? (
                <button type="button" className="cd-next" onClick={() => startLesson(nextLesson.lessonId)}>
                  <span className="cd-next__icon" aria-hidden="true"><Play /></span>
                  <span className="cd-next__copy"><small>{hasStarted ? "Up next" : "Start here"} · Chapter {nextChapterIndex + 1}</small><strong>{nextLesson.title}</strong></span>
                  <ArrowRight aria-hidden="true" />
                </button>
              ) : null}
            </section>

            <section className="cd-card cd-assignments" aria-labelledby="cd-assign-title">
              <header className="cd-card__head">
                <h3 id="cd-assign-title">Assignments</h3>
                <Link to="/assignments" className="cd-link">All<ArrowRight aria-hidden="true" /></Link>
              </header>
              {assignmentsQuery.isLoading ? (
                <span className="cd-skel" />
              ) : assignmentsQuery.isError ? (
                <p className="cd-warn" role="alert">Assignments couldn&apos;t load.<button type="button" onClick={() => void assignmentsQuery.refetch()}>Retry</button></p>
              ) : courseAssignments.length === 0 ? (
                <p className="cd-muted"><ClipboardCheck aria-hidden="true" />No assignments for this {course.unitLabel.toLowerCase()} yet.</p>
              ) : (
                <ul className="cd-assign-list">
                  {courseAssignments.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <Link to={`/assignments/${item.id}`}>
                        <strong>{item.title}</strong>
                        <span>{item.submission ? (item.submission.status === "reviewed" ? "Reviewed" : "Submitted") : item.dueAt ? `Due ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(item.dueAt))}` : "No due date"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="cd-card cd-resources" aria-labelledby="cd-res-title">
              <header className="cd-card__head">
                <h3 id="cd-res-title">Resources</h3>
                <button type="button" className="cd-link" onClick={() => setActiveTab("resources")}>View all<ArrowRight aria-hidden="true" /></button>
              </header>
              {learningSpaceResources.length === 0 ? (
                <p className="cd-muted"><FolderOpen aria-hidden="true" />No resources published yet.</p>
              ) : (
                <ul className="cd-res-list">
                  {learningSpaceResources.slice(0, 3).map((resource) => (
                    <li key={resource.id}>
                      <button type="button" disabled={!resource.available} onClick={() => startLesson(resource.lessonId)}>
                        <span className={`cd-res__ext cd-res__ext--${resource.extension}`}>{resource.extension}</span>
                        <span className="cd-res__copy"><strong>{resource.title}</strong><small>{resource.chapterTitle}</small></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="course-overview-layout cd-tab-layout">
          <div className="course-overview-primary is-tab-expanded">
            <div className="course-overview-panel course-overview-panel--notes" role="tabpanel" id="course-overview-panel-notes" aria-labelledby="course-overview-tab-notes" hidden={activeTab !== "notes"}>
              <LearningNotesPanel lessonId={firstLesson?.lessonId} lessonTitle={firstLesson?.title} resources={learningSpaceResources} onOpenLesson={startLesson} onViewResources={() => setActiveTab("resources")} />
            </div>
            <div className="course-overview-panel course-overview-panel--resources" role="tabpanel" id="course-overview-panel-resources" aria-labelledby="course-overview-tab-resources" hidden={activeTab !== "resources"}>
              <CourseResourcesPanel resources={learningSpaceResources} courseTitle={course.title} onOpenLesson={startLesson} />
            </div>
            <div className="course-overview-panel course-overview-panel--discussion" role="tabpanel" id="course-overview-panel-discussion" aria-labelledby="course-overview-tab-discussion" hidden={activeTab !== "discussion"}>
              <CourseDiscussionPanel />
            </div>
          </div>
          <aside className="course-overview-rail" aria-label="Course support information">
            {activeTab === "notes" ? (
              <NotesWorkspaceRail modules={learningSpaceModules} onSelectModule={startLesson} onAction={() => setActiveTab("overview")} />
            ) : activeTab === "resources" ? (
              <ResourcesWorkspaceRail modules={learningSpaceModules} resources={learningSpaceResources} onSelectModule={startLesson} onAction={() => setActiveTab("overview")} onOpenResource={(resource) => startLesson(resource.lessonId)} />
            ) : (
              <DiscussionWorkspaceRail modules={learningSpaceModules} onSelectModule={startLesson} />
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
