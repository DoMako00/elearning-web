import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Atom,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Leaf,
  Star,
  Waves,
} from "lucide-react";
import "./RecommendedCourses.css";

const courses = [
  { title: "JavaScript Mastery", level: "Intermediate", rating: "4.8", icon: "js" },
  { title: "React Complete Guide", level: "Intermediate", rating: "4.7", icon: "react" },
  { title: "UI/UX Design Principles", level: "Beginner", rating: "4.6", icon: "design" },
  { title: "Node.js Backend Dev", level: "Intermediate", rating: "4.8", icon: "node" },
  { title: "Tailwind CSS From Zero", level: "Beginner", rating: "4.7", icon: "tailwind" },
] as const;

function CourseIcon({ type }: { type: (typeof courses)[number]["icon"] }) {
  if (type === "js") return <span className="recommended-course-js">JS</span>;
  if (type === "react") return <Atom aria-hidden="true" />;
  if (type === "design") return <Leaf aria-hidden="true" />;
  if (type === "node") return <Hexagon aria-hidden="true" />;
  return <Waves aria-hidden="true" />;
}

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
        <h2 id="recommended-title">Recommended for you</h2>
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
                <div className="recommended-course-wash" aria-hidden="true" />
                <div className={`recommended-course-icon recommended-course-icon--${course.icon}`}>
                  <CourseIcon type={course.icon} />
                </div>
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
                <div className="recommended-course-copy">
                  <div className="recommended-title-wrap">
                    <h3 title={course.title}>{course.title}</h3>
                  </div>
                  <div className="recommended-course-footer">
                    <span className="recommended-course-level" title={course.level}>
                      {course.level}
                    </span>
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

