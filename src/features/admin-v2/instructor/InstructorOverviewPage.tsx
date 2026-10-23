import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ClipboardCheck, FileClock, Files, GraduationCap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { adminAssignmentsApi } from "../api/adminAssignmentsApi";
import { adminAssessmentApi } from "../api/adminAssessmentApi";
import { listContentReviewRequests } from "../api/adminContentApi";
import { courseUnitLabel } from "../data/adminV2.selectors";
import { useAdminV2 } from "../layout/AdminV2Layout";

export function InstructorOverviewPage() {
  const { workspace } = useAdminV2();
  return workspace.workspace === "super_admin" ? <SuperAdminTeachingOverview /> : <InstructorTeachingOverview />;
}

function SuperAdminTeachingOverview() {
  const { data, brand } = useAdminV2();
  const assignments = useQuery({ queryKey: ["admin", "teaching-overview", "assignments"], queryFn: ({ signal }) => adminAssignmentsApi.list(signal) });
  const assessments = useQuery({ queryKey: ["admin", "teaching-overview", "assessments"], queryFn: ({ signal }) => adminAssessmentApi.list(signal) });
  const reviews = useQuery({ queryKey: ["admin", "teaching-overview", "content-review-requests"], queryFn: ({ signal }) => listContentReviewRequests(signal) });
  const courses = data.courses.filter(course => brand === "all" || course.brand === brand);
  const visibleAssignments = assignments.data?.items.filter(item => brand === "all" || item.brandCode === brand) ?? [];
  const visibleAssessments = assessments.data?.items.filter(item => brand === "all" || item.brandCode === brand) ?? [];
  const visibleReviews = reviews.data?.items.filter(item => brand === "all" || item.brandCode === brand) ?? [];
  const needsReview = visibleAssignments.reduce((count, item) => count + item.needsReviewCount, 0);
  const waitingForApproval = visibleReviews.filter(item => item.status === "submitted").length;
  const publishedExams = visibleAssessments.filter(item => item.status === "published").length;

  return <section className="admin-v2__page admin-v2__teaching-overview">
    <header className="admin-v2__page-header"><div><h1>Teaching overview</h1><p>Course plans, learning materials, exams, and student work in one place.</p></div></header>

    <aside className="admin-v2__teaching-role-note">
      <span><ShieldCheck size={19} /></span>
      <div><strong>You are signed in as Super Admin</strong><p>You can manage course outlines, review lesson materials, and oversee student work. Creating or publishing exams and assignments requires a separate Instructor sign-in assigned to that course.</p></div>
      <Link to="/admin/roles">Instructor access <ArrowRight size={14} /></Link>
    </aside>

    <div className="admin-v2__metrics admin-v2__teaching-metrics">
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><BookOpen size={18} /></span><div><span className="admin-v2__metric-label">Courses</span><strong>{courses.length}</strong><small>Available in the selected brand view</small></div></article>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><ClipboardCheck size={18} /></span><div><span className="admin-v2__metric-label">Student work to review</span><strong>{assignments.isLoading || assignments.isError ? "—" : needsReview}</strong><small>Submitted assignment responses</small></div></article>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><GraduationCap size={18} /></span><div><span className="admin-v2__metric-label">Published exams</span><strong>{assessments.isLoading || assessments.isError ? "—" : publishedExams}</strong><small>Currently visible to students</small></div></article>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><FileClock size={18} /></span><div><span className="admin-v2__metric-label">Materials awaiting review</span><strong>{reviews.isLoading || reviews.isError ? "—" : waitingForApproval}</strong><small>Video, PDF, or lesson changes</small></div></article>
    </div>

    {(assignments.isError || assessments.isError || reviews.isError) && <p role="alert" className="admin-v2__inline-notice">Some teaching information could not be loaded. The course list remains available; retry the related page to refresh its records.</p>}

    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar"><div><strong>Courses and teaching teams</strong><span>{courses.length}</span></div><Link className="admin-v2__button" to="/admin/courses">All courses <ArrowRight size={13} /></Link></header>
        {courses.length ? <div className="admin-v2__table-scroll"><table className="admin-v2__table"><thead><tr><th>Course</th><th>Instructor</th><th>Student work</th><th></th></tr></thead><tbody>{courses.slice(0, 12).map(course => {
          const courseAssignments = visibleAssignments.filter(item => item.brandCourseId === course.id);
          const courseNeedsReview = courseAssignments.reduce((count, item) => count + item.needsReviewCount, 0);
          const instructors = course.instructors.map(item => item.name).filter(Boolean).join(", ");
          return <tr key={course.id}><td><strong>{course.title}</strong><small>{course.code || courseUnitLabel(data, course)}</small></td><td>{instructors || "No instructor assigned"}</td><td>{assignments.isLoading || assignments.isError ? "—" : courseNeedsReview}</td><td><Link className="admin-v2__button" to={`/admin/courses/${course.id}/builder`}>Course outline <ArrowRight size={13} /></Link></td></tr>;
        })}</tbody></table></div> : <div className="admin-v2__empty"><BookOpen size={20} /><strong>No courses are available in this view</strong><span>Choose another brand or check the course catalogue.</span><Link className="admin-v2__button" to="/admin/courses">Open course catalogue</Link></div>}
      </section>

      <aside className="admin-v2__inspector admin-v2__teaching-actions">
        <header className="admin-v2__inspector-title"><div><h2>What would you like to review?</h2><small>Open the relevant area to take action.</small></div></header>
        <div className="admin-v2__access-list">
          <article><Files size={16} /><div><Link to="/admin/content"><strong>Review lesson materials</strong></Link><small>{reviews.isLoading || reviews.isError ? "Review status is unavailable" : `${waitingForApproval} item${waitingForApproval === 1 ? "" : "s"} waiting for approval`}</small></div><ArrowRight size={14} /></article>
          <article><ClipboardCheck size={16} /><div><Link to="/admin/assignments"><strong>Review student assignments</strong></Link><small>{assignments.isLoading || assignments.isError ? "Submission status is unavailable" : `${needsReview} response${needsReview === 1 ? "" : "s"} need review`}</small></div><ArrowRight size={14} /></article>
          <article><GraduationCap size={16} /><div><Link to="/admin/assessments"><strong>Monitor exams and quizzes</strong></Link><small>{assessments.isLoading || assessments.isError ? "Exam status is unavailable" : `${visibleAssessments.length} assessment${visibleAssessments.length === 1 ? "" : "s"} in this view`}</small></div><ArrowRight size={14} /></article>
        </div>
      </aside>
    </div>
  </section>;
}

function InstructorTeachingOverview() {
  const { workspace } = useAdminV2();
  const assignments = useQuery({ queryKey: ["instructor", "assignments"], queryFn: ({ signal }) => adminAssignmentsApi.list(signal) });
  const reviews = useQuery({ queryKey: ["instructor", "content-review-requests"], queryFn: ({ signal }) => listContentReviewRequests(signal) });
  const courses = workspace.courses;
  const items = assignments.data?.items ?? [];
  const reviewItems = reviews.data?.items ?? [];
  const needsReview = items.reduce((sum, item) => sum + item.needsReviewCount, 0);
  const publishedAssignments = items.filter(item => item.status === "published").length;
  const submittedContent = reviewItems.filter(item => item.status === "submitted").length;
  const rejectedContent = reviewItems.filter(item => item.status === "rejected").length;

  return <section className="admin-v2__page">
    <header className="admin-v2__page-header"><div><h1>Teaching overview</h1><p>A live summary of your assigned courses, student submissions, and content review status.</p></div></header>
    <div className="admin-v2__metrics" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", marginBottom: 14 }}>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><BookOpen size={18} /></span><div><span className="admin-v2__metric-label">Assigned courses</span><strong>{courses.length}</strong><small>From your active course assignments</small></div></article>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><ClipboardCheck size={18} /></span><div><span className="admin-v2__metric-label">Assignments to review</span><strong>{assignments.isLoading || assignments.isError ? "—" : needsReview}</strong><small>Submitted student work</small></div></article>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><GraduationCap size={18} /></span><div><span className="admin-v2__metric-label">Published assignments</span><strong>{assignments.isLoading || assignments.isError ? "—" : publishedAssignments}</strong><small>Visible to students</small></div></article>
      <article className="admin-v2__metric"><span className="admin-v2__metric-icon"><FileClock size={18} /></span><div><span className="admin-v2__metric-label">Content awaiting review</span><strong>{reviews.isLoading || reviews.isError ? "—" : submittedContent}</strong><small>{reviews.isLoading || reviews.isError ? "Review status unavailable" : `${rejectedContent} returned for changes`}</small></div></article>
    </div>
    {assignments.isError && <p role="alert" className="admin-v2__inline-notice">{assignments.error instanceof Error ? assignments.error.message : "Assignment data could not be loaded."} <button className="admin-v2__button" type="button" onClick={() => void assignments.refetch()}>Retry</button></p>}
    {reviews.isError && <p role="alert" className="admin-v2__inline-notice">{reviews.error instanceof Error ? reviews.error.message : "Content review data could not be loaded."} <button className="admin-v2__button" type="button" onClick={() => void reviews.refetch()}>Retry</button></p>}
    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar"><div><strong>My courses</strong><span>{courses.length}</span></div><Link className="admin-v2__button" to="/admin/instructor/courses">View all <ArrowRight size={13} /></Link></header>
        {courses.length ? <table className="admin-v2__table"><thead><tr><th>Course</th><th>Brand</th><th>Assignments</th><th>To review</th><th></th></tr></thead><tbody>{courses.map(course => {
          const courseAssignments = items.filter(item => item.brandCourseId === course.id);
          const courseNeedsReview = courseAssignments.reduce((sum, item) => sum + item.needsReviewCount, 0);
          return <tr key={course.id}><td><strong>{course.title}</strong><small>{course.code}</small></td><td>{course.brandName}</td><td>{assignments.isLoading || assignments.isError ? "—" : courseAssignments.length}</td><td>{assignments.isLoading || assignments.isError ? "—" : courseNeedsReview}</td><td><Link className="admin-v2__button" to={`/admin/instructor/courses/${course.id}`}>Open <ArrowRight size={13} /></Link></td></tr>;
        })}</tbody></table> : <div className="admin-v2__empty"><BookOpen size={20} /><strong>No assigned courses yet</strong><span>A Super Admin must link your teaching profile, Brand, and course before the course appears here.</span></div>}
      </section>
      <aside className="admin-v2__inspector">
        <header className="admin-v2__inspector-title"><div><h2>Teaching tasks</h2><small>Current records from the Admin API</small></div></header>
        <div className="admin-v2__access-list">
          <article><ClipboardCheck size={16} /><div><Link to="/admin/instructor/assignments"><strong>Review submissions</strong></Link><small>{assignments.isLoading ? "Loading assignment status…" : assignments.isError ? "Assignment status unavailable" : `${needsReview} submitted response${needsReview === 1 ? "" : "s"} need review`}</small></div><ArrowRight size={14} /></article>
          <article><Files size={16} /><div><Link to="/admin/instructor/content"><strong>Prepare course content</strong></Link><small>{reviews.isLoading ? "Loading review status…" : reviews.isError ? "Content review status unavailable" : `${submittedContent} item${submittedContent === 1 ? "" : "s"} awaiting Super Admin review`}</small></div><ArrowRight size={14} /></article>
          <article><GraduationCap size={16} /><div><Link to="/admin/instructor/assessments"><strong>Manage exams and quizzes</strong></Link><small>Create questions and publish assessments for assigned courses</small></div><ArrowRight size={14} /></article>
        </div>
      </aside>
    </div>
  </section>;
}

export default InstructorOverviewPage;
