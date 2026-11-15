import type { StudentLessonItem } from "./studentCoursesApi";

/** Select only media returned within this authorized lesson. */
export function selectLessonMedia(lesson: StudentLessonItem, requestedAssetId: string | null): { assetId: string; mediaType: "pdf" | "video" } | null {
  if (!lesson.playbackAvailable || !lesson.resourceId || !lesson.resourceType) return null;
  if (!requestedAssetId || requestedAssetId === lesson.resourceId) return { assetId: lesson.resourceId, mediaType: lesson.resourceType };
  const item = lesson.learningItems?.find(entry => entry.available && entry.assetId === requestedAssetId && (entry.kind === "pdf" || entry.kind === "video"));
  return item && item.assetId && (item.kind === "pdf" || item.kind === "video") ? { assetId: item.assetId, mediaType: item.kind } : null;
}
