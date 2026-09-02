import boneImg from "../../../Assets/Assingments/bone.webp";
import brainImg from "../../../Assets/Assingments/brain.webp";
import heartImg from "../../../Assets/Assingments/heart.webp";
import lungsImg from "../../../Assets/Assingments/lunges.webp";
import stomachImg from "../../../Assets/Assingments/stomach.webp";
import type {
  AssignmentDeadline,
  AssignmentFeedback,
  AssignmentItem,
  AssignmentDetailItem,
} from "./assignments.types";

export const ASSIGNMENT_ITEMS: AssignmentItem[] = [
  {
    id: "asg-1",
    category: "Cardiology",
    categoryTone: "green",
    title: "ECG Interpretation Case Study",
    description: "Analyze a 12-lead ECG and identify the rhythm, intervals, and likely diagnosis.",
    dueLabel: "May 24, 11:59 PM",
    relativeLabel: "2 days left",
    urgency: "soon",
    status: "in-progress",
    points: 75,
    progress: 60,
    image: heartImg,
    dueAt: "2026-05-24T23:59:00",
  },
  {
    id: "asg-2",
    category: "Neurology",
    categoryTone: "purple",
    title: "Cranial Nerve Mapping Lab",
    description: "Map cranial nerve pathways and localize the lesion from the clinical findings.",
    dueLabel: "May 22, 11:59 PM",
    relativeLabel: "Today",
    urgency: "today",
    status: "submitted",
    points: 50,
    image: brainImg,
    dueAt: "2026-05-22T23:59:00",
  },
  {
    id: "asg-3",
    category: "Pulmonology",
    categoryTone: "blue",
    title: "Respiratory Case Review",
    description: "Work through a dyspnea case covering ABGs, imaging, and first-line management.",
    dueLabel: "May 28, 11:59 PM",
    relativeLabel: "6 days left",
    urgency: "later",
    status: "not-started",
    points: 40,
    image: lungsImg,
    dueAt: "2026-05-28T23:59:00",
  },
  {
    id: "asg-4",
    category: "Orthopedics",
    categoryTone: "orange",
    title: "Fracture Classification Quiz",
    description: "Classify common fractures and choose the appropriate initial management plan.",
    dueLabel: "May 26, 11:59 PM",
    relativeLabel: "4 days left",
    urgency: "soon",
    status: "in-progress",
    points: 25,
    progress: 30,
    image: boneImg,
    dueAt: "2026-05-26T23:59:00",
  },
  {
    id: "asg-5",
    category: "Gastroenterology",
    categoryTone: "rose",
    title: "GI Pathology Report",
    description: "Interpret biopsy findings and write a concise pathology-informed clinical summary.",
    dueLabel: "May 20, 11:59 PM",
    relativeLabel: "Submitted",
    urgency: "done",
    status: "submitted",
    points: 60,
    image: stomachImg,
    dueAt: "2026-05-20T23:59:00",
  },
  {
    id: "asg-6",
    category: "Cardiology",
    categoryTone: "green",
    title: "Heart Sounds Workshop",
    description: "Identify murmurs, timing, and radiation from bedside auscultation recordings.",
    dueLabel: "May 30, 11:59 PM",
    relativeLabel: "8 days left",
    urgency: "later",
    status: "not-started",
    points: 35,
    image: heartImg,
    dueAt: "2026-05-30T23:59:00",
  },
  {
    id: "asg-7",
    category: "Neurology",
    categoryTone: "purple",
    title: "Stroke Localization Cases",
    description: "Localize the stroke using motor, sensory, and cranial nerve findings.",
    dueLabel: "May 18, 11:59 PM",
    relativeLabel: "Graded",
    urgency: "done",
    status: "graded",
    points: 80,
    image: brainImg,
    dueAt: "2026-05-18T23:59:00",
  },
  {
    id: "asg-8",
    category: "Pulmonology",
    categoryTone: "blue",
    title: "ABG Interpretation Set",
    description: "Practice acid-base disorders and compensation using arterial blood gas values.",
    dueLabel: "May 25, 11:59 PM",
    relativeLabel: "3 days left",
    urgency: "soon",
    status: "in-progress",
    points: 45,
    progress: 45,
    image: lungsImg,
    dueAt: "2026-05-25T23:59:00",
  },
  {
    id: "asg-9",
    category: "Orthopedics",
    categoryTone: "orange",
    title: "Joint Exam Checklist",
    description: "Complete a structured exam sequence for knee, shoulder, and hip presentations.",
    dueLabel: "May 21, 11:59 PM",
    relativeLabel: "Submitted",
    urgency: "done",
    status: "submitted",
    points: 30,
    image: boneImg,
    dueAt: "2026-05-21T23:59:00",
  },
  {
    id: "asg-10",
    category: "Gastroenterology",
    categoryTone: "rose",
    title: "Liver Function Labs",
    description: "Differentiate hepatocellular vs cholestatic patterns and list next investigations.",
    dueLabel: "May 16, 11:59 PM",
    relativeLabel: "Graded",
    urgency: "done",
    status: "graded",
    points: 55,
    image: stomachImg,
    dueAt: "2026-05-16T23:59:00",
  },
  {
    id: "asg-11",
    category: "Cardiology",
    categoryTone: "teal",
    title: "Arrhythmia Drill",
    description: "Recognize common arrhythmias and outline the immediate treatment algorithm.",
    dueLabel: "May 19, 11:59 PM",
    relativeLabel: "Submitted",
    urgency: "done",
    status: "submitted",
    points: 70,
    image: heartImg,
    dueAt: "2026-05-19T23:59:00",
  },
  {
    id: "asg-12",
    category: "Neurology",
    categoryTone: "purple",
    title: "Seizure First-Aid Protocol",
    description: "Document acute seizure care, red flags, and when to escalate to emergency treatment.",
    dueLabel: "May 23, 5:00 PM",
    relativeLabel: "1 day left",
    urgency: "soon",
    status: "in-progress",
    points: 40,
    progress: 20,
    image: brainImg,
    dueAt: "2026-05-23T17:00:00",
  },
];

export const ASSIGNMENT_DEADLINES: AssignmentDeadline[] = [
  {
    id: "dl-1",
    title: "Cranial Nerve Mapping Lab",
    dueLabel: "May 22, 11:59 PM",
    relativeLabel: "Today",
    urgency: "today",
    image: brainImg,
  },
  {
    id: "dl-2",
    title: "ECG Interpretation Case Study",
    dueLabel: "May 24, 11:59 PM",
    relativeLabel: "2d left",
    urgency: "soon",
    image: heartImg,
  },
  {
    id: "dl-3",
    title: "Fracture Classification Quiz",
    dueLabel: "May 26, 11:59 PM",
    relativeLabel: "4d left",
    urgency: "soon",
    image: boneImg,
  },
  {
    id: "dl-4",
    title: "Respiratory Case Review",
    dueLabel: "May 28, 11:59 PM",
    relativeLabel: "6d left",
    urgency: "later",
    image: lungsImg,
  },
];

export const ASSIGNMENT_FEEDBACK: AssignmentFeedback[] = [
  {
    id: "fb-1",
    title: "Cardiology Quiz",
    comment: "Excellent analysis of ST elevation and clear clinical reasoning.",
    score: "92/100",
    timeAgo: "2 days ago",
  },
  {
    id: "fb-2",
    title: "Neuro Case Write-up",
    comment: "Strong localization. Add one more supporting pathway next time.",
    score: "88/100",
    timeAgo: "5 days ago",
  },
];

export const ASSIGNMENT_DETAILS: Record<string, AssignmentDetailItem> = {
  "upper-limb-clinical-case-review": {
    id: "upper-limb-clinical-case-review",
    category: "Anatomy",
    categoryTone: "green",
    title: "Upper Limb Clinical Case Review",
    courseName: "Human Anatomy I",
    courseSlug: "human-anatomy-i",
    moduleName: "Module 2: Upper Limb",
    instructor: "Dr. Ahmed Hassan",
    description: "Analyze a complex upper limb injury, identify anatomical structures involved, and construct a clinical management proposal.",
    dueLabel: "Aug 29, 11:59 PM",
    dueFullDate: "Aug 29, 2026 at 11:59 PM",
    relativeLabel: "Due soon",
    urgency: "soon",
    status: "not-started",
    points: 100,
    estimatedTime: "4-6 hours",
    attemptsUsed: 1,
    attemptsAllowed: 2,
    submissionType: "File upload",
    acceptedFormats: ["PDF", "DOCX", "PPTX"],
    maxFileSizeMb: 20,
    image: boneImg,
    dueAt: "2026-08-29T23:59:00",
    brief: {
      description: "In this case-based assignment, you will analyze the clinical presentation of a patient with an upper limb injury and apply your knowledge of anatomy to identify the structures involved, explain functional outcomes, and propose appropriate clinical considerations.",
      instructions: [
        "Review the provided case scenario and imaging.",
        "Identify and label key anatomical structures.",
        "Answer the clinical reasoning questions.",
        "Discuss potential complications and management approaches.",
        "Cite your references in APA format."
      ]
    },
    whatToSubmit: {
      requirements: [
        "Completed case analysis (DOCX or PDF)",
        "Annotated diagrams or labeled images",
        "Answers to all questions",
        "References list (APA format)"
      ],
      tip: "Use the provided templates to ensure your submission meets all requirements."
    },
    resources: [
      {
        id: "res-1",
        name: "Upper Limb Case Scenario.pdf",
        fileType: "pdf",
        size: "1.2 MB"
      },
      {
        id: "res-2",
        name: "Upper Limb Anatomy Guide.pptx",
        fileType: "pptx",
        size: "5.8 MB"
      },
      {
        id: "res-3",
        name: "Case Analysis Template.docx",
        fileType: "docx",
        size: "62 KB"
      },
      {
        id: "res-4",
        name: "Grading Rubric.pdf",
        fileType: "pdf",
        size: "214 KB"
      }
    ],
    rubric: {
      items: [
        { criterion: "Anatomical identification", points: 30 },
        { criterion: "Clinical reasoning", points: 25 },
        { criterion: "Application & analysis", points: 25 },
        { criterion: "References & presentation", points: 20 }
      ],
      totalPoints: 100
    },
    timeline: {
      assignedDate: "Aug 22, 2026 \u2022 10:00 AM",
      dueDate: "Aug 29, 2026 \u2022 11:59 PM",
      gradesReleasedDate: "Sep 2, 2026 \u2022 By 5:00 PM"
    }
  },
  "asg-1": {
    id: "asg-1",
    category: "Cardiology",
    categoryTone: "green",
    title: "ECG Interpretation Case Study",
    courseName: "Clinical Cardiology",
    courseSlug: "clinical-cardiology",
    moduleName: "Module 1: ECG Diagnostics",
    instructor: "Dr. Sarah Jenkins",
    description: "Analyze a 12-lead ECG and identify the rhythm, intervals, and likely diagnosis.",
    dueLabel: "May 24, 11:59 PM",
    dueFullDate: "May 24, 2026 at 11:59 PM",
    relativeLabel: "2 days left",
    urgency: "soon",
    status: "in-progress",
    points: 75,
    progress: 60,
    estimatedTime: "3-4 hours",
    attemptsUsed: 1,
    attemptsAllowed: 3,
    submissionType: "File upload",
    acceptedFormats: ["PDF", "DOCX"],
    maxFileSizeMb: 20,
    image: heartImg,
    dueAt: "2026-05-24T23:59:00",
    brief: {
      description: "Analyze the 12-lead ECG traces provided in the case packet. Identify the rate, axis, PR interval, QRS duration, ST-T segment abnormalities, and correlate with the patient presentation.",
      instructions: [
        "Calculate the heart rate and electrical axis.",
        "Evaluate standard intervals (PR, QRS, QTc).",
        "State the primary electrophysiological diagnosis.",
        "List immediate pharmaceutical or interventional next steps."
      ]
    },
    whatToSubmit: {
      requirements: [
        "Structured ECG report (PDF or DOCX)",
        "Annotated lead diagrams with measurement callouts",
        "Differential diagnosis summary"
      ],
      tip: "Double check your QTc calculation with Bazett's formula."
    },
    resources: [
      { id: "res-101", name: "12_Lead_ECG_Case_Trace.pdf", fileType: "pdf", size: "2.4 MB" },
      { id: "res-102", name: "ECG_Interpretation_Guide.pdf", fileType: "pdf", size: "1.1 MB" }
    ],
    rubric: {
      items: [
        { criterion: "Interval measurements", points: 25 },
        { criterion: "Rhythm identification", points: 25 },
        { criterion: "Clinical management plan", points: 25 }
      ],
      totalPoints: 75
    },
    timeline: {
      assignedDate: "May 17, 2026 \u2022 09:00 AM",
      dueDate: "May 24, 2026 \u2022 11:59 PM",
      gradesReleasedDate: "May 27, 2026 \u2022 By 5:00 PM"
    }
  }
};
