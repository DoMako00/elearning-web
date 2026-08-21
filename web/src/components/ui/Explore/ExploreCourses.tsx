import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExploreCourseArt } from "./ExploreCourseArt";
import { type ExploreCourse } from "./exploreData";

interface ExploreCoursesProps {
  courses: ExploreCourse[];
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function ExploreCourses({
  courses,
  searchQuery = "",
  onClearSearch,
}: ExploreCoursesProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"relevant" | "rating" | "popular">("relevant");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const viewportRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Sorting
  const sortedCourses = [...courses].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "popular") {
      const getCount = (str: string) => parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
      return getCount(b.learners) - getCount(a.learners);
    }
    return 0;
  });

  const checkScroll = () => {
    if (viewportRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = viewportRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    if (viewMode === "grid") {
      checkScroll();
    }
  }, [viewMode, sortedCourses.length]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", checkScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const showPrevCourses = () => {
    if (viewportRef.current) {
      const card = viewportRef.current.querySelector<HTMLElement>(".explore-course-card");
      const scrollAmount = card ? (card.offsetWidth + 16) * 1.5 : viewportRef.current.clientWidth * 0.75;
      viewportRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const showNextCourses = () => {
    if (viewportRef.current) {
      const card = viewportRef.current.querySelector<HTMLElement>(".explore-course-card");
      const scrollAmount = card ? (card.offsetWidth + 16) * 1.5 : viewportRef.current.clientWidth * 0.75;
      viewportRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "rating":
        return "Most relevant";
      case "popular":
        return "Most popular";
      default:
        return "Most relevant";
    }
  };

  return (
    <section className="explore-courses" aria-labelledby="courses-for-you-title">
      <header className="explore-courses__header">
        <div className="explore-courses__heading-wrap">
          <h2 id="courses-for-you-title" className="explore-courses__title">
            Courses for you
          </h2>
          <span className="explore-courses__subtitle">Based on your interests</span>
        </div>

        <div className="explore-courses__controls">
          <div className="explore-sort-dropdown" ref={sortRef}>
            <button
              type="button"
              className="explore-sort-btn"
              onClick={() => setIsSortOpen(!isSortOpen)}
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
            >
              <span>{getSortLabel()}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </button>

            {isSortOpen && (
              <ul className="explore-sort-menu" role="listbox" aria-label="Sort options">
                <li
                  role="option"
                  aria-selected={sortBy === "relevant"}
                  className={sortBy === "relevant" ? "is-selected" : ""}
                  onClick={() => {
                    setSortBy("relevant");
                    setIsSortOpen(false);
                  }}
                >
                  Most relevant
                </li>
                <li
                  role="option"
                  aria-selected={sortBy === "rating"}
                  className={sortBy === "rating" ? "is-selected" : ""}
                  onClick={() => {
                    setSortBy("rating");
                    setIsSortOpen(false);
                  }}
                >
                  Highest rated
                </li>
                <li
                  role="option"
                  aria-selected={sortBy === "popular"}
                  className={sortBy === "popular" ? "is-selected" : ""}
                  onClick={() => {
                    setSortBy("popular");
                    setIsSortOpen(false);
                  }}
                >
                  Most popular
                </li>
              </ul>
            )}
          </div>

          <div className="explore-view-toggle" role="group" aria-label="View toggle">
            <button
              type="button"
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid2X2 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {sortedCourses.length === 0 ? (
        <div className="explore-courses__empty">
          <p>No courses found matching &quot;{searchQuery}&quot;</p>
          {onClearSearch && (
            <button type="button" onClick={onClearSearch}>
              Clear search & filters
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="explore-courses__list" role="list">
          {sortedCourses.map((course) => (
            <article key={course.id} className="explore-course-list-item" aria-label={course.title}>
              <div className="explore-course-list-item__art">
                <ExploreCourseArt artType={course.artType} />
              </div>
              <div className="explore-course-list-item__content">
                <span className={`explore-course-tag explore-course-tag--${course.categoryId}`}>
                  {course.category}
                </span>
                <h3 className="explore-course-list-item__title">{course.title}</h3>
                <p className="explore-course-list-item__meta">
                  <span>{course.level}</span>
                  <span className="explore-course-dot">•</span>
                  <span>{course.duration}</span>
                  <span className="explore-course-dot">•</span>
                  <span className="explore-course-rating">★ {course.rating}</span>
                  <span className="explore-course-dot">•</span>
                  <span>{course.learners}</span>
                </p>
              </div>
              <div className="explore-course-list-item__actions">
                <button
                  type="button"
                  className={`explore-action-btn ${bookmarked[course.id] ? "is-saved" : ""}`}
                  onClick={() => toggleBookmark(course.id)}
                  aria-label={bookmarked[course.id] ? `Remove ${course.title} from bookmarks` : `Bookmark ${course.title}`}
                  aria-pressed={bookmarked[course.id]}
                >
                  <Bookmark className={`size-3.5 ${bookmarked[course.id] ? "fill-current" : ""}`} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="explore-action-btn explore-action-btn--arrow"
                  aria-label={`Open ${course.title}`}
                >
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="explore-courses__carousel">
          {canScrollLeft && (
            <button
              type="button"
              className="explore-carousel-nav explore-carousel-nav--prev"
              onClick={showPrevCourses}
              aria-label="Previous courses"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          )}

          <div
            ref={viewportRef}
            className="explore-courses__viewport"
            tabIndex={0}
            aria-label="Courses for you carousel"
            onScroll={checkScroll}
          >
            <div className="explore-courses__track">
              {sortedCourses.map((course) => (
                <article key={course.id} className="explore-course-card" aria-label={course.title}>
                  <div className="explore-course-card__art">
                    <ExploreCourseArt artType={course.artType} />
                  </div>

                  <div className="explore-course-card__body">
                    <span className={`explore-course-tag explore-course-tag--${course.categoryId}`}>
                      {course.category}
                    </span>
                    <h3 className="explore-course-card__title" title={course.title}>
                      {course.title}
                    </h3>
                    <div className="explore-course-card__bottom-row">
                      <p className="explore-course-card__meta">
                        <span>{course.level}</span>
                        <span className="explore-course-dot">•</span>
                        <span>{course.duration}</span>
                        <span className="explore-course-dot">•</span>
                        <span className="explore-course-rating">★ {course.rating}</span>
                        <span className="explore-course-dot">•</span>
                        <span>{course.learners}</span>
                      </p>
                      <div className="explore-course-card__actions">
                        <button
                          type="button"
                          className={`explore-action-btn ${bookmarked[course.id] ? "is-saved" : ""}`}
                          onClick={() => toggleBookmark(course.id)}
                          aria-label={bookmarked[course.id] ? `Remove ${course.title} from bookmarks` : `Bookmark ${course.title}`}
                          aria-pressed={bookmarked[course.id]}
                        >
                          <Bookmark className={`size-3.5 ${bookmarked[course.id] ? "fill-current" : ""}`} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="explore-action-btn explore-action-btn--arrow"
                          aria-label={`Open ${course.title}`}
                        >
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {canScrollRight && sortedCourses.length > 3 && (
            <button
              type="button"
              className="explore-carousel-nav explore-carousel-nav--next"
              onClick={showNextCourses}
              aria-label="Next courses"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
