import {
  ArrowRight,
  BookOpen,
  Captions,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LayoutGrid,
  Maximize,
  MessageSquareText,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  StickyNote,
  Volume2,
  VolumeX,
  Paperclip,
  FolderOpen
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchScopedCourseDetail } from "../api/useStudentCourses";
import { useStudentScope } from "../scope/StudentScopeProvider";
import { completeStudentVideoPlayback, getStudentProtectedMedia, reportStudentVideoPlaybackHeartbeat, startStudentVideoPlayback, StudentCoursesApiError, type StudentCourseDetail, type StudentLessonItem, type StudentVideoPlaybackState } from "../api/studentCoursesApi";
import { useStudentProgress, useStudentLessonProgressMutation } from "../api/useStudentLearning";
import { useInactivityPrompt, InactivityModal } from "../../../components/ui/InactivityPrompt";
import { CourseDiscussionPanel } from "../../../components/learning-space/CourseDiscussionPanel";
import { CourseResourcesPanel } from "../../../components/learning-space/CourseResourcesPanel";
import {
  DiscussionWorkspaceRail,
  NotesWorkspaceRail,
  ResourcesWorkspaceRail,
} from "../../../components/learning-space/LearningSpaceRails";
import { LearningNotesPanel } from "../../../components/learning-space/LearningNotesPanel";
import { mapCourseModules, mapCourseResources } from "../../../components/learning-space/learningSpaceMappers";
import "../../../components/learning-space/learningSpace.css";
import "./CourseOverviewPage.css";
import "./LessonPlayerPage.css";
import "./LessonPlayerLayout.css";

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "resources", label: "Resources", icon: Paperclip },
  { id: "discussion", label: "Discussion", icon: MessageSquareText },
] as const;

type LessonTabId = (typeof TABS)[number]["id"];

interface CourseModule {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  lessons: readonly StudentLessonItem[];
}

interface LessonMaterial {
  id: string;
  title: string;
  extension: "pdf" | "video";
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function LessonVideoPlayer({ title, mediaUrl, mediaType, onStarted, onHeartbeat, onComplete }: { title: string; mediaUrl: string; mediaType: "video" | "pdf"; onStarted: () => void; onHeartbeat: (positionSeconds: number) => void; onComplete: (positionSeconds: number) => void }) {
  const playerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | null>(null);
  const lastHeartbeatPosition = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // The prompt pauses playback but does not fabricate watch-time or progress.
  const {
    state: inactivityState,
    countdown: inactivityCountdown,
    handleResume: handleInactivityResume,
    handleDismiss: handleInactivityDismissState,
    reportActivity: reportLearningActivity,
  } = useInactivityPrompt({
    initialCountdown: 60,
    onTimeout: () => {
      console.log('[InactivityPrompt] Session timed out');
    },
    onResume: () => {
      console.log('[InactivityPrompt] Session resumed');
    },
  });

  const handleInactivityDismiss = useCallback(() => {
    handleInactivityDismissState();
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [handleInactivityDismissState]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 2400);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onTime = () => {
      setCurrentTime(video.currentTime);
      if (!video.paused && video.currentTime - lastHeartbeatPosition.current >= 10) {
        lastHeartbeatPosition.current = video.currentTime;
        onHeartbeat(video.currentTime);
        // Watching is learning activity even without mouse/keyboard input.
        reportLearningActivity();
      }
    };
    const onMeta = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [onHeartbeat, reportLearningActivity]);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
    revealControls();
  }, [revealControls]);

  const skip = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration || 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const node = playerRef.current;
    if (!node) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await node.requestFullscreen();
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const player = playerRef.current;
      if (!player) return;
      const active = document.activeElement;
      const inPlayer = player.contains(active) || document.fullscreenElement === player;
      if (!inPlayer) return;

      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowLeft") {
        skip(-10);
      } else if (event.key === "ArrowRight") {
        skip(10);
      } else if (event.key.toLowerCase() === "f") {
        void toggleFullscreen();
      } else if (event.key.toLowerCase() === "m") {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip, toggleFullscreen, togglePlay]);

  const seekFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    video.currentTime = ratio * duration;
  };

  const cycleRate = () => {
    const index = PLAYBACK_RATES.indexOf(playbackRate as (typeof PLAYBACK_RATES)[number]);
    const next = PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const changeVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const lastTapRef = useRef<number>(0);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    // Only detect on the video itself or background, not on interactive buttons
    if ((event.target as HTMLElement).closest("button, input, .lesson-player__timeline")) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      event.preventDefault();
      void toggleFullscreen();
    }
    lastTapRef.current = now;
  }, [toggleFullscreen]);

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const controlsVisible = showControls || !isPlaying;

  return (
    <>
      <article
        className={`lesson-player${controlsVisible ? " is-controls-visible" : ""}`}
        ref={playerRef}
        tabIndex={0}
        onMouseMove={revealControls}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest("button, input, .lesson-player__timeline")) return;
          void toggleFullscreen();
        }}
        onTouchEnd={handleTouchEnd}
      >
        {mediaType === "video" ? <video
          ref={videoRef}
          className="lesson-player__video"
          src={mediaUrl}
          preload="metadata"
          playsInline
          onPlay={onStarted}
          onEnded={() => onComplete(videoRef.current?.currentTime ?? 0)}
          onClick={togglePlay}
        /> : <iframe className="lesson-player__video" src={mediaUrl} title={title} />}
        {mediaType === "video" && !isPlaying ? (
          <div className="lesson-player__overlay" aria-hidden="true">
            <span>{title}</span>
            <small>Protected lesson video</small>
          </div>
        ) : null}
        {mediaType === "video" && !isPlaying ? (
          <button type="button" className="lesson-player__play-center" onClick={togglePlay} aria-label="Play lesson video">
            <Play aria-hidden="true" />
          </button>
        ) : null}
        {mediaType === "video" ? <div className="lesson-player__controls">
          <div
            className="lesson-player__timeline"
            role="slider"
            aria-label="Lesson progress"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            tabIndex={0}
            onPointerDown={seekFromPointer}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="lesson-player__bar">
            <div className="lesson-player__cluster">
              <button type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => skip(-10)} aria-label="Skip back 10 seconds">
                <RotateCcw aria-hidden="true" />
              </button>
              <button type="button" onClick={() => skip(10)} aria-label="Skip forward 10 seconds">
                <RotateCw aria-hidden="true" />
              </button>
              <span className="lesson-player__volume">
                <button type="button" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                  {isMuted || volume === 0 ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  aria-label="Volume"
                  onChange={(event) => changeVolume(Number(event.target.value))}
                />
              </span>
              <time>{formatTime(currentTime)} / {formatTime(duration)}</time>
            </div>
            <div className="lesson-player__cluster">
              <button
                type="button"
                disabled
                title="Captions are not available for this lesson."
                aria-label="Closed captions"
              >
                <Captions aria-hidden="true" />
              </button>
              <button type="button" className="lesson-player__rate" onClick={cycleRate} aria-label={`Playback speed ${playbackRate}x`}>
                {playbackRate}x
              </button>
              <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                {isFullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div> : null}
      </article>
      <InactivityModal
        isOpen={inactivityState === 'countdown'}
        countdown={inactivityCountdown}
        totalCountdown={60}
        onResume={handleInactivityResume}
        onClose={handleInactivityDismiss}
      />
    </>
  );
}

function MaterialsGrid({ materials = [], onOpen }: { materials?: LessonMaterial[]; onOpen: () => void }) {
  if (!materials || materials.length === 0) {
    return (
      <div className="course-overview-materials__empty">
        <FolderOpen aria-hidden="true" />
        <p>No materials attached to this lesson yet.</p>
      </div>
    );
  }

  return (
    <div className="course-overview-materials__grid lesson-player-materials__grid">
      {materials.map((material) => {
        const MaterialIcon = material.extension === "video" ? Play : FileText;
        return (
          <button
            type="button"
            className={`course-overview-material course-overview-material--${material.extension}`}
            key={material.id}
            aria-label={`Open ${material.title}`}
            onClick={onOpen}
          >
            <span className="course-overview-material__icon">
              <MaterialIcon aria-hidden="true" />
              <small>{material.extension}</small>
            </span>
            <span className="course-overview-material__copy">
              <strong>{material.title}</strong>
              <small>{material.extension.toUpperCase()}</small>
            </span>
            <Download className="course-overview-material__download" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

interface MaterialsCardProps {
  className?: string;
  hidden?: boolean;
  materials?: LessonMaterial[];
  onOpen?: () => void;
}

function MaterialsCard({ className = "", hidden = false, materials = [], onOpen = () => undefined }: MaterialsCardProps) {
  return (
    <article
      className={`course-overview-card course-overview-materials${className ? ` ${className}` : ""}`}
      hidden={hidden}
    >
      <header>
        <h2>Lesson materials</h2>
        <button type="button" onClick={onOpen}>View all materials <ArrowRight aria-hidden="true" /></button>
      </header>
      <MaterialsGrid materials={materials} onOpen={onOpen} />
    </article>
  );
}

function StudentLessonPlayerContent({ course, lessonId, mediaAssetId, mediaUrl, videoPlayback }: { course: StudentCourseDetail; lessonId: string; mediaAssetId: string; mediaUrl: string; videoPlayback?: StudentVideoPlaybackState }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LessonTabId>("overview");
  const modules: CourseModule[] = course.chapters.map((chapter, index) => ({
    id: chapter.chapterId,
    number: index + 1,
    title: chapter.title,
    lessonCount: chapter.lessons.length,
    lessons: chapter.lessons,
  }));
  const allLessons = modules.flatMap((module) => module.lessons.map((lesson, index) => ({
    ...lesson,
    id: lesson.lessonId,
    number: index + 1,
    module,
    ready: lesson.playbackAvailable,
    complete: lesson.progressStatus === "completed",
  })));
  const lessonIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
  const current = allLessons[lessonIndex] ?? allLessons[0];
  const learningSpaceModules = mapCourseModules(course);
  const learningSpaceResources = mapCourseResources(course);
  const previous = lessonIndex > 0 ? allLessons[lessonIndex - 1] : undefined;
  const next = lessonIndex >= 0 ? allLessons[lessonIndex + 1] : undefined;
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(current?.module.id ?? null);
  const [progressStatus, setProgressStatus] = useState(current?.progressStatus ?? "not_started");
  const [progressError, setProgressError] = useState<string | null>(null);
  const [videoViewState, setVideoViewState] = useState(videoPlayback);
  const progressMutation = useStudentLessonProgressMutation();
  const progressQuery = useStudentProgress();
  const courseProgress = progressQuery.data?.courses.find((item) => item.courseId === course.courseId);
  const percent = courseProgress?.completionPercent;
  const isAlreadyCompleted = progressStatus === "completed";
  const isComplete = isAlreadyCompleted;
  const materials: LessonMaterial[] = current?.resourceId && current.resourceType
    ? [{ id: current.resourceId, title: current.resourceTitle ?? current.title, extension: current.resourceType }]
    : [];

  useEffect(() => {
    setProgressStatus(current?.progressStatus ?? "not_started");
    setProgressError(null);
  }, [lessonId, current?.progressStatus]);

  const handleProgress = async (status: "in_progress" | "completed") => {
    if (!current || progressMutation.isPending || isAlreadyCompleted) return;
    if (status === "in_progress" && progressStatus !== "not_started") return;
    setProgressError(null);
    try {
      const persisted = await progressMutation.mutateAsync({ lessonId: current.lessonId, status });
      setProgressStatus(persisted.status);
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "Lesson progress could not be saved.");
    }
  };

  const handlePlaybackHeartbeat = useCallback((positionSeconds: number) => {
    if (!videoViewState) return;
    void reportStudentVideoPlaybackHeartbeat({ assetId: mediaAssetId, playbackSessionId: videoViewState.playbackSessionId, positionSeconds })
      .then(({ playback }) => setVideoViewState(playback))
      .catch((error: unknown) => setProgressError(error instanceof Error ? error.message : "Video playback progress could not be confirmed."));
  }, [mediaAssetId, videoViewState]);

  const handleVideoComplete = async (positionSeconds: number) => {
    if (!videoViewState) return;
    try {
      await reportStudentVideoPlaybackHeartbeat({ assetId: mediaAssetId, playbackSessionId: videoViewState.playbackSessionId, positionSeconds });
      const { playback } = await completeStudentVideoPlayback({ assetId: mediaAssetId, playbackSessionId: videoViewState.playbackSessionId });
      setVideoViewState(playback);
      await handleProgress("completed");
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : "Video completion could not be confirmed by the server.");
    }
  };

  const handleMarkComplete = () => void handleProgress("completed");
  const openLesson = (id: string) => navigate(`/my-courses/${course.courseId}/lessons/${id}`);

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
      ?.querySelector<HTMLButtonElement>(`#lesson-player-tab-${nextTab.id}`)
      ?.focus();
  };

  return (
    <section className="course-overview-page lesson-player-page" aria-labelledby="lesson-player-title">

      <div className="course-overview-layout">
        <div className={`course-overview-primary${activeTab === "overview" ? "" : " is-tab-expanded"}`}>
          <div className="lesson-player-slot h-full min-h-0" hidden={activeTab !== "overview"}>
            <LessonVideoPlayer title={current.title} mediaUrl={mediaUrl} mediaType={current.resourceType ?? "video"} onStarted={() => void handleProgress("in_progress")} onHeartbeat={handlePlaybackHeartbeat} onComplete={(positionSeconds) => void handleVideoComplete(positionSeconds)} />
          </div>
          {activeTab === "overview" ? (
            <div className="lp-bar">
              <div className="lp-bar__copy">
                <p className="lp-bar__eyebrow">
                  <span>Lesson {lessonIndex + 1} of {allLessons.length}</span>
                  <span>Chapter {current.module.number}: {current.module.title}</span>
                </p>
                <h1 id="lesson-player-title">{current.title}</h1>
                <p className="lp-bar__meta">
                  <em className={`lesson-player-status${isComplete ? " is-complete" : ""}`}>
                    {isComplete ? "Completed" : progressStatus === "in_progress" ? "In progress" : "Not started"}
                  </em>
                  {videoViewState ? <span role="status">Views used {videoViewState.completedViews}/{videoViewState.maxCompletedViews} · {videoViewState.viewsRemaining} remaining</span> : null}
                </p>
              </div>
              <nav className="lp-bar__nav" aria-label="Lesson navigation">
                <button type="button" className="lp-btn lp-btn--icon" disabled={!previous} onClick={() => previous && openLesson(previous.id)} aria-label="Previous lesson" title="Previous lesson">
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`lp-btn lp-btn--primary${isAlreadyCompleted ? " is-done" : ""}`}
                  onClick={handleMarkComplete}
                  disabled={isAlreadyCompleted || progressMutation.isPending}
                >
                  <CheckCircle2 aria-hidden="true" /> {isAlreadyCompleted ? "Completed" : progressMutation.isPending ? "Saving…" : "Mark as complete"}
                </button>
                <button type="button" className="lp-btn lp-btn--secondary" disabled={!next} onClick={() => next && openLesson(next.id)}>
                  Next lesson <ChevronRight aria-hidden="true" />
                </button>
              </nav>
            </div>
          ) : <h1 id="lesson-player-title" className="sr-only">{current.title}</h1>}

          <div className="course-overview-tabs" role="tablist" aria-label="Lesson sections">
            {TABS.map(({ id, label, icon: Icon }, index) => (
              <button
                type="button"
                role="tab"
                id={`lesson-player-tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls={`lesson-player-panel-${id}`}
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

          <div
            className="course-overview-panel course-overview-panel--overview"
            role="tabpanel"
            id="lesson-player-panel-overview"
            aria-labelledby="lesson-player-tab-overview"
            hidden={activeTab !== "overview"}
          >
            <MaterialsCard className="course-overview-materials--primary" materials={materials} onOpen={() => setActiveTab("overview")} />
          </div>

          <div className="course-overview-panel course-overview-panel--notes" role="tabpanel" id="lesson-player-panel-notes" aria-labelledby="lesson-player-tab-notes" hidden={activeTab !== "notes"}>
            <LearningNotesPanel lessonId={current?.lessonId} lessonTitle={current?.title} resources={learningSpaceResources} onOpenLesson={openLesson} onViewResources={() => setActiveTab("resources")} />
          </div>
          <div className="course-overview-panel course-overview-panel--resources" role="tabpanel" id="lesson-player-panel-resources" aria-labelledby="lesson-player-tab-resources" hidden={activeTab !== "resources"}>
            <CourseResourcesPanel resources={learningSpaceResources} courseTitle={course.title} onOpenLesson={openLesson} />
          </div>
          <div className="course-overview-panel course-overview-panel--discussion" role="tabpanel" id="lesson-player-panel-discussion" aria-labelledby="lesson-player-tab-discussion" hidden={activeTab !== "discussion"}>
            <CourseDiscussionPanel />
          </div>

          {progressError ? <p role="alert" className="dashboard-feedback--error">{progressError}</p> : null}
        </div>

        <aside className="course-overview-rail" aria-label="Course support information">
          {activeTab === "notes" ? (
            <NotesWorkspaceRail modules={learningSpaceModules} onSelectModule={openLesson} onAction={() => setActiveTab("overview")} />
          ) : activeTab === "resources" ? (
            <ResourcesWorkspaceRail modules={learningSpaceModules} resources={learningSpaceResources} onSelectModule={openLesson} onAction={() => setActiveTab("overview")} onOpenResource={(resource) => openLesson(resource.lessonId)} />
          ) : activeTab === "discussion" ? (
            <DiscussionWorkspaceRail modules={learningSpaceModules} onSelectModule={openLesson} />
          ) : (
            <>
          <article className="course-overview-card course-overview-curriculum">
            <header>
              <h2>Course curriculum</h2>
              <span>{percent === undefined ? "Progress unavailable" : `${percent}% complete`}</span>
            </header>
            <div className="course-overview-curriculum__modules">
              {modules.map((module) => {
                const isExpanded = expandedModuleId === module.id;
                return (
                  <section className={`course-overview-module${isExpanded ? " is-expanded" : ""}`} key={module.id}>
                    <button
                      type="button"
                      className="course-overview-module__trigger"
                      aria-expanded={isExpanded}
                      aria-controls={`lesson-player-${module.id}-lessons`}
                      onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                    >
                      <ChevronRight className="course-overview-module__leading-chevron" aria-hidden="true" />
                      <span><strong>Chapter {module.number}: {module.title}</strong></span>
                      <small>{module.lessonCount} lessons</small>
                      <ChevronDown className="course-overview-module__trailing-chevron" aria-hidden="true" />
                    </button>
                    <div className="course-overview-module__lessons" id={`lesson-player-${module.id}-lessons`} hidden={!isExpanded}>
                      {module.lessons.map((lesson, index) => (
                        <button
                          type="button"
                          className={`course-overview-lesson${lesson.playbackAvailable ? " is-ready" : ""}${lesson.lessonId === current.id ? " is-current" : ""}${lesson.progressStatus === "completed" && lesson.lessonId !== current.id ? " is-complete" : ""}`}
                          key={lesson.lessonId}
                          aria-current={lesson.lessonId === current.id ? "page" : undefined}
                          onClick={lesson.playbackAvailable ? () => openLesson(lesson.lessonId) : undefined}
                          disabled={!lesson.playbackAvailable}
                        >
                          <span className="course-overview-lesson__marker">
                            {lesson.lessonId === current.id ? <Play aria-hidden="true" /> : lesson.progressStatus === "completed" ? <CheckCircle2 aria-hidden="true" /> : lesson.playbackAvailable ? <Play aria-hidden="true" /> : <i />}
                          </span>
                          <span className="course-overview-lesson__number">{index + 1}</span>
                          <strong>{lesson.title}</strong>
                          {lesson.lessonId === current.id ? <em>Playing</em> : null}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>

          <article className="course-overview-card course-overview-progress">
            <header><h2>Course progress</h2><strong>{percent === undefined ? "—" : `${percent}%`}</strong></header>
            <div className="course-overview-progress__track" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-busy={progressQuery.isLoading}><span style={{ width: `${percent ?? 0}%` }} /></div>
            <dl className="course-overview-progress__metrics">
              <div><dt>Lessons</dt><dd>{course.lessonCount}</dd></div>
              <div><dt>Chapters</dt><dd>{course.chapters.length}</dd></div>
              <div><dt>Completed</dt><dd>{allLessons.filter((lesson) => lesson.complete).length}</dd></div>
            </dl>
          </article>

          {next ? (
            <article className="course-overview-card lesson-player-upnext">
              <h2>Up next</h2>
              <button type="button" className="lesson-player-upnext__card" onClick={() => openLesson(next.id)}>
                <strong>{next.title}</strong>
                <small>Lesson {next.number} · {next.module.title}</small>
                <b><Play aria-hidden="true" /> Play next</b>
              </button>
            </article>
          ) : null}
            </>
          )}
        </aside>
      </div>

    </section>
  );
}


function LessonUnavailable({ message, isError = false, loading = false }: { message: string; isError?: boolean; loading?: boolean }) {
  const notFound = /not found/i.test(message);
  return (
    <section className="route-notice-page" aria-labelledby="lesson-unavailable-title" aria-busy={loading || undefined}>
      <div className={`route-notice${isError ? " route-notice--error" : ""}`} role={isError ? "alert" : "status"}>
        <span className="route-notice__icon" aria-hidden="true"><BookOpen /></span>
        <div className="route-notice__copy">
          <h2 id="lesson-unavailable-title">{loading ? "Opening your lesson…" : notFound ? "This lesson isn't available" : "Lesson can't be played right now"}</h2>
          <p>{notFound ? "It hasn't been published for your account yet." : message}</p>
        </div>
        {loading ? null : (
          <div className="route-notice__actions">
            <Link to="/my-courses" className="route-notice__btn route-notice__btn--primary">Back to My Courses</Link>
            <Link to="/help" className="route-notice__btn">Get help</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function LessonPlayerPage() {
  const scope = useStudentScope();
  const { slug = "", lessonId = "" } = useParams();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; course: StudentCourseDetail; lesson: StudentLessonItem; mediaAssetId: string; mediaUrl: string; videoPlayback?: StudentVideoPlaybackState }
    | { status: "unavailable" | "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!slug || !lessonId) {
      setState({ status: "unavailable", message: "This lesson is not available for this student." });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });
    fetchScopedCourseDetail(scope, slug, controller.signal)
      .then(async (course) => {
        if (controller.signal.aborted) return;
        const lesson = course.chapters.flatMap((chapter) => chapter.lessons).find((item) => item.lessonId === lessonId);
        if (!lesson || !lesson.playbackAvailable || !lesson.resourceId || !lesson.resourceType) {
          setState({ status: "unavailable", message: "This lesson has no published, authorized media resource yet." });
          return;
        }
        const media = lesson.resourceType === "video"
          ? await startStudentVideoPlayback({ assetId: lesson.resourceId, signal: controller.signal })
          : await getStudentProtectedMedia({ assetId: lesson.resourceId, signal: controller.signal });
        if (controller.signal.aborted) return;
        setState({ status: "ready", course, lesson, mediaAssetId: lesson.resourceId!, mediaUrl: media.delivery.url, ...("playback" in media ? { videoPlayback: media.playback } : {}) });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof StudentCoursesApiError && error.code === "video_view_limit_exhausted"
          ? "You have used all completed views available for this video. Contact your administrator if you believe this is incorrect."
          : error instanceof Error ? error.message : "Lesson access could not be confirmed.";
        setState({ status: "error", message });
      });

    return () => controller.abort();
  }, [scope, slug, lessonId]);

  if (state.status === "loading") return <LessonUnavailable loading message="Checking lesson access and media release." />;
  if (state.status === "error") return <LessonUnavailable message={state.message} isError />;
  if (state.status === "unavailable") return <LessonUnavailable message={state.message} />;
  if (state.status !== "ready") return <LessonUnavailable message="Lesson access could not be confirmed." isError />;
  return <StudentLessonPlayerContent key={`${slug}:${lessonId}`} course={state.course} lessonId={lessonId} mediaAssetId={state.mediaAssetId} mediaUrl={state.mediaUrl} videoPlayback={state.videoPlayback} />;
}
