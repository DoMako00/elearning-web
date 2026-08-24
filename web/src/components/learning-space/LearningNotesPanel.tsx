import { ArrowRight, Download, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import { CollaborativeNotesBoard } from "./CollaborativeNotesBoard";
import { REFERENCED_LESSON_FILES } from "./learningSpaceData";

interface LearningNotesPanelProps {
  onViewResources?: () => void;
}

export function LearningNotesPanel({ onViewResources }: LearningNotesPanelProps) {
  return (
    <div className="learning-notes">
      <CollaborativeNotesBoard />
      <section className="learning-files" aria-labelledby="referenced-files-title">
        <header>
          <h2 id="referenced-files-title">Referenced lesson files</h2>
          <button type="button" onClick={onViewResources}>
            View all resources <ArrowRight aria-hidden="true" />
          </button>
        </header>
        <div className="learning-files__grid">
          {REFERENCED_LESSON_FILES.map((file) => {
            const Icon = file.extension === "pptx" ? Presentation : file.extension === "csv" ? FileSpreadsheet : FileText;
            return (
              <button
                type="button"
                className={`learning-file learning-file--${file.extension}`}
                key={file.id}
                aria-label={`Download ${file.title}, ${file.size}`}
              >
                <span className="learning-file__icon">
                  <Icon aria-hidden="true" />
                  <small>{file.extension}</small>
                </span>
                <span className="learning-file__copy">
                  <strong>{file.title}</strong>
                  <small>{file.size}</small>
                </span>
                <Download className="learning-file__download" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
