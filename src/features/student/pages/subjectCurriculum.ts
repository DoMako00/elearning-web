import type { StudentChapterItem } from "../api/studentCoursesApi";

export function subjectCurriculum(subject: { id: string; title: string; outline?: readonly { id: string; title: string; sortOrder: number }[] }, chapter: StudentChapterItem | undefined, canOpen: boolean) {
  const released = new Map((chapter?.lessons ?? []).map(lesson => [lesson.lessonId, lesson]));
  return (subject.outline ?? []).map((entry, index) => {
    const lesson = released.get(entry.id);
    const mediaStatus = !lesson ? "Not released" : lesson.progressStatus === "completed" ? "Completed" : lesson.progressStatus === "in_progress" ? "In progress" : lesson.playbackAvailable ? lesson.resourceType === "pdf" ? "Reading" : "Ready" : lesson.mediaStatus === "pending_media" ? "Pending media" : "No media";
    return { id: entry.id, number: index + 1, title: entry.title, ready: Boolean(canOpen && lesson?.playbackAvailable), mediaStatus };
  });
}
