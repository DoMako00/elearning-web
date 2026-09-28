export type AssignmentStatus = "in-progress" | "submitted" | "graded" | "not-started";
export type AssignmentFilter = "all" | "in-progress" | "submitted" | "graded";
export type AssignmentSort = "due" | "title" | "points";
export type AssignmentUrgency = "today" | "soon" | "later" | "done";

export interface AssignmentItem {
  id: string;
  category: string;
  categoryTone: "green" | "purple" | "blue" | "orange" | "rose" | "teal";
  title: string;
  description: string;
  dueLabel: string;
  relativeLabel: string;
  urgency: AssignmentUrgency;
  status: AssignmentStatus;
  points: number;
  progress?: number;
  image: string;
  dueAt: string;
}

export interface AssignmentDeadline {
  id: string;
  title: string;
  dueLabel: string;
  relativeLabel: string;
  urgency: AssignmentUrgency;
  image: string;
}

export interface AssignmentFeedback {
  id: string;
  title: string;
  comment: string;
  score: string;
  timeAgo: string;
}

export interface AssignmentRubricItem {
  criterion: string;
  points: number;
}

export interface AssignmentResource {
  id: string;
  name: string;
  fileType: "pdf" | "pptx" | "docx";
  size: string;
  downloadUrl?: string;
}

export interface AssignmentDetailItem extends AssignmentItem {
  courseName: string;
  courseSlug: string;
  moduleName: string;
  instructor: string;
  dueFullDate: string;
  estimatedTime: string;
  attemptsUsed: number;
  attemptsAllowed: number;
  submissionType: string;
  acceptedFormats: string[];
  maxFileSizeMb: number;
  brief: {
    description: string;
    instructions: string[];
  };
  whatToSubmit: {
    requirements: string[];
    tip: string;
  };
  resources: AssignmentResource[];
  rubric: {
    items: AssignmentRubricItem[];
    totalPoints: number;
  };
  timeline: {
    assignedDate: string;
    dueDate: string;
    gradesReleasedDate: string;
  };
  submission?: {
    status: "not-submitted" | "draft" | "submitted" | "graded";
    submittedAt?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
    note?: string;
    score?: number;
  };
}
