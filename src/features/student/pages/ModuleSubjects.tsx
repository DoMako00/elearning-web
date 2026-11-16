import { ArrowLeft, BookOpen, CirclePlay } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CourseLibrary } from "../../../components/ui/CourseLibrary";
import type { StudentCourseDetail } from "../api/studentCoursesApi";
import { CourseHeroArt } from "./CourseOverviewReferenceCards";
import { toReferenceCourse, toSubjectCards } from "./referenceCourseMapper";
import "./CourseOverviewPage.css";
import "./module-subjects.css";

export function ModuleSubjects({ course }: { course: StudentCourseDetail }) {
  const navigate = useNavigate();
  const sections = course.subjectSections ?? course.chapters.map(chapter => ({ id: chapter.chapterId, title: chapter.title, sortOrder: chapter.sortOrder }));
  const subjects = toSubjectCards({ ...course, subjectSections: sections });
  const artwork = toReferenceCourse(course).heroOverlay;
  return <section className="course-overview-page module-subjects-page" aria-labelledby="module-subjects-title">
    <div className="course-overview-layout"><div className="course-overview-primary course-overview-primary--module">
      <article className="course-overview-hero" aria-labelledby="module-subjects-title">
        <CourseHeroArt artwork={artwork} />
        <div className="course-overview-hero__content"><div className="course-overview-hero__intro">
          <button type="button" className="module-subjects__return" onClick={() => navigate("/my-courses")}><ArrowLeft size={14} /> My Courses</button>
          <span className="course-overview-hero__status"><CirclePlay aria-hidden="true" /> Module · {course.academicSemester.title}</span>
          <h2 id="module-subjects-title">{course.title}</h2>
          <p className="course-overview-hero__context"><span>{course.academicInstitution.name}</span><i aria-hidden="true" /><span>{course.academicLevel.title}</span><i aria-hidden="true" /><span>{course.academicSemester.title}</span></p>
        </div><div className="course-overview-hero__footer"><span><strong>{course.brand.name}</strong><small> · Module-based course</small></span></div></div>
      </article>
      <article className="course-overview-card course-overview-about"><h2>Choose a subject</h2><p>Select a subject in {course.title} to explore its lessons and learning materials.</p></article>
      {subjects.length ? <CourseLibrary title="Subjects in this module" unitLabel="subject" courses={subjects} bookmarked={{}} selectedCourseId="" onSelectCourse={() => {}} onToggleBookmark={() => {}} /> : <div className="course-overview-card course-overview-materials__empty" role="status"><BookOpen size={22} /><p>No subjects have been added to this module yet.</p></div>}
    </div><aside className="course-overview-rail" aria-label="Module information"><article className="course-overview-card course-overview-about"><h2>About this module</h2><p>{course.title} · {course.academicInstitution.name}</p><dl><div><BookOpen size={15} /><span><dt>Subjects</dt><dd>{subjects.length}</dd></span></div></dl></article></aside></div>
  </section>;
}
