import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CheckCircle2, Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useSaveStudentLessonNote, useStudentLessonNote } from "../../features/student/api/useStudentLearning";
import { AnatomyFigure, NoteColumn, NoteColumns } from "./notesBoardSchema";

interface CollaborativeNotesBoardProps {
  lessonId?: string;
  title?: string;
}

export function CollaborativeNotesBoard({
  lessonId,
  title = "Lesson notes",
}: CollaborativeNotesBoardProps) {
  const noteQuery = useStudentLessonNote(lessonId);
  const saveNote = useSaveStudentLessonNote(lessonId);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      AnatomyFigure,
      NoteColumn,
      NoteColumns,
      Placeholder.configure({
        placeholder: "Add a note to this shared board…",
      }),
    ],
    editable: Boolean(lessonId) && noteQuery.isSuccess && !noteQuery.isFetching,
    onUpdate: () => {
      setIsDirty(true);
      setSaved(false);
    },
    editorProps: {
      attributes: {
        class: "notes-board__editor",
        "aria-label": title,
      },
    },
  });

  useEffect(() => {
    if (!editor || !noteQuery.isSuccess) return;
    editor.commands.setContent(noteQuery.data.body || "", { emitUpdate: false });
    editor.setEditable(Boolean(lessonId));
    setIsDirty(false);
    setSaved(false);
  }, [editor, lessonId, noteQuery.data?.version, noteQuery.isSuccess]);

  const handleSave = async () => {
    if (!editor || !lessonId || saveNote.isPending || !isDirty) return;
    try {
      const body = editor.isEmpty ? "" : editor.getHTML();
      await saveNote.mutateAsync({ body, expectedVersion: noteQuery.data?.version ?? null });
      setIsDirty(false);
      setSaved(true);
    } catch {
      // The mutation error is rendered below; the unsaved editor content remains intact.
    }
  };

  return (
    <article className="notes-board">
      <header className="notes-board__header">
        <h2>{title}</h2>
        <div className="notes-board__status">
          <span className="notes-board__live" role="status">
            <CheckCircle2 aria-hidden="true" />
            {noteQuery.isLoading ? "Loading note" : saveNote.isPending ? "Saving" : saved ? "Saved" : isDirty ? "Unsaved changes" : "Private note"}
          </span>
          <span className="notes-board__hint">
            <Lock aria-hidden="true" />
            Only you can see this
          </span>
          <button type="button" className="workspace-rail-action" onClick={() => void handleSave()} disabled={!lessonId || !isDirty || saveNote.isPending || noteQuery.isLoading || noteQuery.isError}>
            <Save aria-hidden="true" /> {saveNote.isPending ? "Saving…" : "Save note"}
          </button>
        </div>
      </header>
      <p className="notes-board__lede">Your note is private and saved to this lesson when you choose Save note.</p>
      {noteQuery.isError ? <p role="alert" className="dashboard-feedback--error">{noteQuery.error instanceof Error ? noteQuery.error.message : "The lesson note could not be loaded."}</p> : null}
      {saveNote.isError ? <p role="alert" className="dashboard-feedback--error">{saveNote.error instanceof Error ? saveNote.error.message : "The lesson note could not be saved."}</p> : null}
      {!lessonId ? <p role="status">A published lesson is required before a note can be saved.</p> : null}
      <div className="notes-board__surface">
        <EditorContent editor={editor} />
      </div>
    </article>
  );
}
