import { describe, expect, it } from "vitest";
import type { StudentChapterItem } from "../api/studentCoursesApi";
import { subjectCurriculum } from "./subjectCurriculum";

describe("subject curriculum", () => {
  const subject = { id: "subject", title: "Histology", outline: [{ id: "draft", title: "Micro Techniques", sortOrder: 1 }, { id: "ready", title: "Cell", sortOrder: 2 }] };
  const chapter = { lessons: [{ lessonId: "ready", title: "Cell", playbackAvailable: true, resourceType: "video", progressStatus: "not_started" }] } as unknown as StudentChapterItem;
  it("shows unreleased lesson titles without enabling them", () => {
    const entries = subjectCurriculum(subject, chapter, true);
    expect(entries[0]).toMatchObject({ title: "Micro Techniques", ready: false, mediaStatus: "Not released" });
    expect(entries[1]).toMatchObject({ title: "Cell", ready: true });
  });
  it("never enables a file without the course access grant", () => {
    expect(subjectCurriculum(subject, chapter, false).every(entry => !entry.ready)).toBe(true);
  });
});
