import { useEffect, useRef, useState } from "react";
import {
  adminDeliveryRequest,
  type DeliveryCourse,
} from "../api/adminDelivery.http";

interface Instructor {
  readonly id: string;
  readonly code: string;
  readonly instructorCode: string;
  readonly displayName: string;
  readonly status: "active" | "inactive" | "archived";
}

interface BrandAssignment {
  readonly id: string;
  readonly brandId: string;
  readonly instructorId: string;
  readonly status: "active" | "inactive";
}

interface CourseAssignment {
  readonly id: string;
  readonly brandId: string;
  readonly courseId: string;
  readonly instructorId: string;
  readonly status: "active" | "inactive";
  readonly version: number;
}

function createRequestKey(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `course-instructor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdminCourseInstructorAssignments({
  course,
  onChanged,
}: Readonly<{
  course: DeliveryCourse;
  onChanged: () => void;
}>) {
  const [instructors, setInstructors] = useState<readonly Instructor[]>([]);
  const [brandAssignments, setBrandAssignments] = useState<
    readonly BrandAssignment[]
  >([]);
  const [courseAssignments, setCourseAssignments] = useState<
    readonly CourseAssignment[]
  >([]);
  const [instructorId, setInstructorId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  const pendingMutation = useRef<
    { signature: string; key: string } | undefined
  >(undefined);

  const basePath = `/v1/admin/brands/${encodeURIComponent(course.brandId)}`;
  const assignmentsPath = `${basePath}/courses/${encodeURIComponent(course.id)}/instructors`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    void Promise.all([
      adminDeliveryRequest<Instructor[]>("/v1/admin/instructors", {
        signal: controller.signal,
      }),
      adminDeliveryRequest<BrandAssignment[]>(`${basePath}/instructors`, {
        signal: controller.signal,
      }),
      adminDeliveryRequest<CourseAssignment[]>(assignmentsPath, {
        signal: controller.signal,
      }),
    ])
      .then(([instructorRows, brandRows, courseRows]) => {
        if (controller.signal.aborted) return;
        if (![instructorRows, brandRows, courseRows].every(Array.isArray)) {
          throw new Error("Instructor assignment data is invalid.");
        }
        setInstructors(instructorRows);
        setBrandAssignments(brandRows);
        setCourseAssignments(courseRows);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Course instructors could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [assignmentsPath, basePath, revision]);

  const activeBrandInstructorIds = new Set(
    brandAssignments
      .filter((item) => item.status === "active")
      .map((item) => item.instructorId),
  );
  const availableInstructors = instructors.filter(
    (instructor) =>
      instructor.status === "active" &&
      activeBrandInstructorIds.has(instructor.id) &&
      !courseAssignments.some(
        (assignment) => assignment.instructorId === instructor.id,
      ),
  );

  async function saveAssignment(
    path: string,
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
  ): Promise<boolean> {
    if (busy.current) return false;
    const signature = JSON.stringify({ path, method, body });
    if (pendingMutation.current?.signature !== signature) {
      pendingMutation.current = { signature, key: createRequestKey() };
    }
    busy.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await adminDeliveryRequest(path, {
        method,
        key: pendingMutation.current.key,
        body,
      });
      pendingMutation.current = undefined;
      setReason("");
      setNotice("Course instructor assignments were updated by the backend.");
      setRevision((value) => value + 1);
      onChanged();
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The instructor assignment could not be saved.",
      );
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function assignInstructor(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!instructorId || !reason.trim()) return;
    const saved = await saveAssignment(assignmentsPath, "POST", {
      instructorId,
      reason: reason.trim(),
    });
    if (saved) setInstructorId("");
  }

  async function setAssignmentStatus(
    assignment: CourseAssignment,
    status: "active" | "inactive",
  ): Promise<void> {
    const path = `${assignmentsPath}/${encodeURIComponent(assignment.instructorId)}/status`;
    if (
      status === "active" &&
      !activeBrandInstructorIds.has(assignment.instructorId)
    ) {
      setError(
        "Restore the instructor’s active brand assignment before restoring this course assignment.",
      );
      return;
    }
    await saveAssignment(path, "PATCH", {
      status,
      expectedVersion: assignment.version,
      reason: reason.trim(),
    });
  }

  return (
    <section
      className="admin-course-assignments-live"
      aria-label="Course instructor assignments"
    >
      <header>
        <div>
          <h3>Course instructor assignments</h3>
          <p>
            Only instructors with an active assignment to this brand can be
            selected.
          </p>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">Loading instructors…</p>
      ) : courseAssignments.length === 0 ? (
        <p>No instructors assigned yet.</p>
      ) : (
        <ul>
          {courseAssignments.map((assignment) => {
            const instructor = instructors.find(
              (item) => item.id === assignment.instructorId,
            );
            return (
              <li key={assignment.id}>
                <span>
                  <strong>{instructor?.displayName ?? "Instructor"}</strong>
                  <small>{assignment.status}</small>
                </span>
                <button
                  type="button"
                  disabled={saving || !reason.trim()}
                  onClick={() =>
                    void setAssignmentStatus(
                      assignment,
                      assignment.status === "active" ? "inactive" : "active",
                    )
                  }
                >
                  {assignment.status === "active" ? "Deactivate" : "Reactivate"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <form
        className="admin-course-assignments-live__form"
        onSubmit={(event) => void assignInstructor(event)}
      >
        <label>
          Brand-approved instructor
          <select
            required
            value={instructorId}
            disabled={loading || !availableInstructors.length}
            onChange={(event) => setInstructorId(event.target.value)}
          >
            <option value="">
              {availableInstructors.length
                ? "Select instructor"
                : "No available instructors"}
            </option>
            {availableInstructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.displayName} ·{" "}
                {instructor.instructorCode || instructor.code}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reason for change
          <input
            required
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={loading || saving || !instructorId || !reason.trim()}
        >
          {saving ? "Saving…" : "Assign instructor"}
        </button>
      </form>
    </section>
  );
}
