import {
  ArrowRight,
  Atom,
  Bookmark,
  Box,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  Code2,
  Grid2X2,
  List,
  Palette,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./CourseLibrary.css";

const courses = [
  { title: "React Complete Guide", category: "Development", level: "Intermediate", progress: 42, opened: "Last opened 2 days ago", art: "react", Icon: Atom },
  { title: "JavaScript Mastery", category: "Development", level: "Intermediate", progress: 78, opened: "Last opened yesterday", art: "javascript", Icon: Code2 },
  { title: "Node.js Backend Dev", category: "Backend", level: "Advanced", progress: 25, opened: "Last opened 5 days ago", art: "node", Icon: Box },
  { title: "UI/UX Design Principles", category: "Design", level: "Beginner", progress: 15, opened: "Last opened a week ago", art: "design", Icon: Palette },
  { title: "Data Science Foundations", category: "Data", level: "Intermediate", progress: 36, opened: "Last opened 2 weeks ago", art: "data", Icon: ChartNoAxesColumnIncreasing },
];

export function CourseLibrary() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filteredCourses = courses.filter((course) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      course.title.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q) ||
      course.level.toLowerCase().includes(q)
    );
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
  }, [viewMode, filteredCourses.length]);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const showPrevCourses = () => {
    if (viewportRef.current) {
      const card = viewportRef.current.querySelector<HTMLElement>(".course-library__card");
      const scrollAmount = card ? (card.offsetWidth + 16) * 1.5 : viewportRef.current.clientWidth * 0.75;
      viewportRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const showNextCourses = () => {
    if (viewportRef.current) {
      const card = viewportRef.current.querySelector<HTMLElement>(".course-library__card");
      const scrollAmount = card ? (card.offsetWidth + 16) * 1.5 : viewportRef.current.clientWidth * 0.75;
      viewportRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const toggleBookmark = (title: string) => {
    setBookmarked((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <section className={`course-library course-library--${viewMode}`} aria-labelledby="course-library-title">
      <header className="course-library__header">
        <h2 id="course-library-title">Course library</h2>
        <div className="course-library__toolbar" aria-label="Course library view controls">
          <div className="course-library__view-toggle" role="group" aria-label="Course view">
            <button
              type="button"
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid2X2 aria-hidden="true" />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List aria-hidden="true" />
            </button>
          </div>
          <label className="course-library__filter">
            <Search aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search and filter courses"
              placeholder="Search & filter"
            />
            {searchQuery ? (
              <button
                type="button"
                className="course-library__filter-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X aria-hidden="true" />
              </button>
            ) : (
              <SlidersHorizontal aria-hidden="true" />
            )}
          </label>
        </div>
      </header>

      {filteredCourses.length === 0 ? (
        <div className="course-library__empty">
          <p>No courses found matching &quot;{searchQuery}&quot;</p>
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear search
          </button>
        </div>
      ) : viewMode === "list" ? (
        <div className="course-library__list" role="list">
          {filteredCourses.map((course) => (
            <article className="course-library__list-item" key={course.title} aria-label={course.title}>
              <div className={`course-library__list-art course-library__art--${course.art}`}>
                <span>{course.art === "javascript" ? "JS" : <course.Icon aria-hidden="true" />}</span>
              </div>
              <div className="course-library__list-content">
                <div className="course-library__list-header">
                  <h3 title={course.title}>{course.title}</h3>
                  <div className="course-library__list-tags">
                    <em>{course.category}</em>
                    <em>{course.level}</em>
                  </div>
                </div>
                <p className="course-library__list-opened">{course.opened}</p>
              </div>
              <div className="course-library__list-progress-wrap">
                <div className="course-library__progress">
                  <i><b style={{ width: `${course.progress}%` }} /></i>
                  <strong>{course.progress}%</strong>
                </div>
              </div>
              <div className="course-library__list-actions">
                <button
                  type="button"
                  className={`course-library__list-bookmark ${bookmarked[course.title] ? "is-saved" : ""}`}
                  onClick={() => toggleBookmark(course.title)}
                  aria-label={`Save ${course.title}`}
                >
                  <Bookmark aria-hidden="true" className={bookmarked[course.title] ? "fill-current text-green-600" : ""} />
                </button>
                <button type="button" className="course-library__list-arrow" aria-label={`Open ${course.title}`}>
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="course-library__carousel">
          {canScrollLeft && (
            <button
              type="button"
              className="course-library__prev"
              onClick={showPrevCourses}
              aria-label="Show previous courses"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
          )}

          <div
            ref={viewportRef}
            className="course-library__viewport"
            tabIndex={0}
            aria-label="Course library carousel"
            onScroll={checkScroll}
          >
            <div className="course-library__track">
              {filteredCourses.map((course) => (
                <article className="course-library__card" key={course.title} aria-label={course.title}>
                  <div className={`course-library__art course-library__art--${course.art}`}>
                    <span>{course.art === "javascript" ? "JS" : <course.Icon aria-hidden="true" />}</span>
                    <div><em>{course.category}</em><em>{course.level}</em></div>
                    <button
                      type="button"
                      className={bookmarked[course.title] ? "is-bookmarked" : ""}
                      onClick={() => toggleBookmark(course.title)}
                      aria-label={`Save ${course.title}`}
                    >
                      <Bookmark aria-hidden="true" className={bookmarked[course.title] ? "fill-current text-white" : ""} />
                    </button>
                  </div>
                  <div className="course-library__card-body">
                    <h3 title={course.title}>{course.title}</h3>
                    <div className="course-library__progress">
                      <i><b style={{ width: `${course.progress}%` }} /></i>
                      <strong>{course.progress}%</strong>
                    </div>
                    <footer>
                      <span>{course.opened}</span>
                      <button type="button" aria-label={`Open ${course.title}`}><ArrowRight aria-hidden="true" /></button>
                    </footer>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {canScrollRight && filteredCourses.length > 2 && (
            <button
              type="button"
              className="course-library__next"
              onClick={showNextCourses}
              aria-label="Show more courses"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
