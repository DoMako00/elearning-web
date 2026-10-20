import type { AssignmentItem, AssignmentStatus, AssignmentUrgency } from "../../../components/ui/Assignments/assignments.types";
import type { StudentAssignmentDto } from "./studentAssignmentsApi";

export function studentAssignmentStatus(item: StudentAssignmentDto): AssignmentStatus {
  if (item.submission?.status === "reviewed") return "graded";
  if (item.submission?.status === "submitted") return "submitted";
  if (item.submission?.status === "returned") return "in-progress";
  return "not-started";
}

const DAY_MS = 86_400_000;

/**
 * Mirrors the backend submission rule (student-learning-store submitAssignment):
 * the assignment must be published/open, already available, and not past its
 * due time. Anything else is rejected by the server, so it is not actionable.
 */
export function isAssignmentSubmissionWindowOpen(item: Pick<StudentAssignmentDto, "status" | "availableFrom" | "dueAt">, now = Date.now()): boolean {
  if (item.status !== "open") return false;
  if (item.availableFrom && Date.parse(item.availableFrom) > now) return false;
  if (item.dueAt && Date.parse(item.dueAt) <= now) return false;
  return true;
}

/**
 * Maps a backend assignment to the card view model.
 *
 * `options.now` is an object property on purpose: passing this function
 * straight to `Array.prototype.map` must not turn the array index into the
 * reference time (which previously made every due date look years away).
 */
export function mapStudentAssignment(item: StudentAssignmentDto, options: { now?: number } = {}): AssignmentItem {
  const now = typeof options === "object" && options !== null && typeof options.now === "number" ? options.now : Date.now();
  const due = item.dueAt ? new Date(item.dueAt) : null;
  const remaining = due ? due.getTime() - now : null;
  const opensAt = item.availableFrom ? new Date(item.availableFrom) : null;
  const status = studentAssignmentStatus(item);
  const isFinished = status === "graded" || status === "submitted";
  const isClosed = item.status === "closed";
  const notYetOpen = opensAt !== null && opensAt.getTime() > now;
  const isOverdue = !isFinished && remaining !== null && remaining <= 0;
  // Only work the server will still accept counts as actionable (a returned
  // submission is resubmittable inside the same window).
  const actionable = !isFinished && isAssignmentSubmissionWindowOpen(item, now);

  const relativeLabel = status === "graded" ? "Reviewed"
    : status === "submitted" ? "Submitted"
      : isClosed ? "Closed"
        : notYetOpen ? `Opens ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(opensAt!)}`
          : due === null ? "No due date"
            : isOverdue ? "Past due"
              : remaining! < DAY_MS ? "Due within 24 hours"
                : `${Math.ceil(remaining! / DAY_MS)} days left`;
  const urgency: AssignmentUrgency = !actionable ? "done"
    : due === null ? "later"
      : remaining! < DAY_MS ? "today"
        : remaining! < 7 * DAY_MS ? "soon" : "later";

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
    actionable,
    isOverdue,
  };
}
