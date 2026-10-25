import { Badge, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { ArrowUpRight, BookOpen, CreditCard, FileCheck2, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminV2DomainStatus, useAdminV2 } from "../layout/AdminV2Layout";
import { WorkspaceWorkflow } from "../shared/WorkspaceWorkflow";

const workflow = [
  { title: "Set the curriculum", detail: "Confirm the university, year, semester, and approved subjects first.", action: "Open curriculum", to: "/admin/curriculum", icon: BookOpen },
  { title: "Set up a course", detail: "Create the brand course, map it to a subject, and assign its instructor.", action: "Set up courses", to: "/admin/courses", icon: GraduationCap },
  { title: "Review lesson files", detail: "Approve or return instructor videos and PDFs before students can access them.", action: "Review submissions", to: "/admin/content", icon: FileCheck2 },
  { title: "Manage people and access", detail: "Create instructor credentials and manage student accounts, seats, and access.", action: "Manage people", to: "/admin/instructors", icon: UsersRound },
];

export function OverviewPage() {
  const { overview, domainLoading } = useAdminV2();
  const counts = overview?.counts;
  const metrics = [
    { label: "Student accounts", value: counts?.totalStudents, note: counts ? `${counts.activeStudents} active` : "Current records unavailable", icon: UsersRound },
    { label: "Published courses", value: counts?.publishedCourses, note: "Available in course catalogue", icon: BookOpen },
    { label: "Content awaiting review", value: counts?.contentAwaitingRelease, note: "Instructor submissions", icon: FileCheck2 },
    { label: "Payments to review", value: counts?.pendingPaymentReviews, note: "Pending payment decisions", icon: CreditCard },
  ];

  return (
    <section className="admin-v2__page admin-v2__workflow-page" aria-label="Super Admin overview">
      <AdminV2DomainStatus />
      <Card className="admin-v2__workflow-welcome" withBorder shadow="xs" p="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Stack gap={5}>
            <Badge color="green" variant="light" w="fit-content">SUPER ADMIN · PLATFORM OPERATIONS</Badge>
            <Title order={1}>Your platform, in clear steps</Title>
            <Text c="dimmed" size="sm">Set up the academic structure, open courses for instructors, then review learning content before release.</Text>
          </Stack>
          <ThemeIcon className="admin-v2__workflow-welcome-icon" color="green" variant="light" size={58} radius="xl"><ShieldCheck size={28} /></ThemeIcon>
        </Group>
      </Card>

      <SimpleGrid className="admin-v2__workflow-metrics" cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <Card key={metric.label} className="admin-v2__workflow-metric" withBorder shadow="xs" p="md">
            <Group wrap="nowrap" align="center">
              <ThemeIcon color="green" variant="light" size={42} radius="md"><Icon size={19} /></ThemeIcon>
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Text c="dimmed" size="xs" fw={600}>{metric.label}</Text>
                <Text className="admin-v2__workflow-metric-value" fw={750} size="xl">{metric.value === undefined ? (domainLoading ? "…" : "—") : metric.value.toLocaleString()}</Text>
                <Text c="dimmed" size="xs">{metric.note}</Text>
              </Stack>
            </Group>
          </Card>;
        })}
      </SimpleGrid>

      <WorkspaceWorkflow
        eyebrow="RECOMMENDED WORKFLOW"
        title="Run a course from setup to release"
        description="The day-to-day teaching work stays with the assigned instructor. Your role is to configure access and approve course materials."
        steps={workflow}
      />

      <Card className="admin-v2__workflow-quick-access" withBorder shadow="xs" p="md">
        <Group justify="space-between" align="center" mb="sm">
          <div><Title order={3}>Platform operations</Title><Text c="dimmed" size="xs">Other workspace tasks</Text></div>
          <Badge variant="light" color="gray">Super Admin</Badge>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs">
          <QuickLink to="/admin/instructors" title="Instructor accounts" detail="Profiles, credentials, and course assignment" />
          <QuickLink to="/admin/students" title="Student access" detail="Account, enrollment, device, and seat records" />
          <QuickLink to="/admin/payments" title="Payments" detail="Orders and payment review status" />
          <QuickLink to="/admin/security" title="Security" detail="Persisted security events and sessions" />
        </SimpleGrid>
      </Card>
    </section>
  );
}

function QuickLink({ to, title, detail }: { to: string; title: string; detail: string }) {
  return <Link className="admin-v2__workflow-quick-link" to={to}><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>;
}

export default OverviewPage;
