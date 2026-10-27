import { Skeleton } from "@mantine/core";
import "./instructor-courses.css";

/** Same DOM and classes as the loaded My courses page, so the grid never shifts when data arrives. */
export function CourseOptionSkeleton() {
  return <div className="instructor-courses-view__course-option instructor-courses-view__course-option--skeleton" role="status" aria-label="Loading assigned course"><Skeleton className="instructor-courses-view__skeleton-thumb" radius="md" /><span><Skeleton height={14} width="78%" radius="sm" /><Skeleton height={11} width="40%" radius="sm" /><Skeleton height={20} width={66} radius="xl" /></span></div>;
}

export function CourseDetailSkeleton() {
  return <section className="instructor-courses-view__detail instructor-courses-view__detail--skeleton" role="status" aria-label="Loading course workspace">
    <article className="instructor-courses-view__hero">
      <div className="instructor-courses-view__hero-copy">
        <div className="instructor-courses-view__badges"><Skeleton height={30} width={70} radius="xl" /><Skeleton height={30} width={88} radius="xl" /></div>
        <Skeleton height={34} width={320} radius="sm" />
        <Skeleton height={16} width={180} radius="sm" />
        <Skeleton height={14} width={110} radius="sm" />
      </div>
      <Skeleton className="instructor-courses-view__hero-action-skeleton" height={50} width={220} radius="md" />
    </article>
    <div className="instructor-courses-view__panels">
      <section className="instructor-courses-view__panel instructor-courses-view__teaching">
        <header><Skeleton height={22} width={150} radius="sm" /></header>
        {[0, 1, 2].map(row => <div className="instructor-courses-view__panel-skeleton" key={row}><Skeleton height={56} width={56} radius="md" /><span><Skeleton height={14} width="46%" radius="sm" /><Skeleton height={12} width="72%" radius="sm" /></span><Skeleton height={18} width={18} radius="sm" /></div>)}
        <div className="instructor-courses-view__note-skeleton"><Skeleton height={13} width="58%" radius="sm" /></div>
      </section>
      <section className="instructor-courses-view__panel instructor-courses-view__assessments">
        <header><Skeleton height={22} width={130} radius="sm" /></header>
        {[0, 1].map(row => <div className="instructor-courses-view__panel-skeleton" key={row}><Skeleton height={56} width={56} radius="md" /><span><Skeleton height={14} width="52%" radius="sm" /><Skeleton height={12} width="80%" radius="sm" /></span><Skeleton height={42} width={row ? 130 : 160} radius="md" /></div>)}
      </section>
    </div>
    <footer className="instructor-courses-view__access"><span><Skeleton height={18} width={110} radius="sm" /><Skeleton height={13} width={260} radius="sm" /></span><Skeleton height={16} width={170} radius="sm" /></footer>
  </section>;
}

export function InstructorCoursesSkeleton() {
  return <main className="instructor-courses-view" aria-busy="true" aria-label="Loading my courses">
    <aside className="instructor-courses-view__picker">
      <header><div><Skeleton height={22} width={84} radius="sm" /><Skeleton height={26} width={30} radius="xl" /></div><Skeleton height={18} width={18} radius="sm" /></header>
      <div className="instructor-courses-view__search"><Skeleton height={16} width={16} circle /><Skeleton height={13} width="52%" radius="sm" /></div>
      <div className="instructor-courses-view__list">{[0, 1, 2].map(index => <CourseOptionSkeleton key={index} />)}</div>
      <footer><Skeleton height={13} width={64} radius="sm" /></footer>
    </aside>
    <CourseDetailSkeleton />
  </main>;
}
