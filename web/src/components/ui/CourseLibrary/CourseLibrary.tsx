import { ArrowRight, Atom, Bookmark, Box, ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight, Code2, Grid2X2, List, Palette, Search, SlidersHorizontal } from "lucide-react";
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (viewportRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = viewportRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
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

  return (
    <section className="course-library" aria-labelledby="course-library-title">
      <header className="course-library__header">
        <h2 id="course-library-title">Course library</h2>
        <div className="course-library__toolbar" aria-label="Course library view controls">
          <div className="course-library__view-toggle" role="group" aria-label="Course view">
            <button type="button" className="is-active" aria-label="Grid view"><Grid2X2 aria-hidden="true" /></button>
            <button type="button" aria-label="List view"><List aria-hidden="true" /></button>
          </div>
          <label className="course-library__filter">
            <Search aria-hidden="true" />
            <input readOnly aria-label="Search and filter courses" placeholder="Search & filter" />
            <SlidersHorizontal aria-hidden="true" />
          </label>
        </div>
      </header>

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
            {courses.map((course) => (
              <article className="course-library__card" key={course.title} aria-label={course.title}>
                <div className={`course-library__art course-library__art--${course.art}`}>
                  <span>{course.art === "javascript" ? "JS" : <course.Icon aria-hidden="true" />}</span>
                  <div><em>{course.category}</em><em>{course.level}</em></div>
                  <button type="button" aria-label={`Save ${course.title}`}><Bookmark aria-hidden="true" /></button>
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

        {canScrollRight && (
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
    </section>
  );
}
