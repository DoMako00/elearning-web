const COURSE_ART = {
  health: "/assets/instructor/course-health.png",
  communication: "/assets/instructor/course-communication.png",
  ethics: "/assets/instructor/course-ethics.png",
  general: "/assets/instructor/course-book-leaves.png",
} as const;

export function instructorCourseArtwork(title: string, index = 0) {
  const normalized = title.toLowerCase();
  if (/ethic|law|professionalism/.test(normalized)) return COURSE_ART.ethics;
  if (/communication|interpersonal/.test(normalized)) return COURSE_ART.communication;
  if (/health|life|anatomy|medicine/.test(normalized)) return COURSE_ART.health;
  return index % 3 === 1 ? COURSE_ART.communication : index % 3 === 2 ? COURSE_ART.ethics : COURSE_ART.general;
}

export const instructorHeroArtwork = "/assets/instructor/hero-book-leaves.png";
