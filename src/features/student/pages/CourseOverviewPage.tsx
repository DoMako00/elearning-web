import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gauge,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  CirclePlay,
  LayoutGrid,
  MessageSquareText,
  Paperclip,
  Play,
  StickyNote,
} from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
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
import { fetchScopedCourseDetail } from "../api/useStudentCourses";
import { useStudentScope } from "../scope/StudentScopeProvider";
import { classifyStudentApiError } from "../api/studentApiErrors";
import {
  type StudentCourseDetail,
  type StudentLessonItem,
} from "../api/studentCoursesApi";
import { useStudentProgress, useStudentSavedCourses, useToggleStudentSavedCourse } from "../api/useStudentLearning";
import "../../../components/learning-space/learningSpace.css";
import "./CourseOverviewPage.css";

import { CourseHeroArt, CourseMaterialsCard, CourseOverviewSkeleton } from "./CourseOverviewReferenceCards";
import { toReferenceCourse } from "./referenceCourseMapper";

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

function FeedbackState({ message, tone = "neutral", notFound = false }: { message: string; tone?: "neutral" | "error"; notFound?: boolean }) {
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

export function CourseOverviewPage({ onStartLesson }: CourseOverviewPageProps) {
  const scope = useStudentScope();
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
  const [errorIsNotFound, setErrorIsNotFound] = useState(false);
  const progressQuery = useStudentProgress();
  const savedCoursesQuery = useStudentSavedCourses();
  const toggleSavedCourse = useToggleStudentSavedCourse();
  const instructorQuery = useQuery({ queryKey: ["student", "instructors"], queryFn: ({ signal }) => studentInstructorApi.list(signal), enabled: auth.status === "authenticated" });
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
    void fetchScopedCourseDetail(scope, courseId, controller.signal)
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
        // Decide "not available" from the HTTP status, never from message text.
        const classified = classifyStudentApiError(nextError);
        setErrorIsNotFound(classified.kind === "not_found" || classified.kind === "no_membership");
        setError(classified.kind === "unavailable" ? classified.message : nextError instanceof Error ? nextError.message : "The course could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [courseId, scope]);

  const learningSpaceModules = useMemo(() => course ? mapCourseModules(course) : [], [course]);
  const learningSpaceResources = useMemo(() => course ? mapCourseResources(course) : [], [course]);
  const totalLessons = lessons.length || course?.lessonCount || 0;
  const assignedInstructor = instructorQuery.data?.find((item) => item.courses.some((assigned) => assigned.courseId === courseId));

  // Only the server's access.canOpen grants lesson access; a course the
  // student can view but not open never offers an actionable lesson.
  const canOpenCourse = course?.access?.canOpen === true;

  const startLesson = (lessonId: string) => {
    if (!canOpenCourse) return;
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
  if (error) return <FeedbackState message={error} tone="error" notFound={errorIsNotFound} />;
  if (!course) return <FeedbackState message="This course is not available for this student." />;

  const allLessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const completedCount = allLessons.filter((lesson) => lesson.progressStatus === "completed").length;
  const nextLesson = !canOpenCourse ? null
    : allLessons.find((lesson) => lesson.progressStatus === "in_progress" && lesson.playbackAvailable)
    ?? allLessons.find((lesson) => lesson.progressStatus !== "completed" && lesson.playbackAvailable)
    ?? allLessons.find((lesson) => lesson.playbackAvailable)
    ?? null;
  // Notes follow the lesson the student is working on, never blindly the
  // first lesson, and only for a released lesson they can open.
  const noteLesson = nextLesson ?? null;
  const percent = progressPercent === null ? Math.round(totalLessons ? (completedCount / totalLessons) * 100 : 0) : Math.round(progressPercent);
  const lessonStatusLabel = (lesson: StudentLessonItem) => lesson.progressStatus === "completed" ? "Completed"
    : lesson.progressStatus === "in_progress" ? "In progress"
      : lesson.playbackAvailable ? (lesson.resourceType === "pdf" ? "Reading" : "Ready") : toLessonLabel(lesson);

  const firstLesson = nextLesson;
  const canStartLesson = Boolean(firstLesson && canOpenCourse);
  const courseModules = course.chapters.map((chapter,index) => ({
    id: chapter.chapterId, number: index+1, title: chapter.title, lessonCount: chapter.lessons.length,
    lessons: chapter.lessons.map((lesson,i) => ({id: lesson.lessonId, number: i+1, title: lesson.title,
      ready: canOpenCourse && lesson.playbackAvailable, mediaStatus: lessonStatusLabel(lesson)})),
  }));
  const artwork = toReferenceCourse(course).heroOverlay;
  const LEARNING_OUTCOMES = ["Follow the published lesson sequence", "Review your course resources", "Save your lesson notes", "Track completed lessons"];
  return (
    <section className="course-overview-page" aria-labelledby="course-overview-title">
      <div className="course-overview-layout">
        <div className={`course-overview-primary${activeTab === "overview" ? "" : " is-tab-expanded"}`}>
          {activeTab === "overview" ? (
            <article className="course-overview-hero" aria-labelledby="course-overview-title">
              <CourseHeroArt artwork={artwork} />
              <div className="course-overview-hero__content">
                <div className="course-overview-hero__intro">
                  <span className="course-overview-hero__status">
                    <CirclePlay aria-hidden="true" />
                    {course.unitLabel} • {totalLessons} lessons
                  </span>
                  <h2 id="course-overview-title">{course.title}</h2>
                  <p className="course-overview-hero__context">
                    <span>{course.academicInstitution.name}</span>
                    <i aria-hidden="true" />
                    <span>{course.academicLevel.title}</span>
                    <i aria-hidden="true" />
                    <span>{course.academicSemester.title}</span>
                  </p>
                  <span className="course-overview-hero__divider" aria-hidden="true" />
                </div>
                <div className="course-overview-hero__footer">
                  <div className="course-overview-hero__instructor">
                    <InstructorPortrait />
                    <span><strong>{assignedInstructor?.displayName ?? course.brand.name}</strong><small>{course.cataloguePresentation === "subject_based" ? "General subject course" : "Module-based course"}</small></span>
                  </div>
                  <span className="course-overview-hero__divider" aria-hidden="true" />
                </div>
              </div>
              <div className="course-overview-hero__actions">
                <button
                  type="button"
                  className="course-overview-hero__bookmark"
                  aria-label={isBookmarked ? "Remove course bookmark" : "Bookmark course"}
                  aria-pressed={isBookmarked}
                  onClick={toggleBookmark}
                >
                  <Bookmark aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} />
                </button>
                <button type="button" className="course-overview-hero__start" disabled={!canStartLesson} onClick={() => firstLesson && startLesson(firstLesson.lessonId)}>
                  {canStartLesson ? "Continue Lesson" : "Media coming soon"} <ArrowRight aria-hidden="true" />
                </button>
              </div>
              <dl className="course-overview-hero__meta">
                <div><Clock3 aria-hidden="true" /><span><dt>Media</dt><dd>{course.mediaSummary.lessonsWithMedia}/{totalLessons} ready</dd></span></div>
                <div><Gauge aria-hidden="true" /><span><dt>Level</dt><dd>{course.academicLevel.title}</dd></span></div>
                <div><Sparkles aria-hidden="true" /><span><dt>Unit</dt><dd>{course.unitLabel}</dd></span></div>
              </dl>
            </article>
          ) : null}

          <div className="course-overview-tabs" role="tablist" aria-label="Course sections">
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

          <div className="course-overview-panel course-overview-panel--overview" role="tabpanel" id="course-overview-panel-overview" aria-labelledby="course-overview-tab-overview" hidden={activeTab !== "overview"}>
            <div className="course-overview-info-row">
              <article className="course-overview-card course-overview-about">
                <h2>About this {course.unitLabel.toLowerCase()}</h2>
                <p>{course.title} is published for {course.brand.name} students in {course.academicInstitution.name} {course.academicLevel.title}, {course.academicSemester.title}.</p>
                <dl>
                  <div><Sparkles aria-hidden="true" /><span><dt>Presentation</dt><dd>{course.cataloguePresentation === "subject_based" ? "Subject based" : "Module based"}</dd></span></div>
                  <div><LayoutGrid aria-hidden="true" /><span><dt>Includes</dt><dd>{course.chapterCount} chapters, {totalLessons} lessons</dd></span></div>
                  <div><Clock3 aria-hidden="true" /><span><dt>Playback</dt><dd>{canStartLesson ? "Available" : "Not released yet"}</dd></span></div>
                  <div><ShieldCheck aria-hidden="true" /><span><dt>Access</dt><dd>Verified student scope</dd></span></div>
                </dl>
              </article>
              <article className="course-overview-card course-overview-learn">
                <h2>What you can do now</h2>
                <ul>
                  {LEARNING_OUTCOMES.map((outcome) => (
                    <li key={outcome}><CheckCircle2 aria-hidden="true" /><span>{outcome}</span></li>
                  ))}
                </ul>
              </article>
            </div>
            <CourseMaterialsCard resources={learningSpaceResources} canOpen={canOpenCourse} onOpenLesson={startLesson} onViewAll={() => setActiveTab("resources")} />
          </div>

          <div className="course-overview-panel course-overview-panel--notes" role="tabpanel" id="course-overview-panel-notes" aria-labelledby="course-overview-tab-notes" hidden={activeTab !== "notes"}>
            <LearningNotesPanel lessonId={noteLesson?.lessonId} lessonTitle={noteLesson?.title} resources={learningSpaceResources} onOpenLesson={startLesson} onViewResources={() => setActiveTab("resources")} />
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
            <ResourcesWorkspaceRail modules={learningSpaceModules} resources={learningSpaceResources} onSelectModule={startLesson} onOpenResource={resource => startLesson(resource.lessonId)} />
          ) : activeTab === "discussion" ? (
            <DiscussionWorkspaceRail modules={learningSpaceModules} onSelectModule={startLesson} />
          ) : (
            <>
              <article className="course-overview-card course-overview-curriculum">
                <header>
                  <h2>{course.unitLabel} curriculum</h2>
                  <span>{totalLessons} lessons</span>
                </header>
                <div className="course-overview-curriculum__modules">
                  {courseModules.map((module) => {
                    const isExpanded = expandedModuleId === module.id;
                    return (
                      <section className={`course-overview-module${isExpanded ? " is-expanded" : ""}`} key={module.id}>
                        <button
                          type="button"
                          className="course-overview-module__trigger"
                          aria-expanded={isExpanded}
                          aria-controls={`course-overview-${module.id}-lessons`}
                          onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                        >
                          <ChevronRight className="course-overview-module__leading-chevron" aria-hidden="true" />
                          <span><strong>Chapter {module.number}: {module.title}</strong></span>
                          <small>{module.lessonCount} lessons</small>
                          <ChevronDown className="course-overview-module__trailing-chevron" aria-hidden="true" />
                        </button>
                        <div className="course-overview-module__lessons" id={`course-overview-${module.id}-lessons`} hidden={!isExpanded}>
                          {module.lessons.map((lesson) => (
                            <button
                              type="button"
                              className={`course-overview-lesson${lesson.ready ? " is-ready" : ""}`}
                              key={lesson.id}
                              aria-label={`${lesson.title}, ${lesson.mediaStatus}`}
                              disabled={!lesson.ready}
                              onClick={lesson.ready ? () => startLesson(lesson.id) : undefined}
                            >
                              <span className="course-overview-lesson__marker">{lesson.ready ? <Play aria-hidden="true" /> : <i />}</span>
                              <span className="course-overview-lesson__number">{lesson.number}</span>
                              <strong>{lesson.title}</strong>
                              <em>{lesson.mediaStatus}</em>
                              <time>{course.unitLabel}</time>
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>

              <article className="course-overview-card course-overview-progress">
                <header><h2>Course progress</h2><small>{percent}%</small></header>
                <p className="course-overview-progress__summary"><strong>{percent}%</strong><span>completed</span></p>
                <div className="course-overview-progress__track" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width: `${percent}%`}} /></div>
                <dl className="course-overview-progress__metrics">
                  <div><dt>Lessons</dt><dd>{totalLessons}</dd></div>
                  <div><dt>Chapters</dt><dd>{course.chapterCount}</dd></div>
                  <div><dt>Media ready</dt><dd>{course.mediaSummary.lessonsWithMedia}</dd></div>
                  <div><dt>Pending</dt><dd>{course.mediaSummary.pendingMediaLessons}</dd></div>
                </dl>
              </article>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
