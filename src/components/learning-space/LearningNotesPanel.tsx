import { ArrowRight, CheckCircle2, Download, FileText } from "lucide-react";
import { useState } from "react";
import { getStudentProtectedMedia } from "../../features/student/api/studentCoursesApi";
import type { LearningSpaceResource } from "./learningSpaceMappers";
import { CollaborativeNotesBoard } from "./CollaborativeNotesBoard";

interface LearningNotesPanelProps {
  lessonId?: string;
  lessonTitle?: string;
  resources: readonly LearningSpaceResource[];
  onOpenLesson: (lessonId: string) => void;
  onViewResources?: () => void;
}

export function LearningNotesPanel({ lessonId, lessonTitle, resources, onOpenLesson, onViewResources }: LearningNotesPanelProps) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openResource = async (resource: LearningSpaceResource) => {
    if (!resource.available || openingId) return;
    setError(null);
    if (resource.extension === "video") { onOpenLesson(resource.lessonId); return; }
    setOpeningId(resource.id);
    try {
      const delivery = await getStudentProtectedMedia({ assetId: resource.id });
      window.location.assign(delivery.delivery.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The protected resource could not be opened.");
    } finally { setOpeningId(null); }
  };

  return (
    <div className="learning-notes">
      <CollaborativeNotesBoard lessonId={lessonId} title={lessonTitle ? `Notes — ${lessonTitle}` : "Lesson notes"} />
      <section className="learning-files" aria-labelledby="referenced-files-title">
        <header>
          <h2 id="referenced-files-title">Published lesson resources</h2>
          <button type="button" onClick={onViewResources}>
            View all resources <ArrowRight aria-hidden="true" />
          </button>
        </header>
        <div className="learning-files__grid">
          {resources.map((resource) => {
            return (
              <button
                type="button"
                className={`learning-file learning-file--${resource.extension}`}
                key={resource.id}
                aria-label={`Open protected ${resource.title}`}
                disabled={!resource.available || openingId === resource.id}
                onClick={() => void openResource(resource)}
              >
                <span className="learning-file__icon">
                  <FileText aria-hidden="true" />
                  <small>{resource.extension}</small>
                </span>
                <span className="learning-file__copy">
                  <strong>{resource.title}</strong>
                  <small>{resource.chapterTitle}</small>
                </span>
                {resource.available ? <Download className="learning-file__download" aria-hidden="true" /> : <CheckCircle2 className="learning-file__download" aria-hidden="true" />}
              </button>
            );
          })}
          {resources.length === 0 ? <p className="learning-resources__empty">No published resources are attached to this course.</p> : null}
        </div>
        {error ? <p role="alert" className="learning-resources__empty">{error}</p> : null}
      </section>
    </div>
  );
}
