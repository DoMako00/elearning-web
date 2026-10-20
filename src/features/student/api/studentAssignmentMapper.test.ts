import { describe, expect, it } from "vitest";
import { isAssignmentSubmissionWindowOpen, mapStudentAssignment } from "./studentAssignmentMapper";
import type { StudentAssignmentDto } from "./studentAssignmentsApi";

const NOW = Date.parse("2026-10-20T10:00:00Z");
const base: StudentAssignmentDto = {
  id: "a1",
  title: "Case study",
  instructions: "",
  courseId: null,
  courseTitle: null,
  maxScore: 10,
  availableFrom: null,
  dueAt: "2026-10-22T10:00:00Z",
  status: "open",
  submission: null,
} as unknown as StudentAssignmentDto;

describe("mapStudentAssignment", () => {
  it("labels open work by real remaining time", () => {
    const item = mapStudentAssignment(base, { now: NOW });
    expect(item.relativeLabel).toBe("2 days left");
    expect(item.actionable).toBe(true);
    expect(item.urgency).toBe("soon");
  });

  it("does not use the array index as the reference time when passed to Array.map", () => {
    // TypeScript now rejects `.map(mapStudentAssignment)`; this also guards
    // untyped callers at runtime against the old index-as-timestamp bug.
    const dueSoon = { ...base, dueAt: new Date(Date.now() + 2 * 86_400_000 + 60_000).toISOString() };
    const untypedMapper = mapStudentAssignment as unknown as (item: StudentAssignmentDto, index: number) => ReturnType<typeof mapStudentAssignment>;
    const [viaMap] = [dueSoon].map(untypedMapper);
    expect(viaMap!.relativeLabel).toBe("3 days left");
  });

  it("never presents closed work as actionable", () => {
    const item = mapStudentAssignment({ ...base, status: "closed" }, { now: NOW });
    expect(item.relativeLabel).toBe("Closed");
    expect(item.actionable).toBe(false);
    expect(item.urgency).toBe("done");
  });

  it("treats past-due unsubmitted work as not actionable (the server rejects it)", () => {
    const item = mapStudentAssignment({ ...base, dueAt: "2026-10-19T10:00:00Z" }, { now: NOW });
    expect(item.relativeLabel).toBe("Past due");
    expect(item.isOverdue).toBe(true);
    expect(item.actionable).toBe(false);
  });

  it("treats not-yet-available work as not actionable", () => {
    const item = mapStudentAssignment({ ...base, availableFrom: "2026-11-01T00:00:00Z" }, { now: NOW });
    expect(item.actionable).toBe(false);
    expect(item.relativeLabel).toMatch(/^Opens /);
  });

  it("does not flag a submitted assignment as overdue", () => {
    const item = mapStudentAssignment({ ...base, dueAt: "2026-10-19T10:00:00Z", submission: { status: "submitted" } } as unknown as StudentAssignmentDto, { now: NOW });
    expect(item.relativeLabel).toBe("Submitted");
    expect(item.isOverdue).toBe(false);
  });
});

describe("isAssignmentSubmissionWindowOpen (mirrors the backend submit rule)", () => {
  it("requires open status, availability started and due time not passed", () => {
    expect(isAssignmentSubmissionWindowOpen(base, NOW)).toBe(true);
    expect(isAssignmentSubmissionWindowOpen({ ...base, status: "closed" }, NOW)).toBe(false);
    expect(isAssignmentSubmissionWindowOpen({ ...base, availableFrom: "2026-10-21T00:00:00Z" }, NOW)).toBe(false);
    expect(isAssignmentSubmissionWindowOpen({ ...base, dueAt: "2026-10-20T10:00:00Z" }, NOW)).toBe(false);
    expect(isAssignmentSubmissionWindowOpen({ ...base, dueAt: null }, NOW)).toBe(true);
  });
});
