import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

function AnatomicalPositionArt() {
  return (
    <svg viewBox="0 0 120 220" role="img" aria-label="Anatomical position">
      <title>Anatomical position</title>
      <circle cx="60" cy="22" r="16" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M60 38v78M60 72h-28M60 72h28M32 72v48M88 72v48M60 116l-18 72M60 116l18 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 120h-10M88 120h10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function AnatomyFigureView() {
  return (
    <NodeViewWrapper className="notes-board__figure" data-type="anatomy-figure">
      <AnatomicalPositionArt />
    </NodeViewWrapper>
  );
}

export const AnatomyFigure = Node.create({
  name: "anatomyFigure",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML() {
    return [{ tag: 'div[data-type="anatomy-figure"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "anatomy-figure" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(AnatomyFigureView);
  },
});
export const NoteColumn = Node.create({
  name: "noteColumn",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: 'div[data-type="note-column"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "note-column", class: "notes-board__column" }), 0];
  },
});
export const NoteColumns = Node.create({
  name: "noteColumns",
  group: "block",
  content: "noteColumn noteColumn noteColumn",
  isolating: true,
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-type="note-columns"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "note-columns", class: "notes-board__columns" }), 0];
  },
});
