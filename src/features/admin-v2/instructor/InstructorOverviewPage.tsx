import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { AlertCircle, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ClipboardCheck, FileCheck2, GraduationCap, Layers3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { adminAssignmentsApi } from "../api/adminAssignmentsApi";
import { adminAssessmentApi } from "../api/adminAssessmentApi";
import { listContentReviewRequests } from "../api/adminContentApi";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { getWorkspaceCopy } from "../copy/workspace-copy";
import "./instructor-home.css";

export function InstructorOverviewPage() {
  const { workspace } = useAdminV2();
  const copy = getWorkspaceCopy(workspace.workspace);
  const assignments = useQuery({ queryKey: ["instructor", "assignments"], queryFn: ({ signal }) => adminAssignmentsApi.list(signal) });
  const assessments = useQuery({ queryKey: ["instructor", "assessments"], queryFn: ({ signal }) => adminAssessmentApi.list(signal) });
  const reviews = useQuery({ queryKey: ["instructor", "content-review-requests"], queryFn: ({ signal }) => listContentReviewRequests(signal) });
  const courses = workspace.courses;
  const assignmentItems = assignments.data?.items ?? [];
  const assessmentItems = assessments.data?.items ?? [];
  const reviewItems = reviews.data?.items ?? [];
  const needsGrading = assignmentItems.reduce((sum, item) => sum + item.needsReviewCount, 0);
  const pendingMaterials = reviewItems.filter((item) => item.status === "submitted").length;
  const returnedMaterials = reviewItems.filter((item) => item.status === "rejected").length;
  const publishedAssessments = assessmentItems.filter((item) => item.status === "published").length;
  const firstCoursePath = courses[0] ? `/admin/instructor/courses/${courses[0].id}` : "/admin/instructor/courses";
  const countLabel = (loading: boolean, error: boolean, value: number) => loading ? "…" : error ? "—" : value.toLocaleString();
  const workflow = [
    { title: "Open an assigned course", detail: courses.length ? "Choose a course you are responsible for." : "An administrator assigns courses to your teaching account.", action: "View my courses", to: "/admin/instructor/courses", icon: BookOpen },
    { title: "Create student accounts", detail: "Add students to your assigned courses. Payment approval stays with the Super Admin.", action: "Manage students", to: "/admin/instructor/students", icon: GraduationCap },
    { title: "Submit a purchase request", detail: "Choose a matching subscription offer and record payment details for Super Admin review.", action: "Open subscriptions", to: "/admin/instructor/subscriptions", icon: FileCheck2 },
    { title: "Build lessons and add files", detail: "Create chapters and lessons, upload videos or PDFs, then send them for approval.", action: courses.length ? copy.courses.openCourseAction : "View course access", to: firstCoursePath, icon: Layers3 },
    { title: "Create exams and quizzes", detail: "Add questions, set availability, and publish assessments to your course.", action: "Manage exams", to: "/admin/instructor/assessments", icon: GraduationCap },
    { title: "Publish assignments", detail: "Create coursework and publish it directly to students in your course.", action: "Manage assignments", to: "/admin/instructor/assignments", icon: FileCheck2 },
    { title: "Grade student work", detail: "Review submitted answers, leave feedback, and record grades.", action: "Open submissions", to: "/admin/instructor/assignments", icon: ClipboardCheck },
  ];

  return <section className="admin-v2__workflow-page instructor-home" aria-label="Instructor dashboard">
    <Card className="instructor-home__hero" withBorder shadow="xs">
      <div className="instructor-home__hero-copy">
        <span className="instructor-home__eyebrow">TEACHING WORKSPACE</span>
        <h2>Your teaching,<br />one step at a time.</h2>
        <p>Build lessons, publish assessments, and support your students.</p>
        <Button component={Link} to="/admin/instructor/courses" color="green" rightSection={<ArrowRight size={16} />}>View my courses</Button>
        {(assignments.isError || assessments.isError || reviews.isError) && <Alert className="instructor-home__error" color="red" variant="light" icon={<AlertCircle size={15} />} title="Some teaching records could not be loaded">
          <Group gap="xs" mt={4}>
            {assignments.isError && <Button size="xs" variant="subtle" onClick={() => void assignments.refetch()}>Retry assignments</Button>}
            {assessments.isError && <Button size="xs" variant="subtle" onClick={() => void assessments.refetch()}>Retry exams</Button>}
            {reviews.isError && <Button size="xs" variant="subtle" onClick={() => void reviews.refetch()}>Retry content status</Button>}
          </Group>
        </Alert>}
      </div>
      <div className="instructor-home__hero-art" aria-hidden="true"><div className="instructor-home__art-orbit" /><div className="instructor-home__art-glow" /><BookOpen size={132} strokeWidth={1.05} /><GraduationCap size={46} strokeWidth={1.2} /></div>
    </Card>
    <Card data-instructor-guide-target="home-workflow" className="instructor-home__next-steps" withBorder shadow="xs">
      <header><span>START HERE</span><h2>Next steps</h2></header>
      {workflow.slice(0, 3).map((step, index) => <Link className="instructor-home__next-step" key={step.title} to={step.to}><span className="instructor-home__step-number">{index + 1}</span><span className="instructor-home__step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span><ArrowRight size={16} /></Link>)}
    </Card>
    <SimpleGrid data-instructor-guide-target="home-metrics" className="admin-v2__workflow-metrics instructor-home__metrics" cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
      <Metric label="My courses" value={courses.length.toLocaleString()} note="Assigned courses" icon={BookOpen} />
      <Metric label="Assignments to grade" value={countLabel(assignments.isLoading, assignments.isError, needsGrading)} note="Student submissions" icon={ClipboardCheck} />
      <Metric label="Published exams" value={countLabel(assessments.isLoading, assessments.isError, publishedAssessments)} note="Available to students" icon={GraduationCap} />
      <Metric label={copy.content.materialsInReview} value={countLabel(reviews.isLoading, reviews.isError, pendingMaterials)} note={reviews.isError ? "Review status unavailable" : returnedMaterials ? `${returnedMaterials} returned with notes` : copy.content.waitingForAdminApproval} icon={FileCheck2} />
    </SimpleGrid>
    <section data-instructor-guide-target="home-assigned-courses" className="instructor-home__courses" aria-labelledby="instructor-courses-title">
      <header className="instructor-home__section-heading"><div><span>YOUR TEACHING SPACE</span><h2 id="instructor-courses-title">Assigned courses</h2></div><Button data-instructor-guide-target="home-all-courses" component={Link} to="/admin/instructor/courses" variant="subtle" color="green" rightSection={<ArrowUpRight size={14} />}>View all</Button></header>
      {courses.length ? <div className="instructor-home__course-grid" style={{ gridTemplateColumns: `repeat(${Math.min(courses.length, 3)}, minmax(0, 1fr))` }}>
        {courses.slice(0, 3).map((course, index) => <Card key={course.id} className="instructor-home__course" withBorder shadow="xs">
          <div className={`instructor-home__course-art is-${index % 3}`}><BookOpen size={34} strokeWidth={1.3} /><span>{course.brandName}</span></div>
          <div className="instructor-home__course-body"><span className="instructor-home__course-code">{course.code} · {course.status}</span><h3>{course.title}</h3><p>{assignmentCourseSummary(assignmentItems, course.id, assignments.isLoading, assignments.isError)}</p><Button data-instructor-guide-target={index === 0 ? "home-course-card" : undefined} component={Link} to={`/admin/instructor/courses/${course.id}`} variant="light" color="green" fullWidth rightSection={<ArrowRight size={14} />}>{copy.courses.openCourseAction}</Button></div>
        </Card>)}
      </div> : <div data-instructor-guide-target="home-course-card" className="instructor-home__empty"><CheckCircle2 size={22} /><div><strong>No courses assigned yet</strong><p>Ask your administrator to assign a course. It will appear here when it is ready for teaching.</p></div></div>}
    </section>
    <Card data-instructor-guide-target="home-teaching-flow" className="instructor-home__teaching-flow" withBorder shadow="xs">
      <header><span>YOUR ROUTINE</span><h2>Teaching workflow</h2></header>
      <ol>{workflow.map((step, index) => { const Icon = step.icon; return <li key={step.title}><span className="instructor-home__flow-icon"><Icon size={15} /></span><Link to={step.to}><strong>{step.title}</strong><small>{step.detail}</small></Link><span className="instructor-home__flow-index">0{index + 1}</span></li>; })}</ol>
      <p className="instructor-home__approval-note"><FileCheck2 size={14} /> Lesson files stay private until approved.</p>
    </Card>
  </section>;
}
function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: LucideIcon }) {
  return <Card className="admin-v2__workflow-metric" withBorder shadow="xs" p="md"><Group wrap="nowrap"><ThemeIcon color="green" variant="light" size={42} radius="md"><Icon size={19} /></ThemeIcon><Stack gap={2} style={{ minWidth: 0 }}><Text c="dimmed" size="xs" fw={600}>{label}</Text><Text className="admin-v2__workflow-metric-value" fw={750} size="xl">{value}</Text><Text c="dimmed" size="xs">{note}</Text></Stack></Group></Card>;
}

function assignmentCourseSummary(items: Array<{ brandCourseId: string | null; needsReviewCount: number }>, courseId: string, loading: boolean, error: boolean) {
  if (loading) return "Loading assignment activity…";
  if (error) return "Assignment activity unavailable";
  const courseAssignments = items.filter((item) => item.brandCourseId === courseId);
  const needsReview = courseAssignments.reduce((sum, item) => sum + item.needsReviewCount, 0);
  return `${courseAssignments.length} assignment${courseAssignments.length === 1 ? "" : "s"} · ${needsReview} to grade`;
}

export default InstructorOverviewPage;
