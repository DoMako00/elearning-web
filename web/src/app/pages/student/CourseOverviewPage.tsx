import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  Download,
  FileText,
  Gauge,
  LayoutGrid,
  MessageSquareText,
  Paperclip,
  Play,
  Presentation,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UsersRound,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import anatomyHeroBg from "../../../Assets/image copy.webp";
import "./CourseOverviewPage.css";

const FIRST_LESSON_ID = "human-anatomy-i-lesson-1";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "resources", label: "Resources", icon: Paperclip },
  { id: "discussion", label: "Discussion", icon: MessageSquareText },
] as const;

type CourseTabId = (typeof TABS)[number]["id"];

interface Lesson {
  id: string;
  number: number;
  title: string;
  duration: string;
  ready?: boolean;
}

interface CourseModule {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  lessons?: Lesson[];
}

interface CourseMaterial {
  id: string;
  title: string;
  extension: "pdf" | "pptx";
  size: string;
}

export interface CourseOverviewPageProps {
  onStartLesson?: (lessonId: string) => void;
}

const COURSE_MODULES: CourseModule[] = [
  {
    id: "module-1",
    number: 1,
    title: "Introduction to Anatomy",
    lessonCount: 3,
    lessons: [
      {
        id: FIRST_LESSON_ID,
        number: 1,
        title: "Introduction to Anatomy & Anatomical Terms",
        duration: "24:35",
        ready: true,
      },
      {
        id: "human-anatomy-i-lesson-2",
        number: 2,
        title: "Basic Anatomical Positions & Directional Terms",
        duration: "18:50",
      },
      {
        id: "human-anatomy-i-lesson-3",
        number: 3,
        title: "Body Cavities & Regions",
        duration: "20:15",
      },
    ],
  },
  { id: "module-2", number: 2, title: "Upper Limb", lessonCount: 5 },
  { id: "module-3", number: 3, title: "Thorax", lessonCount: 4 },
  { id: "module-4", number: 4, title: "Abdomen & Pelvis", lessonCount: 5 },
  { id: "module-5", number: 5, title: "Lower Limb", lessonCount: 4 },
  {
    id: "module-6",
    number: 6,
    title: "Neuroanatomy Foundations",
    lessonCount: 3,
  },
];

const COURSE_MATERIALS: CourseMaterial[] = [
  {
    id: "anatomy-syllabus",
    title: "Human Anatomy I Syllabus.pdf",
    extension: "pdf",
    size: "1.2 MB",
  },
  {
    id: "anatomy-slides",
    title: "Intro to Anatomy Slides.pptx",
    extension: "pptx",
    size: "8.6 MB",
  },
  {
    id: "anatomical-terms-checklist",
    title: "Anatomical Terms Checklist.pdf",
    extension: "pdf",
    size: "420 KB",
  },
  {
    id: "osteology-atlas",
    title: "Basic Osteology Atlas.pdf",
    extension: "pdf",
    size: "12.4 MB",
  },
];

const LEARNING_OUTCOMES = [
  "Understand anatomy fundamentals and terminology",
  "Use anatomical positions and directional terms",
  "Identify major bones, muscles, and organs",
  "Describe the organization of body systems",
  "Apply anatomy to real medical scenarios",
] as const;

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
      <img
        src={anatomyHeroBg}
        alt=""
        className="course-overview-hero__art-img"
      />
    </div>
  );
}

function MaterialsGrid() {
  return (
    <div className="course-overview-materials__grid">
      {COURSE_MATERIALS.map((material) => {
        const MaterialIcon = material.extension === "pptx" ? Presentation : FileText;

        return (
          <button
            type="button"
            className={`course-overview-material course-overview-material--${material.extension}`}
            key={material.id}
            aria-label={`Open ${material.title}, ${material.size}`}
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
        <h2>Recent materials</h2>
        <button type="button">View all resources <ArrowRight aria-hidden="true" /></button>
      </header>
      <MaterialsGrid />
    </article>
  );
}

export function CourseOverviewPage({ onStartLesson }: CourseOverviewPageProps) {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<CourseTabId>("overview");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>("module-1");

  const startLesson = (lessonId: string) => {
    onStartLesson?.(lessonId);
    navigate(`/my-courses/human-anatomy-i/lessons/${lessonId}`);
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

  const toggleBookmark = () => setIsBookmarked((current) => !current);

  return (
    <section className="course-overview-page" aria-labelledby="course-overview-title">
      <header className="course-overview-heading">
        <nav className="course-overview-breadcrumb" aria-label="Breadcrumb">
          <Link to="/my-courses">My Courses</Link>
          <ChevronRight aria-hidden="true" />
          <span aria-current="page">Human Anatomy I</span>
        </nav>
        <div className="course-overview-heading__row">
          <div>
            <h1 id="course-overview-title">Human Anatomy I</h1>
            <p>BUC School of Medicine <i /> Semester 1 <i /> Basic Medical Sciences</p>
          </div>
          <button
            type="button"
            className="course-overview-heading__bookmark"
            aria-label={isBookmarked ? "Remove Human Anatomy I from saved courses" : "Save Human Anatomy I"}
            aria-pressed={isBookmarked}
            onClick={toggleBookmark}
          >
            <Bookmark aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </header>

      <div className="course-overview-layout">
        <div className="course-overview-primary">
          <article className="course-overview-hero" aria-labelledby="course-lesson-title">
            <AnatomyHeroArt />
            <div className="course-overview-hero__content">
              <div className="course-overview-hero__intro">
                <span className="course-overview-hero__status">
                  <CirclePlay aria-hidden="true" />
                  Ready to start
                </span>
                <h2 id="course-lesson-title">
                  <span className="course-overview-hero__title-line">Introduction to </span>
                  <span className="course-overview-hero__title-line">Anatomy &amp; </span>
                  <span className="course-overview-hero__title-line">Anatomical Terms</span>
                </h2>
                <p className="course-overview-hero__lesson">Lesson 1 of 14</p>
                <span className="course-overview-hero__divider" aria-hidden="true" />
              </div>
              <div className="course-overview-hero__footer">
                <div className="course-overview-hero__instructor">
                  <InstructorPortrait />
                  <span><strong>Dr. Ahmed Hassan</strong><small>Professor of Anatomy</small></span>
                </div>
                <span className="course-overview-hero__divider" aria-hidden="true" />
                <div className="course-overview-hero__actions">
                  <button type="button" className="course-overview-hero__start" onClick={() => startLesson(FIRST_LESSON_ID)}>
                    <CirclePlay aria-hidden="true" /> Start lesson
                  </button>
                  <button
                    type="button"
                    className="course-overview-hero__bookmark"
                    aria-label={isBookmarked ? "Remove lesson bookmark" : "Bookmark first lesson"}
                    aria-pressed={isBookmarked}
                    onClick={toggleBookmark}
                  >
                    <Bookmark aria-hidden="true" fill={isBookmarked ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
            <dl className="course-overview-hero__meta">
              <div><Clock3 aria-hidden="true" /><span><dt>Duration</dt><dd>24:35 min</dd></span></div>
              <div><Gauge aria-hidden="true" /><span><dt>Level</dt><dd>Beginner</dd></span></div>
              <div><Sparkles aria-hidden="true" /><span><dt>XP Reward</dt><dd>50 XP</dd></span></div>
            </dl>
          </article>

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

          <div
            className="course-overview-panel course-overview-panel--overview"
            role="tabpanel"
            id="course-overview-panel-overview"
            aria-labelledby="course-overview-tab-overview"
            hidden={activeTab !== "overview"}
          >
            <div className="course-overview-info-row">
              <article className="course-overview-card course-overview-about">
                <h2>About this course</h2>
                <p>
                  This course provides a comprehensive introduction to human anatomy, covering the structure and function of the human body systems.
                </p>
                <dl>
                  <div><Sparkles aria-hidden="true" /><span><dt>Level</dt><dd>Beginner</dd></span></div>
                  <div><LayoutGrid aria-hidden="true" /><span><dt>Modules</dt><dd>6</dd></span></div>
                  <div><UsersRound aria-hidden="true" /><span><dt>Students enrolled</dt><dd>12.6K</dd></span></div>
                  <div><ShieldCheck aria-hidden="true" /><span><dt>Certificate</dt><dd>Yes</dd></span></div>
                </dl>
              </article>
              <article className="course-overview-card course-overview-learn">
                <h2>What you’ll learn</h2>
                <ul>
                  {LEARNING_OUTCOMES.map((outcome) => (
                    <li key={outcome}><CheckCircle2 aria-hidden="true" /><span>{outcome}</span></li>
                  ))}
                </ul>
              </article>
            </div>
            <MaterialsCard className="course-overview-materials--primary" />
          </div>

          <div className="course-overview-panel course-overview-panel--message" role="tabpanel" id="course-overview-panel-notes" aria-labelledby="course-overview-tab-notes" hidden={activeTab !== "notes"}>
            <StickyNote aria-hidden="true" /><div><h2>No notes yet</h2><p>Start the first lesson to create and organize your anatomy notes.</p></div>
          </div>
          <div className="course-overview-panel course-overview-panel--resources" role="tabpanel" id="course-overview-panel-resources" aria-labelledby="course-overview-tab-resources" hidden={activeTab !== "resources"}>
            <header><div><h2>Course resources</h2><p>Reference files provided for Human Anatomy I.</p></div></header>
            <MaterialsGrid />
          </div>
          <div className="course-overview-panel course-overview-panel--message" role="tabpanel" id="course-overview-panel-discussion" aria-labelledby="course-overview-tab-discussion" hidden={activeTab !== "discussion"}>
            <MessageSquareText aria-hidden="true" /><div><h2>Discussion opens with Lesson 1</h2><p>Start the course to join the anatomy discussion with your instructor and classmates.</p></div>
          </div>
        </div>

        <aside className="course-overview-rail" aria-label="Course support information">
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
                      aria-controls={`course-overview-${module.id}-lessons`}
                      onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                    >
                      <ChevronRight className="course-overview-module__leading-chevron" aria-hidden="true" />
                      <span><strong>Module {module.number}: {module.title}</strong></span>
                      <small>{module.lessonCount} lessons</small>
                      <ChevronDown className="course-overview-module__trailing-chevron" aria-hidden="true" />
                    </button>
                    <div className="course-overview-module__lessons" id={`course-overview-${module.id}-lessons`} hidden={!isExpanded}>
                      {module.lessons?.map((lesson) => (
                        <button
                          type="button"
                          className={`course-overview-lesson${lesson.ready ? " is-ready" : ""}`}
                          key={lesson.id}
                          aria-label={`${lesson.title}, ${lesson.duration}${lesson.ready ? ", ready to begin" : ""}`}
                          onClick={lesson.ready ? () => startLesson(lesson.id) : undefined}
                        >
                          <span className="course-overview-lesson__marker">{lesson.ready ? <Play aria-hidden="true" /> : <i />}</span>
                          <span className="course-overview-lesson__number">{lesson.number}</span>
                          <strong>{lesson.title}</strong>
                          {lesson.ready ? <em>Ready</em> : null}
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

        </aside>

        <MaterialsCard
          className="course-overview-materials--full"
          hidden={activeTab !== "overview"}
        />
      </div>
    </section>
  );
}
