import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Captions,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Gauge,
  LayoutGrid,
  Maximize,
  MessageSquareText,
  Minimize,
  MoreHorizontal,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  RotateCw,
  StickyNote,
  UsersRound,
  Volume2,
  VolumeX,
  Paperclip
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import anatomyArt from "../../../Assets/image copy.webp";
import { CourseDiscussionPanel } from "../../../components/learning-space/CourseDiscussionPanel";
import { CourseResourcesPanel } from "../../../components/learning-space/CourseResourcesPanel";
import {
  DiscussionWorkspaceRail,
  NotesWorkspaceRail,
  ResourcesWorkspaceRail,
} from "../../../components/learning-space/LearningSpaceRails";
import { LearningNotesPanel } from "../../../components/learning-space/LearningNotesPanel";
import "../../../components/learning-space/learningSpace.css";
import "./CourseOverviewPage.css";
import "./LessonPlayerPage.css";

const COURSE_PATH = "/my-courses/human-anatomy-i";
const VIDEO_SRC = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "resources", label: "Resources", icon: Paperclip },
  { id: "discussion", label: "Discussion", icon: MessageSquareText },
] as const;

type LessonTabId = (typeof TABS)[number]["id"];

interface Lesson {
  id: string;
  number: number;
  title: string;
  duration: string;
  ready?: boolean;
  complete?: boolean;
}

interface CourseModule {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  lessons?: Lesson[];
}

interface LessonMaterial {
  id: string;
  title: string;
  extension: "pdf" | "pptx";
  size: string;
}

const COURSE_MODULES: CourseModule[] = [
  {
    id: "module-1",
    number: 1,
    title: "Introduction to Anatomy",
    lessonCount: 3,
    lessons: [
      {
        id: "human-anatomy-i-lesson-1",
        number: 1,
        title: "Introduction to Anatomy & Anatomical Terms",
        duration: "19:45",
        ready: true,
      },
      {
        id: "human-anatomy-i-lesson-2",
        number: 2,
        title: "History of Anatomy",
        duration: "15:20",
        ready: true,
        complete: true,
      },
      {
        id: "human-anatomy-i-lesson-3",
        number: 3,
        title: "Levels of Organization",
        duration: "18:10",
        ready: true,
        complete: true,
      },
    ],
  },
  { id: "module-2", number: 2, title: "Upper Limb", lessonCount: 5 },
  { id: "module-3", number: 3, title: "Thorax", lessonCount: 4 },
  { id: "module-4", number: 4, title: "Abdomen & Pelvis", lessonCount: 5 },
  { id: "module-5", number: 5, title: "Lower Limb", lessonCount: 4 },
  { id: "module-6", number: 6, title: "Neuroanatomy Foundations", lessonCount: 3 },
];

const LESSON_OUTCOMES = [
  "Define anatomy and its major subdivisions",
  "Use standard anatomical position correctly",
  "Apply directional terms in clinical context",
  "Identify the major body planes and sections",
] as const;

const LESSON_MATERIALS: LessonMaterial[] = [
  { id: "slides", title: "Lecture Slides", extension: "pptx", size: "8.6 MB" },
  { id: "terms", title: "Anatomical Terms", extension: "pdf", size: "420 KB" },
  { id: "diagrams", title: "Key Diagrams", extension: "pdf", size: "1.2 MB" },
];

const ALL_LESSONS = COURSE_MODULES.flatMap((module) =>
  (module.lessons ?? []).map((lesson) => ({ ...lesson, module })),
);

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function LessonVideoPlayer() {
  const playerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [showControls, setShowControls] = useState(true);

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

    const onTime = () => setCurrentTime(video.currentTime);
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
  }, []);

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

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const controlsVisible = showControls || !isPlaying;

  return (
    <article
      className={`lesson-player${controlsVisible ? " is-controls-visible" : ""}`}
      ref={playerRef}
      tabIndex={0}
      onMouseMove={revealControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="lesson-player__video"
        src={VIDEO_SRC}
        poster={anatomyArt}
        preload="metadata"
        playsInline
        onClick={togglePlay}
      />
      {!isPlaying ? (
        <div className="lesson-player__overlay" aria-hidden="true">
          <span>Introduction to Anatomy</span>
          <small>Understanding the human body and basic anatomical terminology.</small>
        </div>
      ) : null}
      {!isPlaying ? (
        <button type="button" className="lesson-player__play-center" onClick={togglePlay} aria-label="Play lesson video">
          <Play aria-hidden="true" />
        </button>
      ) : null}
      {captionsOn ? (
        <p className="lesson-player__captions">Anatomical terms describe location, direction, and body planes.</p>
      ) : null}
      <div className="lesson-player__controls">
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
            <time>{formatTime(currentTime)} / {formatTime(duration || 19 * 60 + 45)}</time>
          </div>
          <div className="lesson-player__cluster">
            <button
              type="button"
              className={captionsOn ? "is-active" : ""}
              onClick={() => setCaptionsOn((on) => !on)}
              aria-pressed={captionsOn}
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
      </div>
    </article>
  );
}

function MaterialsGrid() {
  return (
    <div className="course-overview-materials__grid lesson-player-materials__grid">
      {LESSON_MATERIALS.map((material) => {
        const MaterialIcon = material.extension === "pptx" ? Presentation : FileText;
        return (
          <button
            type="button"
            className={`course-overview-material course-overview-material--${material.extension}`}
            key={material.id}
            aria-label={`Download ${material.title}, ${material.size}`}
          >
            <span className="course-overview-material__icon">
              <MaterialIcon aria-hidden="true" />
              <small>{material.extension}</small>
            </span>
            <span className="course-overview-material__copy">
              <strong>{material.title}</strong>
              <small>{material.size}</small>
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
}

function MaterialsCard({ className = "", hidden = false }: MaterialsCardProps) {
  return (
    <article
      className={`course-overview-card course-overview-materials${className ? ` ${className}` : ""}`}
      hidden={hidden}
    >
      <header>
        <h2>Lesson materials</h2>
        <button type="button">View all materials <ArrowRight aria-hidden="true" /></button>
      </header>
      <MaterialsGrid />
    </article>
  );
}

export function LessonPlayerPage() {
  const { lessonId = ALL_LESSONS[0].id } = useParams();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<LessonTabId>("overview");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>("module-1");

  const lessonIndex = Math.max(0, ALL_LESSONS.findIndex((lesson) => lesson.id === lessonId));
  const current = ALL_LESSONS[lessonIndex] ?? ALL_LESSONS[0];
  const previous = ALL_LESSONS[lessonIndex - 1];
  const next = ALL_LESSONS[lessonIndex + 1];

  const openLesson = (id: string) => navigate(`${COURSE_PATH}/lessons/${id}`);

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
      <header className="course-overview-heading">
        <nav className="course-overview-breadcrumb" aria-label="Breadcrumb">
          <Link to="/my-courses">My Courses</Link>
          <ChevronRight aria-hidden="true" />
          <Link to={COURSE_PATH}>Human Anatomy I</Link>
          <ChevronRight aria-hidden="true" />
          <span aria-current="page">Lesson {current.number}</span>
        </nav>
        <div className="course-overview-heading__row">
          <div>
            <h1 id="lesson-player-title">{current.title}</h1>
            <p>
              Lesson {current.number} of 14
              <i />
              Module {current.module.number}: {current.module.title}
              <i />
              <em className={`lesson-player-status${isComplete ? " is-complete" : ""}`}>
                {isComplete ? "Completed" : "In progress"}
              </em>
              <i />
              20 min
            </p>
          </div>
          <div className="lesson-player-heading__actions">
            <button
              type="button"
              className="course-overview-heading__bookmark"
              aria-label={isBookmarked ? "Remove lesson bookmark" : "Bookmark this lesson"}
              aria-pressed={isBookmarked}
              onClick={() => setIsBookmarked((currentValue) => !currentValue)}
            >
              <Bookmark aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} />
            </button>
            <button type="button" className="lesson-player-heading__more" aria-label="More lesson actions">
              <MoreHorizontal aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="course-overview-layout">
        <div className={`course-overview-primary${activeTab === "overview" ? "" : " is-tab-expanded"}`}>
          {activeTab === "overview" ? <LessonVideoPlayer /> : null}

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
            <div className="course-overview-info-row">
              <article className="course-overview-card course-overview-about">
                <h2>About this lesson</h2>
                <p>
                  This lesson introduces human anatomy and the language clinicians use to describe body structure, orientation, and movement.
                </p>
                <dl>
                  <div><Clock3 aria-hidden="true" /><span><dt>Duration</dt><dd>{current.duration}</dd></span></div>
                  <div><Gauge aria-hidden="true" /><span><dt>Level</dt><dd>Beginner</dd></span></div>
                  <div><LayoutGrid aria-hidden="true" /><span><dt>Topic</dt><dd>Anatomy</dd></span></div>
                  <div><UsersRound aria-hidden="true" /><span><dt>Students learned</dt><dd>8.4K</dd></span></div>
                </dl>
              </article>
              <article className="course-overview-card course-overview-learn lesson-player-learn">
                <h2>What you’ll learn</h2>
                <div className="lesson-player-learn__body">
                  <ul>
                    {LESSON_OUTCOMES.map((outcome) => (
                      <li key={outcome}><CheckCircle2 aria-hidden="true" /><span>{outcome}</span></li>
                    ))}
                  </ul>
                  <img src={anatomyArt} alt="" className="lesson-player-learn__art" />
                </div>
              </article>
            </div>
            <MaterialsCard className="course-overview-materials--primary" />
          </div>

          <div className="course-overview-panel course-overview-panel--notes" role="tabpanel" id="lesson-player-panel-notes" aria-labelledby="lesson-player-tab-notes" hidden={activeTab !== "notes"}>
            <LearningNotesPanel onViewResources={() => setActiveTab("resources")} />
          </div>
          <div className="course-overview-panel course-overview-panel--resources" role="tabpanel" id="lesson-player-panel-resources" aria-labelledby="lesson-player-tab-resources" hidden={activeTab !== "resources"}>
            <CourseResourcesPanel />
          </div>
          <div className="course-overview-panel course-overview-panel--discussion" role="tabpanel" id="lesson-player-panel-discussion" aria-labelledby="lesson-player-tab-discussion" hidden={activeTab !== "discussion"}>
            <CourseDiscussionPanel />
          </div>

          {activeTab === "overview" ? (
            <nav className="lesson-player-nav" aria-label="Lesson navigation">
              <button type="button" className="lesson-player-nav__ghost" disabled={!previous} onClick={() => previous && openLesson(previous.id)}>
                <ChevronLeft aria-hidden="true" /> Previous lesson
              </button>
              <button type="button" className={`lesson-player-nav__complete${isComplete ? " is-done" : ""}`} onClick={() => setIsComplete((currentValue) => !currentValue)}>
                <CheckCircle2 aria-hidden="true" /> {isComplete ? "Completed" : "Mark as complete"}
              </button>
              <button type="button" className="lesson-player-nav__ghost" disabled={!next} onClick={() => next && openLesson(next.id)}>
                Next lesson <ChevronRight aria-hidden="true" />
              </button>
            </nav>
          ) : null}
        </div>

        <aside className="course-overview-rail" aria-label="Course support information">
          {activeTab === "notes" ? (
            <NotesWorkspaceRail />
          ) : activeTab === "resources" ? (
            <ResourcesWorkspaceRail />
          ) : activeTab === "discussion" ? (
            <DiscussionWorkspaceRail />
          ) : (
            <>
          <article className="course-overview-card course-overview-curriculum">
            <header>
              <h2>Course curriculum</h2>
              <span>0% complete</span>
            </header>
            <div className="course-overview-curriculum__modules">
              {COURSE_MODULES.map((module) => {
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
                      <span><strong>Module {module.number}: {module.title}</strong></span>
                      <small>{module.lessonCount} lessons</small>
                      <ChevronDown className="course-overview-module__trailing-chevron" aria-hidden="true" />
                    </button>
                    <div className="course-overview-module__lessons" id={`lesson-player-${module.id}-lessons`} hidden={!isExpanded}>
                      {module.lessons?.map((lesson) => (
                        <button
                          type="button"
                          className={`course-overview-lesson${lesson.ready ? " is-ready" : ""}${lesson.id === current.id ? " is-current" : ""}${lesson.complete && lesson.id !== current.id ? " is-complete" : ""}`}
                          key={lesson.id}
                          aria-current={lesson.id === current.id ? "page" : undefined}
                          onClick={lesson.ready ? () => openLesson(lesson.id) : undefined}
                        >
                          <span className="course-overview-lesson__marker">
                            {lesson.id === current.id ? <Play aria-hidden="true" /> : lesson.complete ? <CheckCircle2 aria-hidden="true" /> : lesson.ready ? <Play aria-hidden="true" /> : <i />}
                          </span>
                          <span className="course-overview-lesson__number">{lesson.number}</span>
                          <strong>{lesson.title}</strong>
                          {lesson.id === current.id ? <em>Playing</em> : null}
                          <time>{lesson.duration}</time>
                        </button>
                      )) ?? (
                        <p className="course-overview-module__summary"><BookOpen aria-hidden="true" /> {module.lessonCount} lessons in this module</p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </article>

          <article className="course-overview-card course-overview-progress">
            <header><h2>Course progress</h2><strong>0%</strong></header>
            <div className="course-overview-progress__track" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span /></div>
            <dl className="course-overview-progress__metrics">
              <div><dt>Lessons</dt><dd>14</dd></div>
              <div><dt>Modules</dt><dd>6</dd></div>
              <div><dt>Total duration</dt><dd>12h 40m</dd></div>
              <div><dt>Certificate</dt><dd>1</dd></div>
            </dl>
          </article>

          {next ? (
            <article className="course-overview-card lesson-player-upnext">
              <h2>Up next</h2>
              <button type="button" className="lesson-player-upnext__card" onClick={() => openLesson(next.id)}>
                <img src={anatomyArt} alt="" />
                <strong>{next.title}</strong>
                <small>Lesson {next.number} • {next.duration}</small>
                <b><Play aria-hidden="true" /> Play next</b>
              </button>
            </article>
          ) : null}
            </>
          )}
        </aside>

        <MaterialsCard
          className="course-overview-materials--full"
          hidden={activeTab !== "overview"}
        />
      </div>
    </section>
  );
}
