import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { StudentCourseItem } from "../../../features/student/api/studentCoursesApi";
import { useNextSessions } from "../../../features/student/hooks/useNextSessions";
import { toReferenceCourse } from "../../../features/student/pages/referenceCourseMapper";
import "./RecommendedCourses.css";

export function RecommendedSessions({courses, loading = false, error = false}: {courses: readonly StudentCourseItem[]; loading?: boolean; error?: boolean}) {
  const sessions = useNextSessions(courses);
  const navigate = useNavigate();
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft,setCanScrollLeft] = useState(false);
  const [canScrollRight,setCanScrollRight] = useState(false);
  const checkScroll = () => {
    const row = rowRef.current;
    if (row) {setCanScrollLeft(row.scrollLeft > 10);setCanScrollRight(row.scrollLeft+row.clientWidth < row.scrollWidth-10);}
  };
  useEffect(() => {checkScroll();window.addEventListener("resize",checkScroll);return () => window.removeEventListener("resize",checkScroll);},[sessions.length]);
  const scroll = (direction: number) => {
    const row = rowRef.current;
    if (row) {const card = row.querySelector<HTMLElement>(".recommended-course");row.scrollBy({left: direction*(card ? (card.offsetWidth+14)*2 : row.clientWidth*0.75),behavior: "smooth"});}
  };
  return <section className="recommended-card" aria-labelledby="next-sessions-title">
    <header className="recommended-header"><h2 id="next-sessions-title">Recommended sessions</h2><button type="button" className="recommended-view-all cursor-pointer" onClick={() => navigate("/my-courses")}>View all <ArrowRight aria-hidden="true" /></button></header>
    <div className="recommended-carousel-wrap">
      {canScrollLeft ? <button type="button" className="recommended-prev" aria-label="Show previous sessions" onClick={() => scroll(-1)}><ChevronLeft aria-hidden="true" /></button> : null}
      <div className="recommended-row" ref={rowRef} onScroll={checkScroll}>
        {loading ? <p className="recommended-state" role="status">Loading your modules…</p> : error ? <p className="recommended-state" role="alert">Your modules could not be loaded.</p> : sessions.length === 0 ? <p className="recommended-state">No assigned modules yet.</p> : sessions.map(({course,query,next}) => {
          const lesson = next?.lesson;
          const ready = Boolean(course.access.canOpen && lesson?.playbackAvailable);
          const label = query.isPending ? "Loading sessions…" : query.isError ? "Sessions could not be loaded" : next?.allCompleted ? "All sessions completed" : lesson ? `${lesson.progressStatus === "in_progress" ? "Continue" : "Start"} session ${next?.number}` : "Sessions not published yet";
          const artwork = toReferenceCourse(course).image;
          const open = () => navigate(ready && lesson ? `/my-courses/${course.courseId}/lessons/${lesson.lessonId}` : `/my-courses/${course.courseId}`);
          return <article key={course.courseId} className="recommended-course cursor-pointer transition-all hover:shadow-md" role="link" tabIndex={0} aria-label={`${course.title}: ${label}`} onClick={open} onKeyDown={event => {if(event.key === "Enter" || event.key === " "){event.preventDefault();open();}}}>
            <div className="recommended-course-media">{artwork ? <img src={artwork} alt="" loading="lazy" /> : <span className="grid h-full place-items-center bg-emerald-50 text-emerald-600"><BookOpen className="size-12" aria-hidden="true" /></span>}</div>
            <div className="recommended-course-copy"><h3>{course.title}</h3><p className="recommended-course-subtitle">{lesson?.title ?? course.academicSemester.title}</p><div className="recommended-course-footer"><span className="recommended-course-level">{label}</span><ArrowRight className="size-4" aria-hidden="true" /></div>{lesson && !ready ? <p className="recommended-course-subtitle">Session media coming soon</p> : null}</div>
          </article>;
        })}
      </div>
      {canScrollRight ? <button type="button" className="recommended-next" aria-label="Show more sessions" onClick={() => scroll(1)}><ChevronRight aria-hidden="true" /></button> : null}
    </div>
  </section>;
}
