import { ExternalLink, FileText, Pin, Play } from "lucide-react";
import type { LearningSpaceModuleSummary, LearningSpaceResource } from "./learningSpaceMappers";

function FileGlyph({ extension }: { extension: LearningSpaceResource["extension"] }) {
  return extension === "video" ? <Play aria-hidden="true" /> : <FileText aria-hidden="true" />;
}

interface WorkspaceCurriculumProps {
  modules: readonly LearningSpaceModuleSummary[];
  activeModuleId?: string;
  actionLabel?: string;
  onSelectModule?: (lessonId: string) => void;
  onAction?: () => void;
}

export function WorkspaceCurriculum({
  modules,
  activeModuleId,
  actionLabel = "View full curriculum",
  onSelectModule,
  onAction,
}: WorkspaceCurriculumProps) {
  return (
    <article className="course-overview-card workspace-rail-card">
      <header>
        <h2>Course curriculum</h2>
      </header>
      <ul className="workspace-curriculum">
        {modules.map((module) => (
          <li key={module.id}>
            <button
              type="button"
              className={module.id === activeModuleId ? "is-active" : ""}
              aria-current={module.id === activeModuleId ? "true" : undefined}
              onClick={() => module.firstLessonId && onSelectModule?.(module.firstLessonId)}
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
        {modules.length === 0 ? <li><span>No published chapters are available.</span></li> : null}
      </ul>
      <button type="button" className="workspace-rail-link" onClick={onAction}>
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
      <p className="workspace-rail-copy">No course-specific key terms have been published.</p>
      <button type="button" className="workspace-rail-action" disabled>
        Study guide not available <ExternalLink aria-hidden="true" />
      </button>
    </article>
  );
}

export function PinnedResourcesCard({ resources, onOpenResource }: { resources: readonly LearningSpaceResource[]; onOpenResource: (resource: LearningSpaceResource) => void }) {
  return (
    <article className="course-overview-card workspace-rail-card">
      <header>
        <h2>Course resources</h2>
      </header>
      <ul className="workspace-pin-list">
        {resources.map((resource) => (
          <li key={resource.id}>
            <button type="button" disabled={!resource.available} onClick={() => onOpenResource(resource)} aria-label={`Open protected ${resource.title}`}>
              <span className={`workspace-file-icon workspace-file-icon--${resource.extension}`}><FileGlyph extension={resource.extension} /></span>
              <span><strong>{resource.title}</strong><small>{resource.chapterTitle}</small></span>
              <Pin aria-hidden="true" />
            </button>
          </li>
        ))}
        {resources.length === 0 ? <li><span>No published course resources are available.</span></li> : null}
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
      <p className="workspace-rail-copy">Download history is not available for this account.</p>
    </article>
  );
}

export function NotesWorkspaceRail({ modules, onSelectModule, onAction }: { modules: readonly LearningSpaceModuleSummary[]; onSelectModule?: (lessonId: string) => void; onAction?: () => void }) {
  return (
    <>
      <WorkspaceCurriculum modules={modules} activeModuleId={modules[0]?.id} actionLabel="View full curriculum" onSelectModule={onSelectModule} onAction={onAction} />
      <KeyTermsCard />
    </>
  );
}

export function ResourcesWorkspaceRail({ modules, resources, onSelectModule, onAction, onOpenResource }: { modules: readonly LearningSpaceModuleSummary[]; resources: readonly LearningSpaceResource[]; onSelectModule?: (lessonId: string) => void; onAction?: () => void; onOpenResource: (resource: LearningSpaceResource) => void }) {
  return (
    <>
      <WorkspaceCurriculum modules={modules} activeModuleId={modules[0]?.id} onSelectModule={onSelectModule} onAction={onAction} />
      <PinnedResourcesCard resources={resources} onOpenResource={onOpenResource} />
      <RecentDownloadsCard />
    </>
  );
}

export function DiscussionWorkspaceRail({ modules, onSelectModule }: { modules: readonly LearningSpaceModuleSummary[]; onSelectModule?: (lessonId: string) => void }) {
  return (
    <>
      <WorkspaceCurriculum modules={modules} activeModuleId={modules[0]?.id} onSelectModule={onSelectModule} />
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
