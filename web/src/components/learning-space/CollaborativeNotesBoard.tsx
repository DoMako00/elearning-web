import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Lock, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { AnatomyFigure, INITIAL_NOTES_CONTENT, NoteColumn, NoteColumns } from "./notesBoardSchema";

const ROOM_NAME = "greenlearn-human-anatomy-i-notes";
const LOCAL_USER = { name: "Juliana", color: "#20a862" };

const sharedDocs = new Map<string, Y.Doc>();
const sharedProviders = new Map<string, WebrtcProvider>();

function getSharedDoc(room: string) {
  const existing = sharedDocs.get(room);
  if (existing) return existing;
  const doc = new Y.Doc();
  sharedDocs.set(room, doc);
  return doc;
}

function getSharedProvider(room: string, doc: Y.Doc) {
  const existing = sharedProviders.get(room);
  if (existing) return existing;
  const provider = new WebrtcProvider(room, doc, {
    signaling: ["wss://signaling.yjs.dev"],
  });
  provider.awareness.setLocalStateField("user", LOCAL_USER);
  sharedProviders.set(room, provider);
  return provider;
}

interface CollaborativeNotesBoardProps {
  title?: string;
}

export function CollaborativeNotesBoard({
  title = "Lesson Notes — Introduction to Anatomy & Anatomical Terms",
}: CollaborativeNotesBoardProps) {
  const ydoc = useMemo(() => getSharedDoc(ROOM_NAME), []);
  const provider = useMemo(() => getSharedProvider(ROOM_NAME, ydoc), [ydoc]);
  const [peerCount, setPeerCount] = useState(1);

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
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({
        provider,
        user: LOCAL_USER,
      }),
    ],
    editorProps: {
      attributes: {
        class: "notes-board__editor",
        "aria-label": title,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const fragment = ydoc.getXmlFragment("default");
    if (fragment.length === 0 && editor.isEmpty) {
      editor.commands.setContent(INITIAL_NOTES_CONTENT);
    }
  }, [editor, ydoc]);

  useEffect(() => {
    const awareness = provider.awareness;
    const syncPeers = () => setPeerCount(Math.max(1, awareness.getStates().size));
    syncPeers();
    awareness.on("change", syncPeers);
    return () => {
      awareness.off("change", syncPeers);
    };
  }, [provider]);

  return (
    <article className="notes-board">
      <header className="notes-board__header">
        <h2>{title}</h2>
        <div className="notes-board__status">
          <span className="notes-board__live">
            <Radio aria-hidden="true" />
            Live board · {peerCount} {peerCount === 1 ? "editor" : "editors"}
          </span>
          <span className="notes-board__hint">
            <Lock aria-hidden="true" />
            Shared lesson board
          </span>
        </div>
      </header>
      <p className="notes-board__lede">
        Collaborate on this lesson board in real time. Edits sync with classmates on the same course notes.
      </p>
      <div className="notes-board__surface">
        <EditorContent editor={editor} />
      </div>
    </article>
  );
}
