import { describe, expect, it } from "vitest";
import { toReferenceCourse } from "./referenceCourseMapper";
import type { StudentCourseItem } from "../api/studentCoursesApi";
import type { StudentProgressSnapshotDto } from "../api/studentLearningApi";

const course: StudentCourseItem = {
  courseId: "course-id", code: "ENG1", title: "English 1",
  brand: { code: "nexus", name: "Nexus" },
  academicInstitution: { code: "delta", name: "Delta University" },
  academicLevel: { levelNumber: 1, title: "Level 1" },
  academicSemester: { semesterNumber: 1, title: "Semester 1" },
  cataloguePresentation: "module_based", unitLabel: "Module", status: "published",
  chapterCount: 0, lessonCount: 0,
  mediaSummary: { totalLessons: 0, lessonsWithMedia: 0, pendingMediaLessons: 0 },
  access: { isEnrolled: true, canOpen: false, enrollmentStatus: "active" },
  updatedAt: "2026-10-20T00:00:00Z",
};
const progress = {
  courses: [{ courseId: course.courseId, title: course.title, completedLessons: 2, totalLessons: 8, completionPercent: 25, lastActivityAt: "2026-10-19T12:00:00Z" }],
  recentActivity: [{ courseId: course.courseId, lessonId: "lesson-id", courseTitle: course.title, lessonTitle: "Recorded lesson", status: "in_progress", occurredAt: "2026-10-19T12:00:00Z" }],
} as StudentProgressSnapshotDto;

describe("reference UI course mapping", () => {
  it("keeps server IDs, membership and playback decisions intact", () => {
    const mapped = toReferenceCourse(course);
    expect(mapped.id).toBe(course.courseId);
    expect(mapped.slug).toBe(course.courseId);
    expect(mapped.access).toEqual(course.access);
  });
  it("uses English artwork without inventing progress or instructor data", () => {
    const mapped = toReferenceCourse(course);
    expect(mapped.progress).toBeNull();
    expect(mapped.instructor).toBeNull();
    expect(mapped.art).toBe("english");
    expect(mapped.image).toContain("english-language.jpg");
    expect(mapped.heroOverlay).toContain("english-language-cutout.png");
    expect(mapped.opened).toBe("No lesson activity yet");
  });
  it("uses the academic unit from the API even for a medical title", () => {
    const mapped = toReferenceCourse({ ...course, title: "Human Anatomy I" });
    expect(mapped.category).toBe("Module");
    expect(mapped.categoryId).toBe("module");
    expect(mapped.image).not.toBe("");
  });
  it("renders persisted progress and the recorded recent lesson", () => {
    const mapped = toReferenceCourse(course, progress);
    expect(mapped.progress).toBe(25);
    expect(mapped.completedLessons).toBe(2);
    expect(mapped.totalLessons).toBe(8);
    expect(mapped.lessonText).toBe("Recorded lesson");
  });
  it("uses zero only after a loaded snapshot confirms no course activity", () => {
    expect(toReferenceCourse(course, { ...progress, courses: [], recentActivity: [] }).progress).toBe(0);
    expect(toReferenceCourse({ ...course, access: { ...course.access, enrollmentStatus: "completed" } }).status).toBe("completed");
  });
  it("uses neutral artwork for unknown titles instead of assigning them to anatomy", () => {
    const mapped = toReferenceCourse({ ...course, title: "Student Success Skills", code: "SSS101" });
    expect(mapped.art).toBe("general");
    expect(mapped.image).toContain("general-course.jpg");
  });
  it("recognizes subject artwork from the course code as well as its title", () => {
    const mapped = toReferenceCourse({ ...course, title: "General Foundations", code: "NEX-Y1-DELTA-ANA1102" });
    expect(mapped.art).toBe("anatomy");
    expect(mapped.image).toContain("human-anatomy.webp");
  });
});
