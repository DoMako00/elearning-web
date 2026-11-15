import { ArrowLeft, ArrowRight, BookOpen, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { StudentCourseDetail } from "../api/studentCoursesApi";
import "./module-subjects.css";

/** Published teaching sections are the only subject choices exposed by the course API. */
export function ModuleSubjects({ course }: { course: StudentCourseDetail }) {
  const navigate = useNavigate();
  return <section className="module-subjects" aria-labelledby="module-subjects-title">
    <button type="button" className="module-subjects__back" onClick={() => navigate("/my-courses")}><ArrowLeft size={16} /> My Courses</button>
    <header className="module-subjects__hero">
      <span><Layers3 size={15} /> MODULE · {course.academicSemester.title}</span>
      <h1 id="module-subjects-title">{course.title}</h1>
      <p>{course.academicInstitution.name} · {course.academicLevel.title}</p>
      <small>Select a subject to explore its lessons and learning materials.</small>
    </header>
    <div className="module-subjects__heading"><div><h2>Subjects in this module</h2><p>Choose where you would like to start.</p></div><span>{course.chapters.length} {course.chapters.length === 1 ? "subject" : "subjects"}</span></div>
    {course.chapters.length ? <div className="module-subjects__grid">{course.chapters.map(chapter => <button key={chapter.chapterId} type="button" className="module-subjects__card" onClick={() => navigate(`/my-courses/${course.courseId}?subject=${encodeURIComponent(chapter.chapterId)}`)}>
      <span className="module-subjects__icon"><BookOpen size={22} /></span><span className="module-subjects__card-copy"><strong>{chapter.title}</strong><small>{chapter.lessons.length} {chapter.lessons.length === 1 ? "lesson" : "lessons"}</small></span><ArrowRight size={18} />
    </button>)}</div> : <div className="module-subjects__empty" role="status"><BookOpen size={24} /><strong>No subjects available yet</strong><p>Subjects will appear here when the module content is published and available to your account.</p></div>}
  </section>;
}
