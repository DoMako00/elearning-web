import { useMemo, useState } from "react";
import { Skeleton } from "@mantine/core";
import { ArrowUpRight, BarChart3, BookOpen, ChevronRight, FileCheck2, FileText, ListFilter, Lock, PlayCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { getWorkspaceCopy } from "../copy/workspace-copy";
import { instructorCourseArtwork } from "./instructor-course-art";
import { CourseDetailSkeleton, CourseOptionSkeleton } from "./InstructorCoursesSkeleton";
import "./instructor-courses.css";

export function InstructorCoursesPage() {
  const { workspace, domainLoading } = useAdminV2();
  const copy = getWorkspaceCopy(workspace.workspace);
  const courses = workspace.courses;
  const [selectedId, setSelectedId] = useState(courses[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const visibleCourses = useMemo(() => courses.filter(course => `${course.title} ${course.code} ${course.brandName}`.toLowerCase().includes(search.toLowerCase())), [courses, search]);
  const selected = visibleCourses.find(course => course.id === selectedId) ?? visibleCourses[0] ?? courses.find(course => course.id === selectedId) ?? courses[0];
  const coursePath = selected ? `/admin/instructor/courses/${encodeURIComponent(selected.id)}` : "/admin/instructor/courses";

  return <main className="instructor-courses-view" aria-label="My courses" aria-busy={domainLoading}>
    <aside className="instructor-courses-view__picker">
      <header data-instructor-guide-target="course-list-header"><div><h2>Courses</h2>{domainLoading ? <Skeleton className="instructor-courses-view__count-skeleton" height={24} width={24} circle /> : <span>{courses.length}</span>}</div><ListFilter size={18} aria-hidden="true" /></header>
      <label className="instructor-courses-view__search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search courses" aria-label="Search courses" /></label>
      <div data-instructor-guide-target="course-card" className="instructor-courses-view__list">
        {domainLoading ? <div className="instructor-courses-view__course-skeletons" role="status" aria-label="Loading assigned courses">{Array.from({ length: Math.min(courses.length || 1, 6) }, (_, index) => <CourseOptionSkeleton key={index} />)}</div> : visibleCourses.map((course, index) => <button key={course.id} type="button" className={`instructor-courses-view__course-option${selected?.id === course.id ? " is-selected" : ""}`} onClick={() => setSelectedId(course.id)} aria-pressed={selected?.id === course.id}>
          <span className="instructor-courses-view__course-icon"><img src={instructorCourseArtwork(`${course.title} ${course.code}`, index)} alt="" loading="lazy" /></span><span className="instructor-courses-view__course-copy"><strong>{course.title}</strong><small>{course.brandName}</small><i className={`is-${course.status}`}>{statusLabel(course.status)}</i></span>
        </button>)}
        {!domainLoading && !visibleCourses.length && <div className="instructor-courses-view__empty-list"><BookOpen size={20} /><strong>{courses.length ? "No matching courses" : "No assigned courses yet"}<small>{courses.length ? "Try another search." : "Ask your administrator to assign a course to your instructor account."}</small></strong></div>}
      </div>
      <footer>{domainLoading ? <Skeleton height={9} width={48} /> : <>{courses.length} {courses.length === 1 ? "course" : "courses"}</>}</footer>
    </aside>

    {domainLoading ? <CourseDetailSkeleton /> : selected ? <section className="instructor-courses-view__detail">
      <article data-instructor-guide-target="course-open" className="instructor-courses-view__hero">
        <div className="instructor-courses-view__hero-copy"><div className="instructor-courses-view__badges"><span>{selected.brandName}</span><span className="is-status">{statusLabel(selected.status)}</span></div><h1>{selected.title}</h1><p>{selected.code}</p><small>{selected.academicLevelId ? copy.courses.placementConfirmed : copy.courses.placementUnavailable}</small></div>
        <div className="instructor-courses-view__hero-art" aria-hidden="true"><img src={instructorCourseArtwork(`${selected.title} ${selected.code}`)} alt="" /></div>
        <Link className="instructor-courses-view__open" to={coursePath} aria-label={`Open course builder for ${selected.title}`}>Open course builder<ArrowUpRight size={15} /></Link>
      </article>
      <div className="instructor-courses-view__panels">
        <section className="instructor-courses-view__panel instructor-courses-view__teaching">
          <header><h2>Teaching content</h2></header>
          <Link to={coursePath}><span className="instructor-courses-view__panel-icon"><FileText size={22} /></span><span><strong>Chapters &amp; lessons</strong><small>Organize your course content</small></span><ChevronRight size={18} /></Link>
          <Link to={coursePath}><span className="instructor-courses-view__panel-icon"><PlayCircle size={22} /></span><span><strong>Videos &amp; files</strong><small>Manage lesson videos and documents</small></span><ChevronRight size={18} /></Link>
          <Link to={coursePath}><span className="instructor-courses-view__panel-icon"><FileCheck2 size={22} /></span><span><strong>File approvals</strong><small>Review the approval status of your lesson files</small></span><ChevronRight size={18} /></Link>
          <p><Lock size={15} /> Lesson files stay private until approved.</p>
        </section>
        <section className="instructor-courses-view__panel instructor-courses-view__assessments">
          <header><h2>Assessments</h2></header>
          <Link to="/admin/instructor/assignments"><span className="instructor-courses-view__panel-icon"><FileText size={22} /></span><span><strong>Assignments &amp; grading</strong><small>Create assignments and review student submissions</small></span><span className="instructor-courses-view__manage">Manage assignments <ArrowUpRight size={13} /></span></Link>
          <Link to="/admin/instructor/assessments"><span className="instructor-courses-view__panel-icon"><BarChart3 size={22} /></span><span><strong>Exams &amp; quizzes</strong><small>Manage assessments for this course</small></span><span className="instructor-courses-view__manage">Manage exams <ArrowUpRight size={13} /></span></Link>
        </section>
      </div>
      <footer className="instructor-courses-view__access"><span><strong>Course access</strong><small>This course is assigned to your instructor account.</small></span><Link to={coursePath}>Open teaching workspace <ArrowUpRight size={14} /></Link></footer>
    </section> : <section className="instructor-courses-view__no-selection"><BookOpen size={32} /><h2>No course selected</h2><p>Ask your administrator to assign a course. Once it is available, you can build lessons, manage files, and support your students here.</p></section>}
  </main>;
}

function statusLabel(status: string) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : "";
}

export default InstructorCoursesPage;
