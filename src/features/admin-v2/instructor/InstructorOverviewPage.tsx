import { useQuery } from "@tanstack/react-query";
import { Alert, Badge, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { AlertCircle, ArrowUpRight, BookOpen, CheckCircle2, ClipboardCheck, FileCheck2, GraduationCap, Layers3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { adminAssignmentsApi } from "../api/adminAssignmentsApi";
import { adminAssessmentApi } from "../api/adminAssessmentApi";
import { listContentReviewRequests } from "../api/adminContentApi";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { WorkspaceWorkflow } from "../shared/WorkspaceWorkflow";
import { getWorkspaceCopy } from "../copy/workspace-copy";

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
    { title: "Build lessons and add files", detail: "Create chapters and lessons, upload videos or PDFs, then send them for approval.", action: courses.length ? copy.courses.openCourseAction : "View course access", to: firstCoursePath, icon: Layers3 },
    { title: "Create exams and quizzes", detail: "Add questions, set availability, and publish assessments to your course.", action: "Manage exams", to: "/admin/instructor/assessments", icon: GraduationCap },
    { title: "Publish assignments", detail: "Create coursework and publish it directly to students in your course.", action: "Manage assignments", to: "/admin/instructor/assignments", icon: FileCheck2 },
    { title: "Grade student work", detail: "Review submitted answers, leave feedback, and record grades.", action: "Open submissions", to: "/admin/instructor/assignments", icon: ClipboardCheck },
  ];

  return (
    <section className="admin-v2__page admin-v2__workflow-page" aria-label="Instructor dashboard">
      <Card className="admin-v2__workflow-welcome" withBorder shadow="xs" p="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={5}>
            <Badge color="green" variant="light" w="fit-content">{copy.topbar.kicker.toUpperCase()}</Badge>
            <Title order={1}>Your teaching, one step at a time</Title>
            <Text c="dimmed" size="sm">Build course lessons, publish assessments, and support your students from your assigned courses.</Text>
          </Stack>
          <ThemeIcon className="admin-v2__workflow-welcome-icon" color="green" variant="light" size={58} radius="xl"><GraduationCap size={28} /></ThemeIcon>
        </Group>
      </Card>

      <SimpleGrid className="admin-v2__workflow-metrics" cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
        <Metric label="My courses" value={courses.length.toLocaleString()} note="Assigned by your administrator" icon={BookOpen} />
        <Metric label="Assignments to grade" value={countLabel(assignments.isLoading, assignments.isError, needsGrading)} note="Submitted student work" icon={ClipboardCheck} />
        <Metric label="Published exams" value={countLabel(assessments.isLoading, assessments.isError, publishedAssessments)} note="Available to your students" icon={GraduationCap} />
        <Metric label={copy.content.materialsInReview} value={countLabel(reviews.isLoading, reviews.isError, pendingMaterials)} note={reviews.isError ? "Review status unavailable" : returnedMaterials ? `${returnedMaterials} returned with notes` : copy.content.waitingForAdminApproval} icon={FileCheck2} />
      </SimpleGrid>

      {(assignments.isError || assessments.isError || reviews.isError) && <Alert color="red" variant="light" icon={<AlertCircle size={17} />} title="Some teaching records could not be loaded">
        <Group gap="xs" mt={5}>
          {assignments.isError && <Button size="xs" variant="subtle" onClick={() => void assignments.refetch()}>Retry assignments</Button>}
          {assessments.isError && <Button size="xs" variant="subtle" onClick={() => void assessments.refetch()}>Retry exams</Button>}
          {reviews.isError && <Button size="xs" variant="subtle" onClick={() => void reviews.refetch()}>Retry content status</Button>}
        </Group>
      </Alert>}

      <WorkspaceWorkflow
        eyebrow="YOUR TEACHING FLOW"
        title="From course content to student feedback"
        description="Follow the course tasks in order. Lesson files stay private until they are approved; assignments and exams can be published by you."
        steps={workflow}
      />

      <section className="admin-v2__instructor-courses" aria-labelledby="instructor-courses-title">
        <Group justify="space-between" align="center" mb="sm">
          <div><Title id="instructor-courses-title" order={3}>Your assigned courses</Title><Text c="dimmed" size="xs">Open a course to build its lessons and learning materials.</Text></div>
          <Button component={Link} to="/admin/instructor/courses" variant="light" color="green" rightSection={<ArrowUpRight size={14} />}>All courses</Button>
        </Group>
        {courses.length ? <SimpleGrid className="admin-v2__instructor-courses-grid" cols={{ base: 1, sm: 2, xl: 3 }} spacing="sm">
          {courses.map((course) => <Card key={course.id} className="admin-v2__instructor-course-card" withBorder shadow="xs" p="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <ThemeIcon color="green" variant="light" size={40} radius="md"><BookOpen size={19} /></ThemeIcon>
              <Badge variant="light" color="green">{course.status}</Badge>
            </Group>
            <Stack gap={5} mt="md" mb="md">
              <Text c="dimmed" size="xs" fw={650}>{course.brandName} · {course.code}</Text>
              <Text fw={700} size="sm">{course.title}</Text>
              <Text c="dimmed" size="xs">{assignmentCourseSummary(assignmentItems, course.id, assignments.isLoading, assignments.isError)}</Text>
            </Stack>
            <Button component={Link} to={`/admin/instructor/courses/${course.id}`} color="green" variant="light" fullWidth rightSection={<ArrowUpRight size={14} />}>{copy.courses.openCourseAction}</Button>
          </Card>)}
        </SimpleGrid> : <Card className="admin-v2__instructor-empty" withBorder shadow="xs" p="lg">
          <ThemeIcon color="green" variant="light" size={46} radius="xl"><CheckCircle2 size={21} /></ThemeIcon>
          <Stack gap={4}>
            <Text fw={700}>No courses are assigned yet</Text>
            <Text c="dimmed" size="sm">Ask your administrator to link your teaching profile to a course. Once assigned, it will appear here and in My Courses.</Text>
          </Stack>
        </Card>}
      </section>
    </section>
  );
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
