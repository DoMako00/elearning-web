import { describe, expect, it } from "vitest";
import type { StudentCourseDetail } from "../api/studentCoursesApi";
import { courseBreadcrumb } from "./courseBreadcrumb";

describe("course breadcrumb", () => {
  it("uses the actual unit label and the selected lesson's subject", () => {
    const course = { unitLabel: "Module", title: "Basics 1", chapters: [
      { title: "Anatomy — Theory", lessons: [{ lessonId: "anatomy" }] },
      { title: "Histology — Theory", lessons: [{ lessonId: "histology" }] },
    ] } as unknown as StudentCourseDetail;
    expect(courseBreadcrumb(course)).toEqual({ courseTitle: "Module Basics 1", selectionTitle: "Lesson" });
    expect(courseBreadcrumb(course, "histology")).toEqual({ courseTitle: "Module Basics 1", selectionTitle: "Histology — Theory" });
    expect(courseBreadcrumb({ ...course, unitLabel: "Subject", title: "Anatomy" }).courseTitle).toBe("Subject Anatomy");
    expect(courseBreadcrumb(undefined).courseTitle).toBe("Course");
  });
});
