import { describe, expect, it } from "vitest";
import type { StudentCourseDetail, StudentLessonItem } from "../../features/student/api/studentCoursesApi";
import { selectLessonMedia } from "../../features/student/api/selectLessonMedia";
import { mapCourseResources } from "./learningSpaceMappers";

const lesson = { lessonId: "lesson", chapterId: "chapter", title: "Lesson", playbackAvailable: true, resourceId: "pdf", resourceType: "pdf", resourceTitle: "Slides", mediaStatus: "ready", learningItems: [
  { id: "pdf", assetId: "pdf", title: "Slides", kind: "pdf", available: true, state: "published" },
  { id: "video", assetId: "video", title: "Lecture", kind: "video", available: true, state: "published" },
  { id: "hidden", assetId: "hidden", title: "Unavailable", kind: "pdf", available: false, state: "pending" },
] } as unknown as StudentLessonItem;
const course = { chapters: [{ chapterId: "chapter", title: "Anatomy", lessons: [lesson] }] } as unknown as StudentCourseDetail;

describe("lesson media", () => {
  it("lists both published PDF and video for the same lesson", () => {
    expect(mapCourseResources(course).map(item => [item.id, item.extension])).toEqual([["pdf", "pdf"], ["video", "video"]]);
  });
  it("selects the requested published file and rejects unavailable or unrelated assets", () => {
    expect(selectLessonMedia(lesson, "video")).toEqual({ assetId: "video", mediaType: "video" });
    expect(selectLessonMedia(lesson, "pdf")).toEqual({ assetId: "pdf", mediaType: "pdf" });
    expect(selectLessonMedia(lesson, "hidden")).toBeNull();
    expect(selectLessonMedia(lesson, "other")).toBeNull();
  });
  it("supports the older single-media response", () => {
    const legacy = { ...lesson, learningItems: undefined };
    expect(mapCourseResources({ ...course, chapters: [{ ...course.chapters[0], lessons: [legacy] }] }).map(item => item.id)).toEqual(["pdf"]);
    expect(selectLessonMedia(legacy, null)).toEqual({ assetId: "pdf", mediaType: "pdf" });
  });
});
