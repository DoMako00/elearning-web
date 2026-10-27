import { Skeleton } from "../../../components/ui/Skeleton";
import "./instructor-courses.css";

/*
 * Same DOM and classes as the loaded My courses page, so the grid never shifts when data arrives.
 * Rendered by the route loading fallback, which sits above MantineProvider: keep Mantine out of this file.
 */
export function CourseOptionSkeleton() {
  return <div className="instructor-courses-view__course-option instructor-courses-view__course-option--skeleton" role="status" aria-label="Loading assigned course"><Skeleton className="instructor-courses-view__skeleton-thumb" borderRadius={8} /><span><Skeleton height={14} width="78%" borderRadius={4} /><Skeleton height={11} width="40%" borderRadius={4} /><Skeleton height={20} width={66} borderRadius={999} /></span></div>;
}

export function CourseDetailSkeleton() {
  return <section className="instructor-courses-view__detail instructor-courses-view__detail--skeleton" role="status" aria-label="Loading course workspace">
    <article className="instructor-courses-view__hero">
      <div className="instructor-courses-view__hero-copy">
        <div className="instructor-courses-view__badges"><Skeleton height={30} width={70} borderRadius={999} /><Skeleton height={30} width={88} borderRadius={999} /></div>
        <Skeleton height={34} width={320} borderRadius={4} />
        <Skeleton height={16} width={180} borderRadius={4} />
        <Skeleton height={14} width={110} borderRadius={4} />
      </div>
      <Skeleton className="instructor-courses-view__hero-action-skeleton" height={50} width={220} borderRadius={8} />
    </article>
    <div className="instructor-courses-view__panels">
      <section className="instructor-courses-view__panel instructor-courses-view__teaching">
        <header><Skeleton height={22} width={150} borderRadius={4} /></header>
        {[0, 1, 2].map(row => <div className="instructor-courses-view__panel-skeleton" key={row}><Skeleton height={56} width={56} borderRadius={8} /><span><Skeleton height={14} width="46%" borderRadius={4} /><Skeleton height={12} width="72%" borderRadius={4} /></span><Skeleton height={18} width={18} borderRadius={4} /></div>)}
        <div className="instructor-courses-view__note-skeleton"><Skeleton height={13} width="58%" borderRadius={4} /></div>
      </section>
      <section className="instructor-courses-view__panel instructor-courses-view__assessments">
        <header><Skeleton height={22} width={130} borderRadius={4} /></header>
        {[0, 1].map(row => <div className="instructor-courses-view__panel-skeleton" key={row}><Skeleton height={56} width={56} borderRadius={8} /><span><Skeleton height={14} width="52%" borderRadius={4} /><Skeleton height={12} width="80%" borderRadius={4} /></span><Skeleton height={42} width={row ? 130 : 160} borderRadius={8} /></div>)}
      </section>
    </div>
    <footer className="instructor-courses-view__access"><span><Skeleton height={18} width={110} borderRadius={4} /><Skeleton height={13} width={260} borderRadius={4} /></span><Skeleton height={16} width={170} borderRadius={4} /></footer>
  </section>;
}

export function InstructorCoursesSkeleton() {
  return <main className="instructor-courses-view" aria-busy="true" aria-label="Loading my courses">
    <aside className="instructor-courses-view__picker">
      <header><div><Skeleton height={22} width={84} borderRadius={4} /><Skeleton height={26} width={30} borderRadius={999} /></div><Skeleton height={18} width={18} borderRadius={4} /></header>
      <div className="instructor-courses-view__search"><Skeleton height={16} width={16} circle /><Skeleton height={13} width="52%" borderRadius={4} /></div>
      <div className="instructor-courses-view__list">{[0, 1, 2].map(index => <CourseOptionSkeleton key={index} />)}</div>
      <footer><Skeleton height={13} width={64} borderRadius={4} /></footer>
    </aside>
    <CourseDetailSkeleton />
  </main>;
}
