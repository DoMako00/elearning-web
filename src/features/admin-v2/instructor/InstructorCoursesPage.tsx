import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, ClipboardCheck, FileCheck2, GraduationCap, Layers3, LibraryBig, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { getWorkspaceCopy } from "../copy/workspace-copy";
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
      <header data-instructor-guide-target="course-list-header"><div><h2>Courses</h2>{domainLoading ? <Skeleton className="instructor-courses-view__count-skeleton" height={24} width={24} circle /> : <span>{courses.length}</span>}</div><LibraryBig size={17} /></header>
      <label className="instructor-courses-view__search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search courses" aria-label="Search courses" /></label>
      <div data-instructor-guide-target="course-card" className="instructor-courses-view__list">
        {domainLoading ? <div className="instructor-courses-view__course-skeletons" role="status" aria-label="Loading assigned courses">{courses.length ? courses.slice(0, 3).map(course => <CourseOptionSkeleton key={course.id} />) : <CourseListEmptySkeleton />}</div> : visibleCourses.map(course => <button key={course.id} type="button" className={`instructor-courses-view__course-option${selected?.id === course.id ? " is-selected" : ""}`} onClick={() => setSelectedId(course.id)} aria-pressed={selected?.id === course.id}>
          <span className="instructor-courses-view__course-icon"><BookOpen size={22} /></span><span className="instructor-courses-view__course-copy"><strong>{course.title}</strong><small>{course.brandName}</small><i>{course.status}</i></span>
        </button>)}
        {!domainLoading && !visibleCourses.length && <div className="instructor-courses-view__empty-list"><BookOpen size={20} /><strong>{courses.length ? "No matching courses" : "No assigned courses yet"}<small>{courses.length ? "Try another search." : "Ask your administrator to assign a course to your instructor account."}</small></strong></div>}
      </div>
      <footer>{domainLoading ? <Skeleton height={9} width={48} /> : <>{courses.length} {courses.length === 1 ? "course" : "courses"}</>}</footer>
    </aside>

    {domainLoading ? courses.length ? <CourseDetailSkeleton /> : <CourseEmptySkeleton /> : selected ? <section className="instructor-courses-view__detail">
      <article data-instructor-guide-target="course-open" className="instructor-courses-view__hero">
        <div className="instructor-courses-view__hero-copy"><div className="instructor-courses-view__badges"><span>{selected.brandName}</span><span className="is-status">{selected.status}</span></div><h1>{selected.title}</h1><p>{selected.code}</p><small>{selected.academicLevelId ? copy.courses.placementConfirmed : copy.courses.placementUnavailable}</small></div>
        <div className="instructor-courses-view__hero-art" aria-hidden="true"><BookOpen size={92} strokeWidth={1.1} /></div>
        <Link className="instructor-courses-view__open" to={coursePath} aria-label={`Open course builder for ${selected.title}`}>Open course builder<ArrowUpRight size={15} /></Link>
      </article>
      <div className="instructor-courses-view__panels">
        <section className="instructor-courses-view__panel instructor-courses-view__teaching">
          <header><h2>Teaching content</h2></header>
          <Link to={coursePath}><span className="instructor-courses-view__panel-icon"><Layers3 size={20} /></span><span><strong>Chapters &amp; lessons</strong><small>Organize your course content</small></span><ArrowUpRight size={15} /></Link>
          <Link to={coursePath}><span className="instructor-courses-view__panel-icon"><FileCheck2 size={20} /></span><span><strong>Videos &amp; files</strong><small>Manage lesson videos and documents</small></span><ArrowUpRight size={15} /></Link>
          <Link to={coursePath}><span className="instructor-courses-view__panel-icon"><LibraryBig size={20} /></span><span><strong>File approvals</strong><small>Check the review status of lesson files</small></span><ArrowUpRight size={15} /></Link>
          <p><FileCheck2 size={14} /> Lesson files stay private until approved.</p>
        </section>
        <section className="instructor-courses-view__panel instructor-courses-view__assessments">
          <header><h2>Assessments</h2></header>
          <Link to="/admin/instructor/assignments"><span className="instructor-courses-view__panel-icon"><ClipboardCheck size={20} /></span><span><strong>Assignments &amp; grading</strong><small>Create assignments and review student submissions</small></span><span className="instructor-courses-view__manage">Manage assignments <ArrowUpRight size={13} /></span></Link>
          <Link to="/admin/instructor/assessments"><span className="instructor-courses-view__panel-icon"><GraduationCap size={20} /></span><span><strong>Exams &amp; quizzes</strong><small>Manage assessments for your courses</small></span><span className="instructor-courses-view__manage">Manage exams <ArrowUpRight size={13} /></span></Link>
        </section>
      </div>
      <footer className="instructor-courses-view__access"><span><strong>Course access</strong><small>This course is assigned to your instructor account.</small></span><Link to={coursePath}>Open teaching workspace <ArrowUpRight size={14} /></Link></footer>
    </section> : <section className="instructor-courses-view__no-selection"><BookOpen size={32} /><h2>No course selected</h2><p>Ask your administrator to assign a course. Once it is available, you can build lessons, manage files, and support your students here.</p></section>}
  </main>;
}

function CourseOptionSkeleton() {
  return <div className="instructor-courses-view__course-option instructor-courses-view__course-option--skeleton" aria-hidden="true"><Skeleton height={42} width={42} radius="md" /><span><Skeleton height={9} width="82%" /><Skeleton height={8} width="56%" /><Skeleton height={16} width={54} radius="xl" /></span></div>;
}

function CourseListEmptySkeleton() {
  return <div className="instructor-courses-view__list-empty-skeleton" aria-hidden="true"><Skeleton height={24} width={24} circle /><Skeleton height={9} width={116} /><Skeleton height={8} width="86%" /><Skeleton height={8} width="72%" /></div>;
}

function CourseDetailSkeleton() {
  return <section className="instructor-courses-view__detail instructor-courses-view__detail--skeleton" role="status" aria-label="Loading course workspace">
    <article className="instructor-courses-view__hero"><div className="instructor-courses-view__hero-copy"><div className="instructor-courses-view__badges"><Skeleton height={19} width={58} radius="xl" /><Skeleton height={19} width={68} radius="xl" /></div><Skeleton height={27} width="62%" /><Skeleton height={9} width="38%" /><Skeleton height={8} width="44%" /></div><Skeleton className="instructor-courses-view__hero-action-skeleton" height={38} width={132} radius="md" /></article>
    <div className="instructor-courses-view__panels">{[0, 1].map(panel => <section className="instructor-courses-view__panel" key={panel}><header><Skeleton height={16} width={110} /></header>{[0, 1, ...(panel === 0 ? [2] : [])].map(row => <div className="instructor-courses-view__panel-skeleton" key={row}><Skeleton height={38} width={38} radius="md" /><span><Skeleton height={9} width="58%" /><Skeleton height={8} width="82%" /></span><Skeleton height={24} width={panel ? 96 : 12} radius="md" /></div>)}</section>)}</div>
    <footer className="instructor-courses-view__access"><span><Skeleton height={9} width={78} /><Skeleton height={8} width={194} /></span><Skeleton height={10} width={132} /></footer>
  </section>;
}

function CourseEmptySkeleton() {
  return <section className="instructor-courses-view__no-selection instructor-courses-view__empty-skeleton" role="status" aria-label="Loading course access"><Skeleton height={34} width={34} circle /><Skeleton height={18} width={158} /><Skeleton height={9} width="68%" /><Skeleton height={9} width="54%" /></section>;
}

export default InstructorCoursesPage;
