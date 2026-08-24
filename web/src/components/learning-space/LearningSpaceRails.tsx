import { Download, ExternalLink, FileSpreadsheet, FileText, Pin, Presentation } from "lucide-react";
import {
  COURSE_MODULE_SUMMARIES,
  KEY_TERMS,
  PINNED_RESOURCES,
  RECENT_DOWNLOADS,
  type CourseModuleSummary,
} from "./learningSpaceData";

function FileGlyph({ extension }: { extension: string }) {
  if (extension === "pptx") return <Presentation aria-hidden="true" />;
  if (extension === "csv") return <FileSpreadsheet aria-hidden="true" />;
  return <FileText aria-hidden="true" />;
}

interface WorkspaceCurriculumProps {
  activeModuleId?: string;
  actionLabel?: string;
}

export function WorkspaceCurriculum({
  activeModuleId = "module-1",
  actionLabel = "View full curriculum",
}: WorkspaceCurriculumProps) {
  return (
    <article className="course-overview-card workspace-rail-card">
      <header>
        <h2>Course curriculum</h2>
      </header>
      <ul className="workspace-curriculum">
        {COURSE_MODULE_SUMMARIES.map((module) => (
          <li key={module.id}>
            <button
              type="button"
              className={module.id === activeModuleId ? "is-active" : ""}
              aria-current={module.id === activeModuleId ? "true" : undefined}
            >
              <span>
                <strong>
                  Module {module.number}: {module.title}
                </strong>
              </span>
              <small>{module.lessonCount} lessons</small>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="workspace-rail-link">
        {actionLabel}
      </button>
    </article>
  );
}

export function KeyTermsCard() {
  return (
    <article className="course-overview-card workspace-rail-card workspace-key-terms">
      <header>
        <h2>Key terms to know</h2>
      </header>
      <dl>
        {KEY_TERMS.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="workspace-rail-action">
        View full study guide <ExternalLink aria-hidden="true" />
      </button>
    </article>
  );
}

export function PinnedResourcesCard() {
  return (
    <article className="course-overview-card workspace-rail-card">
      <header>
        <h2>Pinned resources</h2>
      </header>
      <ul className="workspace-pin-list">
        {PINNED_RESOURCES.map((resource) => (
          <li key={resource.id}>
            <span className={`workspace-file-icon workspace-file-icon--${resource.extension}`}>
              <FileGlyph extension={resource.extension} />
            </span>
            <span>
              <strong>{resource.title}</strong>
              <small>{resource.size}</small>
            </span>
            <Pin aria-hidden="true" />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function RecentDownloadsCard() {
  return (
    <article className="course-overview-card workspace-rail-card">
      <header>
        <h2>Recent downloads</h2>
      </header>
      <ul className="workspace-pin-list">
        {RECENT_DOWNLOADS.map((resource) => (
          <li key={resource.id}>
            <span className={`workspace-file-icon workspace-file-icon--${resource.extension}`}>
              <FileGlyph extension={resource.extension} />
            </span>
            <span>
              <strong>{resource.title}</strong>
              <small>
                {resource.downloaded} · {resource.size}
              </small>
            </span>
            <Download aria-hidden="true" />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function NotesWorkspaceRail() {
  return (
    <>
      <WorkspaceCurriculum activeModuleId="module-1" actionLabel="View full curriculum" />
      <KeyTermsCard />
    </>
  );
}

export function ResourcesWorkspaceRail() {
  return (
    <>
      <WorkspaceCurriculum activeModuleId="module-2" />
      <PinnedResourcesCard />
      <RecentDownloadsCard />
    </>
  );
}

export function DiscussionWorkspaceRail({ modules = COURSE_MODULE_SUMMARIES }: { modules?: CourseModuleSummary[] }) {
  return (
    <>
      <WorkspaceCurriculum activeModuleId={modules[0]?.id} />
      <article className="course-overview-card workspace-rail-card">
        <header>
          <h2>Discussion tips</h2>
        </header>
        <p className="workspace-rail-copy">
          Keep questions specific to a region, plane, or term so classmates and instructors can answer quickly.
        </p>
      </article>
    </>
  );
}
