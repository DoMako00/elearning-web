import { ArrowRight, Atom, Bookmark, Box, ChartNoAxesColumnIncreasing, Code2, Grid2X2, List, Palette, Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useRef } from "react";
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
  const showNextCourses = () => viewportRef.current?.scrollBy({ left: Math.max(280, viewportRef.current.clientWidth * .78), behavior: "smooth" });

  return <section className="course-library" aria-labelledby="course-library-title">
    <header className="course-library__header">
      <h2 id="course-library-title">Course library</h2>
      <div className="course-library__toolbar" aria-label="Course library view controls">
        <div className="course-library__view-toggle" role="group" aria-label="Course view">
          <button type="button" className="is-active" aria-label="Grid view"><Grid2X2 aria-hidden="true" /></button><button type="button" aria-label="List view"><List aria-hidden="true" /></button>
        </div>
        <label className="course-library__filter"><Search aria-hidden="true" /><input readOnly aria-label="Search and filter courses" placeholder="Search & filter" /><SlidersHorizontal aria-hidden="true" /></label>
      </div>
    </header>
    <div className="course-library__carousel">
      <div ref={viewportRef} className="course-library__viewport" tabIndex={0} aria-label="Course library carousel"><div className="course-library__track">
        {courses.map((course) => <article className="course-library__card" key={course.title} aria-label={course.title}>
          <div className={`course-library__art course-library__art--${course.art}`}><span>{course.art === "javascript" ? "JS" : <course.Icon aria-hidden="true" />}</span><div><em>{course.category}</em><em>{course.level}</em></div><button type="button" aria-label={`Save ${course.title}`}><Bookmark aria-hidden="true" /></button></div>
          <div className="course-library__card-body"><h3 title={course.title}>{course.title}</h3><div className="course-library__progress"><i><b style={{ width: `${course.progress}%` }} /></i><strong>{course.progress}%</strong></div><footer><span>{course.opened}</span><button type="button" aria-label={`Open ${course.title}`}><ArrowRight aria-hidden="true" /></button></footer></div>
        </article>)}
      </div></div>
      <button type="button" className="course-library__next" onClick={showNextCourses} aria-label="Show more courses"><ChevronRight aria-hidden="true" /></button>
    </div>
  </section>;
}
