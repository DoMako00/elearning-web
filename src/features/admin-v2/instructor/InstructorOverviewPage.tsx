import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, FolderClosed, GraduationCap, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { adminAssignmentsApi } from "../api/adminAssignmentsApi";
import { adminAssessmentApi } from "../api/adminAssessmentApi";
import { listContentReviewRequests } from "../api/adminContentApi";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { getWorkspaceCopy } from "../copy/workspace-copy";
import { instructorCourseArtwork, instructorHeroArtwork } from "./instructor-course-art";
import { HomeCourseSkeleton } from "./InstructorHomeSkeleton";
import "./instructor-home.css";

export function InstructorOverviewPage() {
  const { workspace, domainLoading } = useAdminV2();
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
  const publishedAssessments = assessmentItems.filter((item) => item.status === "published").length;
  const firstCoursePath = courses[0] ? `/admin/instructor/courses/${courses[0].id}` : "/admin/instructor/courses";
  const countLabel = (loading: boolean, error: boolean, value: number) => loading ? "…" : error ? "—" : value.toLocaleString();
  const workflow = [
    { title: "Open course", detail: "Go to your assigned course.", to: firstCoursePath },
    { title: "Build lessons", detail: "Create learning materials and add files.", to: firstCoursePath },
    { title: "Create exams & quizzes", detail: "Design and configure assessments.", to: "/admin/instructor/assessments" },
    { title: "Publish assignments", detail: "Make materials available to students.", to: "/admin/instructor/assignments" },
    { title: "Grade student work", detail: "Review and grade submissions.", to: "/admin/instructor/assignments" },
  ];
  const nextSteps = [
    { title: "Open an assigned course", detail: "Go to your course and explore the structure.", to: firstCoursePath },
    { title: "Build lessons & add files", detail: "Create learning materials and upload files.", to: firstCoursePath },
    { title: "Send files for approval", detail: "Submit your materials for review.", to: firstCoursePath },
  ];

  return <section className="admin-v2__workflow-page instructor-home" aria-label="Instructor dashboard">
    <Card className="instructor-home__hero" withBorder shadow="xs">
      <div className="instructor-home__hero-copy">
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
      <div className="instructor-home__hero-art" aria-hidden="true"><img src={instructorHeroArtwork} alt="" /></div>
    </Card>
    <Card data-instructor-guide-target="home-workflow" className="instructor-home__next-steps" withBorder shadow="xs">
      <h2>Next steps</h2>
      {nextSteps.map((step, index) => <Link className="instructor-home__next-step" key={step.title} to={step.to}><span className="instructor-home__step-number">{index + 1}</span><span className="instructor-home__step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span><ArrowRight size={16} /></Link>)}
    </Card>
    <SimpleGrid data-instructor-guide-target="home-metrics" className="admin-v2__workflow-metrics instructor-home__metrics" cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
      <Metric label="My courses" value={courses.length.toLocaleString()} loading={domainLoading} icon={BookOpen} />
      <Metric label="Assignments to grade" value={countLabel(assignments.isLoading, assignments.isError, needsGrading)} loading={assignments.isLoading} icon={ClipboardCheck} />
      <Metric label="Published exams" value={countLabel(assessments.isLoading, assessments.isError, publishedAssessments)} loading={assessments.isLoading} icon={GraduationCap} />
      <Metric label="Files awaiting approval" value={countLabel(reviews.isLoading, reviews.isError, pendingMaterials)} loading={reviews.isLoading} icon={FolderClosed} />
    </SimpleGrid>
    <section data-instructor-guide-target="home-assigned-courses" className="instructor-home__courses" aria-labelledby="instructor-courses-title">
      <header className="instructor-home__section-heading"><h2 id="instructor-courses-title">Your assigned courses</h2><Button data-instructor-guide-target="home-all-courses" component={Link} to="/admin/instructor/courses" variant="subtle" color="green" rightSection={<ArrowRight size={14} />}>View all courses</Button></header>
      {domainLoading ? <div className="instructor-home__course-grid" role="status" aria-label="Loading assigned courses">{Array.from({ length: Math.min(courses.length || 3, 3) }, (_, index) => <HomeCourseSkeleton key={index} />)}</div> : courses.length ? <div className="instructor-home__course-grid">
        {courses.slice(0, 3).map((course, index) => <Card key={course.id} className="instructor-home__course" withBorder shadow="xs">
          <div className={`instructor-home__course-art is-${index % 3}`}><img src={instructorCourseArtwork(`${course.title} ${course.code}`, index)} alt="" loading="lazy" /></div>
          <div className="instructor-home__course-body"><span className="instructor-home__course-brand">{course.brandName}</span><h3>{course.title}</h3><span className={`instructor-home__course-status is-${course.status}`}>{statusLabel(course.status)}</span>{assignments.isLoading ? <Skeleton className="instructor-home__summary-skeleton" height={12} width="55%" radius="sm" aria-label="Loading assignment activity" /> : <p>{assignmentCourseSummary(assignmentItems, course.id, false, assignments.isError)}</p>}<Button data-instructor-guide-target={index === 0 ? "home-course-card" : undefined} component={Link} to={`/admin/instructor/courses/${course.id}`} variant="light" color="green" fullWidth rightSection={<ArrowRight size={14} />}>{copy.courses.openCourseAction}</Button></div>
        </Card>)}
      </div> : <div data-instructor-guide-target="home-course-card" className="instructor-home__empty"><CheckCircle2 size={22} /><div><strong>No courses assigned yet</strong><p>Ask your administrator to assign a course. It will appear here when it is ready for teaching.</p></div></div>}
    </section>
    <Card data-instructor-guide-target="home-teaching-flow" className="instructor-home__teaching-flow" withBorder shadow="xs">
      <h2>Teaching workflow</h2>
      <ol>{workflow.map((step) => <li key={step.title}><span className="instructor-home__flow-dot" aria-hidden="true" /><Link to={step.to}><strong>{step.title}</strong><small>{step.detail}</small></Link></li>)}</ol>
      <p className="instructor-home__approval-note"><Info size={14} /> Lesson files stay private until approved.</p>
    </Card>
  </section>;
}
function Metric({ label, value, loading = false, icon: Icon }: { label: string; value: string; loading?: boolean; icon: LucideIcon }) {
  return <Card className="admin-v2__workflow-metric" withBorder shadow="xs" p="md"><Group wrap="nowrap"><ThemeIcon color="green" variant="light" size={42} radius="md"><Icon size={19} /></ThemeIcon><Stack gap={2} style={{ minWidth: 0 }}>{loading ? <Skeleton className="instructor-home__metric-skeleton" height={28} width={48} radius="sm" aria-label={`Loading ${label.toLowerCase()}`} /> : <Text className="admin-v2__workflow-metric-value" fw={750} size="xl">{value}</Text>}<Text c="dimmed" size="sm" fw={500}>{label}</Text></Stack></Group></Card>;
}

function statusLabel(status: string) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : "";
}

function assignmentCourseSummary(items: Array<{ brandCourseId: string | null; needsReviewCount: number }>, courseId: string, loading: boolean, error: boolean) {
  if (loading) return "Loading assignment activity…";
  if (error) return "Assignment activity unavailable";
  const courseAssignments = items.filter((item) => item.brandCourseId === courseId);
  const needsReview = courseAssignments.reduce((sum, item) => sum + item.needsReviewCount, 0);
  return `${courseAssignments.length} assignment${courseAssignments.length === 1 ? "" : "s"} · ${needsReview} to grade`;
}

export default InstructorOverviewPage;
