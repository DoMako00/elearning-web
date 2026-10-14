import type { AssignmentItem, AssignmentStatus, AssignmentUrgency } from "../../../components/ui/Assignments/assignments.types";
import type { StudentAssignmentDto } from "./studentAssignmentsApi";

export function studentAssignmentStatus(item: StudentAssignmentDto): AssignmentStatus {
  if (item.submission?.status === "reviewed") return "graded";
  if (item.submission?.status === "submitted") return "submitted";
  if (item.submission?.status === "returned") return "in-progress";
  return "not-started";
}

export function mapStudentAssignment(item: StudentAssignmentDto, now = Date.now()): AssignmentItem {
  const due = item.dueAt ? new Date(item.dueAt) : null;
  const remaining = due ? due.getTime() - now : null;
  const status = studentAssignmentStatus(item);
  const relativeLabel = status === "graded" ? "Reviewed"
    : status === "submitted" ? "Submitted"
      : due === null ? "No due date"
        : remaining! < 0 ? "Past due"
          : remaining! < 86_400_000 ? "Due today"
            : `${Math.ceil(remaining! / 86_400_000)} days left`;
  const urgency: AssignmentUrgency = status === "graded" || status === "submitted" ? "done"
    : due === null ? "later"
      : remaining! < 86_400_000 ? "today"
        : remaining! < 7 * 86_400_000 ? "soon" : "later";

  return {
    id: item.id,
    category: item.courseTitle ?? "Assignment",
    categoryTone: "teal",
    title: item.title,
    description: item.instructions,
    dueLabel: due ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(due) : "No due date",
    relativeLabel,
    urgency,
    status,
    points: item.submission?.score ?? item.maxScore,
    image: "",
    dueAt: item.dueAt ?? "9999-12-31T23:59:59.999Z",
  };
}
