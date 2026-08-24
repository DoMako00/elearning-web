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

const heading = (level: 2 | 3, text: string) => ({
  type: "heading" as const,
  attrs: { level },
  content: [{ type: "text" as const, text }],
});

const paragraph = (text: string) => ({
  type: "paragraph" as const,
  content: [{ type: "text" as const, text }],
});

const bulletList = (items: string[]) => ({
  type: "bulletList" as const,
  content: items.map((item) => ({
    type: "listItem" as const,
    content: [paragraph(item)],
  })),
});

const column = (blocks: object[]) => ({
  type: "noteColumn" as const,
  content: blocks,
});

export const INITIAL_NOTES_CONTENT = {
  type: "doc",
  content: [
    heading(3, "1. The Human Body: An Overview"),
    paragraph(
      "Anatomy is the study of the structure of the human body and the relationships among its parts. Clinicians use a shared language so every description of location, direction, and movement is unambiguous.",
    ),
    bulletList([
      "Gross anatomy studies structures visible to the unaided eye; microscopic anatomy studies cells and tissues.",
      "The body is organized from chemical → cellular → tissue → organ → system → organism levels.",
      "Standard terms let teams describe findings the same way in lectures, labs, and clinics.",
    ]),
    heading(3, "2. Anatomical Position"),
    paragraph(
      "The anatomical position is the reference posture used for all directional and planar descriptions. Unless stated otherwise, every term below assumes this stance.",
    ),
    { type: "anatomyFigure" },
    bulletList([
      "Standing upright, facing forward",
      "Head and eyes directed anteriorly",
      "Arms at the sides with palms facing forward",
      "Feet close together, toes pointing forward",
    ]),
    {
      type: "noteColumns",
      content: [
        column([
          heading(3, "3. Anatomical Planes"),
          bulletList([
            "Sagittal — divides the body into left and right parts. The midsagittal plane is exactly on the midline.",
            "Frontal (coronal) — divides the body into anterior and posterior parts.",
            "Transverse (horizontal) — divides the body into superior and inferior parts.",
          ]),
        ]),
        column([
          heading(3, "4. Directional Terms"),
          bulletList([
            "Superior — toward the head; above",
            "Inferior — toward the feet; below",
            "Anterior — toward the front",
            "Posterior — toward the back",
            "Medial — toward the midline",
            "Lateral — away from the midline",
            "Proximal — closer to the trunk",
            "Distal — farther from the trunk",
          ]),
        ]),
        column([
          heading(3, "5. Body Regions"),
          bulletList([
            "Head (cephalic region)",
            "Neck (cervical region)",
            "Thorax (chest)",
            "Abdomen",
            "Pelvis",
            "Upper limb",
            "Lower limb",
            "Back (dorsal region)",
          ]),
        ]),
      ],
    },
  ],
};
