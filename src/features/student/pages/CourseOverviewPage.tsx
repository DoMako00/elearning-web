import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  Gauge,
  LayoutGrid,
  MessageSquareText,
  Paperclip,
  Play,
  ShieldCheck,
  Sparkles,
  StickyNote,
  FolderOpen,
} from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import heroBackground from "../../../Assets/dashboard/my-courses-hero-background.webp";
import anatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.webp";
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
import type { LearningSpaceResource } from "../../../components/learning-space/learningSpaceMappers";
import { studentInstructorApi } from "../api/studentInstructorApi";
import {
  getStudentCourse,
  type StudentCourseDetail,
  type StudentLessonItem,
} from "../api/studentCoursesApi";
import { useStudentProgress, useStudentSavedCourses, useToggleStudentSavedCourse } from "../api/useStudentLearning";
import "../../../components/learning-space/learningSpace.css";
import "./CourseOverviewPage.css";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "resources", label: "Resources", icon: Paperclip },
  { id: "discussion", label: "Discussion", icon: MessageSquareText },
] as const;

type CourseTabId = (typeof TABS)[number]["id"];

interface LessonView {
  id: string;
  number: number;
  title: string;
  mediaStatus: string;
  ready: boolean;
  complete: boolean;
}

interface CourseModuleView {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  lessons: LessonView[];
}

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

function AnatomyHeroArt() {
  return (
    <div className="course-overview-hero__art" aria-hidden="true">
      <img src={heroBackground} alt="" className="course-overview-hero__art-bg" />
      <img src={anatomyOverlay} alt="" className="course-overview-hero__art-anatomy" />
    </div>
  );
}

function MaterialsGrid({ resources, onOpen }: { resources: readonly LearningSpaceResource[]; onOpen: (lessonId: string) => void }) {
  if (resources.length === 0) {
    return <div className="course-overview-materials__empty"><FolderOpen aria-hidden="true" /><p>No published lesson resources are available.</p></div>;
  }
  return (
    <div className="course-overview-materials__grid">
      {resources.slice(0, 3).map((resource) => (
        <button key={resource.id} type="button" className={`course-overview-material course-overview-material--${resource.extension}`} disabled={!resource.available} onClick={() => onOpen(resource.lessonId)}>
          <span className="course-overview-material__icon"><FolderOpen aria-hidden="true" /><small>{resource.extension}</small></span>
          <span className="course-overview-material__copy"><strong>{resource.title}</strong><small>{resource.chapterTitle}</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function MaterialsCard({ className = "", hidden = false, resources, onOpen, onViewAll }: { className?: string; hidden?: boolean; resources: readonly LearningSpaceResource[]; onOpen: (lessonId: string) => void; onViewAll: () => void }) {
  return (
    <article className={`course-overview-card course-overview-materials${className ? ` ${className}` : ""}`} hidden={hidden}>
      <header>
        <h2>Published resources</h2>
        <button type="button" onClick={onViewAll}>View all resources <ArrowRight aria-hidden="true" /></button>
      </header>
      <MaterialsGrid resources={resources} onOpen={onOpen} />
    </article>
  );
}

function toLessonLabel(lesson: StudentLessonItem) {
  if (lesson.mediaStatus === "pending_media") return "Pending media";
  if (lesson.mediaStatus === "ready") return "Ready soon";
  return "No media";
}

function toCourseModules(course: StudentCourseDetail): CourseModuleView[] {
  return course.chapters.map((chapter, chapterIndex) => ({
    id: chapter.chapterId,
    number: chapterIndex + 1,
    title: chapter.title,
    lessonCount: chapter.lessons.length,
    lessons: chapter.lessons.map((lesson, lessonIndex) => ({
      id: lesson.lessonId,
      number: lessonIndex + 1,
      title: lesson.title,
      mediaStatus: toLessonLabel(lesson),
      ready: lesson.playbackAvailable,
      complete: lesson.progressStatus === "completed",
    })),
  }));
}

function FeedbackState({ message, tone = "neutral" }: { message: string; tone?: "neutral" | "error" }) {
  return (
    <section className="course-overview-page" aria-labelledby="course-overview-title">
      <div className={`course-overview-panel--message${tone === "error" ? " dashboard-feedback--error" : ""}`} role={tone === "error" ? "alert" : "status"}>
        <BookOpen aria-hidden="true" />
        <h2 id="course-overview-title">Course overview</h2>
        <p>{message}</p>
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
        setExpandedModuleId(nextCourse.chapters[0]?.chapterId ?? null);
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

  const courseModules = useMemo(() => course ? toCourseModules(course) : [], [course]);
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

  const canStartLesson = Boolean(firstLesson?.playbackAvailable);

  return (
    <section className="course-overview-page" aria-labelledby="course-overview-title">
      <div className="course-overview-layout">
        <div className={`course-overview-primary${activeTab === "overview" ? "" : " is-tab-expanded"}`}>
          {activeTab === "overview" ? (
            <article className="course-overview-hero" aria-labelledby="course-overview-title">
              <AnatomyHeroArt />
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
                    <span><strong>{assignedInstructor?.displayName ?? "No instructor assigned"}</strong><small>{assignedInstructor ? "Assigned instructor" : "Instructor directory"}</small></span>
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
                  disabled={savedCoursesQuery.isLoading || toggleSavedCourse.isPending}
                >
                  <Bookmark aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} />
                </button>
                <button type="button" className="course-overview-hero__start" disabled={!canStartLesson} onClick={() => firstLesson && startLesson(firstLesson.lessonId)}>
                  {canStartLesson ? "Continue Lesson" : "Media coming soon"} <ArrowRight aria-hidden="true" />
                </button>
                {savedCoursesQuery.isError || toggleSavedCourse.isError ? <p role="alert">Saved courses could not be updated. Please retry.</p> : null}
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
                  <div><Clock3 aria-hidden="true" /><span><dt>Media</dt><dd>{course.mediaSummary.lessonsWithMedia ? "Protected delivery available" : "No media published"}</dd></span></div>
                  <div><ShieldCheck aria-hidden="true" /><span><dt>Access</dt><dd>Verified student scope</dd></span></div>
                </dl>
              </article>
              <article className="course-overview-card course-overview-learn">
                <h2>What you can do now</h2>
                <ul>
                  {course.chapters.length ? course.chapters.map((chapter) => (
                    <li key={chapter.chapterId}><CheckCircle2 aria-hidden="true" /><span>{chapter.title}</span></li>
                  )) : <li><FolderOpen aria-hidden="true" /><span>No published chapters are available yet.</span></li>}
                </ul>
              </article>
            </div>
            <MaterialsCard className="course-overview-materials--primary" resources={learningSpaceResources} onOpen={startLesson} onViewAll={() => setActiveTab("resources")} />
          </div>

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
                              className={`course-overview-lesson${lesson.ready ? " is-ready" : ""}${lesson.complete ? " is-complete" : ""}`}
                              key={lesson.id}
                              aria-label={`${lesson.title}, ${lesson.mediaStatus}`}
                              disabled={!lesson.ready}
                              onClick={lesson.ready ? () => startLesson(lesson.id) : undefined}
                            >
                              <span className="course-overview-lesson__marker">{lesson.complete ? <CheckCircle2 aria-hidden="true" /> : lesson.ready ? <Play aria-hidden="true" /> : <i />}</span>
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
                <header><h2>Course progress</h2><small>{progressPercent === null ? "—" : `${progressPercent}%`}</small></header>
                <p className="course-overview-progress__summary"><strong>{progressPercent === null ? "—" : `${progressPercent}%`}</strong><span>completed</span></p>
                <div className="course-overview-progress__track" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} {...(progressPercent === null ? {} : { "aria-valuenow": progressPercent })}><span style={{ width: progressPercent === null ? "0%" : `${progressPercent}%` }} /></div>
                {progressQuery.isError ? <p role="alert">Progress could not be loaded from your account.</p> : null}
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
