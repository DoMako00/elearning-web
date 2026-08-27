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
