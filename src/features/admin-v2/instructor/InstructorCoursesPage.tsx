import { BookOpen, ChevronRight, Layers3, LibraryBig } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { getWorkspaceCopy } from "../copy/workspace-copy";

export function InstructorCoursesPage() {
  const { workspace } = useAdminV2();
  const copy = getWorkspaceCopy(workspace.workspace);
  const courses = workspace.courses;
  return <section className="admin-v2__page">
    <header className="admin-v2__page-header"><div><h1>My Courses</h1><p>Teaching spaces assigned to your Instructor account.</p></div><span className="admin-v2__status-chip"><LibraryBig size={14} />{courses.length} assigned</span></header>
    {!courses.length ? <div className="admin-v2__empty"><BookOpen size={20} /><strong>No assigned courses yet</strong><span>An administrator must link your teaching profile, Brand, and course before the course appears here.</span></div> : <div className="admin-v2__metrics" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
      {courses.map((course, index) => <article key={course.id} data-instructor-guide-target={index === 0 ? "course-card" : undefined} className="admin-v2__metric" style={{ minHeight: 172, alignItems: "flex-start", flexDirection: "column" }}>
        <span className="admin-v2__metric-icon"><BookOpen size={19} /></span>
        <div><span className="admin-v2__metric-label">{course.brandName} · {course.code}</span><strong style={{ fontSize: 16 }}>{course.title}</strong><small><Layers3 size={12} /> {course.status} · {course.academicLevelId ? copy.courses.placementConfirmed : copy.courses.placementUnavailable}</small></div>
        <Link data-instructor-guide-target={index === 0 ? "course-open" : undefined} className="admin-v2__button is-primary" to={`/admin/instructor/courses/${course.id}`}><span>{copy.courses.openCourseAction}</span><ChevronRight size={14} /></Link>
      </article>)}
    </div>}
  </section>;
}

export default InstructorCoursesPage;
