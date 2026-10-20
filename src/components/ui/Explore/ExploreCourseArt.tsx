import { COURSE_VISUAL_PRESETS, type CourseArtworkKey } from "../CourseLibrary/courses.data";

interface CourseArtProps {
  artType: CourseArtworkKey;
}

export function ExploreCourseArt({ artType }: CourseArtProps) {
  const config = COURSE_VISUAL_PRESETS.find((preset) => preset.key === artType)
    ?? COURSE_VISUAL_PRESETS.find((preset) => preset.key === "general")!;

  return (
    <div
      className={`explore-card-art explore-card-art--medical explore-card-art--${artType}`}
      aria-hidden="true"
    >
      <img
        src={config.image}
        alt=""
        className="explore-card-art__img"
        style={{ objectPosition: config.imagePosition }}
        loading="lazy"
        decoding="async"
      />
      <div
        className="explore-card-art__overlay"
        style={{ "--art-accent": config.accentColor } as React.CSSProperties}
      />
    </div>
  );
}
