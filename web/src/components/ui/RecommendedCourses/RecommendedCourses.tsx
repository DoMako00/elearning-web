import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import anatomyImage from "../../../Assets/dashboard/human-anatomy.webp";
import histologyImage from "../../../Assets/dashboard/histology-basics.webp";
import physiologyImage from "../../../Assets/dashboard/medical-physiology.webp";
import biochemistryImage from "../../../Assets/dashboard/biochemistry-essentials.webp";
import embryologyImage from "../../../Assets/dashboard/embryology-foundations.webp";
import "./RecommendedCourses.css";

const courses = [
  {
    title: "Human Anatomy I",
    subtitle: "Structure & Organization",
    level: "Intermediate",
    lessons: 8,
    rating: "4.8",
    image: anatomyImage,
    imagePosition: "50% 28%",
  },
  {
    title: "Histology Basics",
    subtitle: "Tissues of the Human Body",
    level: "Beginner",
    lessons: 6,
    rating: "4.7",
    image: histologyImage,
    imagePosition: "center",
  },
  {
    title: "Medical Physiology",
    subtitle: "Body Functions & Regulation",
    level: "Intermediate",
    lessons: 10,
    rating: "4.8",
    image: physiologyImage,
    imagePosition: "center",
  },
  {
    title: "Biochemistry Essentials",
    subtitle: "Molecules of Life",
    level: "Intermediate",
    lessons: 7,
    rating: "4.6",
    image: biochemistryImage,
    imagePosition: "center",
  },
  {
    title: "Embryology Foundations",
    subtitle: "Development of Human Life",
    level: "Beginner",
    lessons: 5,
    rating: "4.8",
    image: embryologyImage,
    imagePosition: "center",
  },
] as const;

export function RecommendedCourses() {
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Record<string, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const toggleBookmark = (title: string) => {
    setBookmarkedCourses((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleScrollPrev = () => {
    if (rowRef.current) {
      const container = rowRef.current;
      const courseCard = container.querySelector<HTMLElement>(".recommended-course");
      const scrollAmount = courseCard ? (courseCard.offsetWidth + 14) * 2 : container.clientWidth * 0.75;
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const handleScrollNext = () => {
    if (rowRef.current) {
      const container = rowRef.current;
      const courseCard = container.querySelector<HTMLElement>(".recommended-course");
      const scrollAmount = courseCard ? (courseCard.offsetWidth + 14) * 2 : container.clientWidth * 0.75;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="recommended-card" aria-labelledby="recommended-title">
      <header className="recommended-header">
        <h2 id="recommended-title">Recommended Medical Modules For You</h2>
        <button type="button" className="recommended-view-all">
          <span>View all</span>
          <ArrowRight aria-hidden="true" />
        </button>
      </header>

      <div className="recommended-carousel-wrap">
        {canScrollLeft && (
          <button
            type="button"
            onClick={handleScrollPrev}
            className="recommended-prev"
            aria-label="Show previous recommended courses"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
        )}

        <div className="recommended-row" ref={rowRef} onScroll={checkScroll}>
          {courses.map((course) => {
            const isBookmarked = !!bookmarkedCourses[course.title];
            return (
              <article className="recommended-course" key={course.title}>
                <div className="recommended-course-media">
                  <img
                    src={course.image}
                    alt={`${course.title} medical illustration`}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: course.imagePosition }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleBookmark(course.title)}
                    className={`recommended-bookmark ${isBookmarked ? "recommended-bookmark--active" : ""}`}
                    aria-label={isBookmarked ? `Remove bookmark for ${course.title}` : `Bookmark ${course.title}`}
                    aria-pressed={isBookmarked}
                    data-bookmarked={isBookmarked}
                  >
                    <Bookmark className={isBookmarked ? "fill-current" : ""} aria-hidden="true" />
                  </button>
                </div>
                <div className="recommended-course-copy">
                  <div className="recommended-title-wrap">
                    <h3 title={course.title}>{course.title}</h3>
                  </div>
                  <p className="recommended-course-subtitle" title={course.subtitle}>{course.subtitle}</p>
                  <div className="recommended-course-footer">
                    <span className="recommended-course-level" title={course.level}>
                      {course.level}
                    </span>
                    <span className="recommended-course-separator" aria-hidden="true">•</span>
                    <span className="recommended-course-lessons">{course.lessons} Lessons</span>
                    <span className="recommended-rating">
                      <Star aria-hidden="true" /> {course.rating}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={handleScrollNext}
            className="recommended-next"
            aria-label="Show more recommended courses"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

