import { Card, Group, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import "./instructor-home.css";

/** Same DOM and classes as the loaded Home page, so the grid never shifts when data arrives. */
export function HomeCourseSkeleton() {
  return <Card className="instructor-home__course instructor-home__course--skeleton" withBorder shadow="xs" aria-hidden="true">
    <Skeleton className="instructor-home__skeleton-art" radius={0} />
    <div className="instructor-home__course-body">
      <Skeleton className="instructor-home__skeleton-pill" height={20} width={64} radius="xl" />
      <Skeleton className="instructor-home__skeleton-title" height={18} width="78%" radius="sm" />
      <Skeleton className="instructor-home__skeleton-status" height={13} width={86} radius="sm" />
      <Skeleton className="instructor-home__skeleton-summary" height={12} width="55%" radius="sm" />
      <Skeleton className="instructor-home__skeleton-button" radius={8} />
    </div>
  </Card>;
}

export function InstructorHomeSkeleton() {
  return <section className="admin-v2__workflow-page instructor-home" aria-busy="true" aria-label="Loading instructor dashboard">
    <Card className="instructor-home__hero" withBorder shadow="xs">
      <div className="instructor-home__hero-copy">
        <Skeleton className="instructor-home__skeleton-hero-title" height={38} width="72%" radius="sm" />
        <Skeleton className="instructor-home__skeleton-hero-title" height={38} width="52%" radius="sm" />
        <Skeleton className="instructor-home__skeleton-hero-text" height={16} width="68%" radius="sm" />
        <Skeleton className="instructor-home__skeleton-hero-button" height={44} width={170} radius={8} />
      </div>
    </Card>

    <Card className="instructor-home__next-steps" withBorder shadow="xs">
      <Skeleton className="instructor-home__skeleton-heading" height={22} width={120} radius="sm" />
      {[0, 1, 2].map(index => <div className="instructor-home__next-step" key={index}>
        <Skeleton height={34} width={34} circle />
        <span className="instructor-home__step-copy instructor-home__step-copy--skeleton"><Skeleton height={15} width="58%" radius="sm" /><Skeleton height={12} width="82%" radius="sm" /></span>
        <Skeleton height={16} width={16} radius="sm" />
      </div>)}
    </Card>

    <SimpleGrid className="admin-v2__workflow-metrics instructor-home__metrics" cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
      {[110, 150, 130, 150].map((labelWidth, index) => <Card className="admin-v2__workflow-metric" withBorder shadow="xs" p="md" key={index}>
        <Group wrap="nowrap">
          <Skeleton className="instructor-home__skeleton-metric-icon" circle />
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Skeleton className="instructor-home__metric-skeleton" height={28} width={48} radius="sm" />
            <Skeleton height={14} width={labelWidth} radius="sm" />
          </Stack>
        </Group>
      </Card>)}
    </SimpleGrid>

    <section className="instructor-home__courses" aria-label="Loading assigned courses">
      <header className="instructor-home__section-heading"><Skeleton height={22} width={190} radius="sm" /><Skeleton height={16} width={110} radius="sm" /></header>
      <div className="instructor-home__course-grid">{[0, 1, 2].map(index => <HomeCourseSkeleton key={index} />)}</div>
    </section>

    <Card className="instructor-home__teaching-flow" withBorder shadow="xs">
      <Skeleton className="instructor-home__skeleton-heading" height={22} width={160} radius="sm" />
      <ol>{[0, 1, 2, 3, 4].map(index => <li key={index}>
        <Skeleton className="instructor-home__skeleton-dot" height={20} width={20} circle />
        <div className="instructor-home__skeleton-flow-copy"><Skeleton height={14} width="52%" radius="sm" /><Skeleton height={11} width="74%" radius="sm" /></div>
      </li>)}</ol>
      <div className="instructor-home__approval-note"><Skeleton height={12} width="62%" radius="sm" /></div>
    </Card>
  </section>;
}
