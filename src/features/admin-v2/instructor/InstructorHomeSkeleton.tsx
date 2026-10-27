import { Skeleton } from "../../../components/ui/Skeleton";
import "./instructor-home.css";

/*
 * Same DOM and classes as the loaded Home page, so the grid never shifts when data arrives.
 * Rendered by the route loading fallback, which sits above MantineProvider: keep Mantine out of this file.
 */
export function HomeCourseSkeleton() {
  return <div className="instructor-home__course instructor-home__course--skeleton instructor-skeleton-card" aria-hidden="true">
    <Skeleton className="instructor-home__skeleton-art" borderRadius={0} />
    <div className="instructor-home__course-body">
      <Skeleton className="instructor-home__skeleton-pill" height={20} width={64} borderRadius={999} />
      <Skeleton className="instructor-home__skeleton-title" height={18} width="78%" borderRadius={4} />
      <Skeleton className="instructor-home__skeleton-status" height={13} width={86} borderRadius={4} />
      <Skeleton className="instructor-home__skeleton-summary" height={12} width="55%" borderRadius={4} />
      <Skeleton className="instructor-home__skeleton-button" borderRadius={8} />
    </div>
  </div>;
}

export function InstructorHomeSkeleton() {
  return <section className="admin-v2__workflow-page instructor-home" aria-busy="true" aria-label="Loading instructor dashboard">
    <div className="instructor-home__hero instructor-skeleton-card">
      <div className="instructor-home__hero-copy">
        <Skeleton className="instructor-home__skeleton-hero-title" height={38} width="72%" borderRadius={4} />
        <Skeleton className="instructor-home__skeleton-hero-title" height={38} width="52%" borderRadius={4} />
        <Skeleton className="instructor-home__skeleton-hero-text" height={16} width="68%" borderRadius={4} />
        <Skeleton className="instructor-home__skeleton-hero-button" height={44} width={170} borderRadius={8} />
      </div>
    </div>

    <div className="instructor-home__next-steps instructor-skeleton-card">
      <Skeleton className="instructor-home__skeleton-heading" height={22} width={120} borderRadius={4} />
      {[0, 1, 2].map(index => <div className="instructor-home__next-step" key={index}>
        <Skeleton height={34} width={34} circle />
        <span className="instructor-home__step-copy instructor-home__step-copy--skeleton"><Skeleton height={15} width="58%" borderRadius={4} /><Skeleton height={12} width="82%" borderRadius={4} /></span>
        <Skeleton height={16} width={16} borderRadius={4} />
      </div>)}
    </div>

    <div className="admin-v2__workflow-metrics instructor-home__metrics instructor-home__metrics--skeleton">
      {[110, 150, 130, 150].map((labelWidth, index) => <div className="admin-v2__workflow-metric instructor-skeleton-card" key={index}>
        <div className="instructor-home__skeleton-metric-row">
          <Skeleton className="instructor-home__skeleton-metric-icon" circle />
          <div className="instructor-home__skeleton-metric-copy">
            <Skeleton className="instructor-home__metric-skeleton" height={28} width={48} borderRadius={4} />
            <Skeleton height={14} width={labelWidth} borderRadius={4} />
          </div>
        </div>
      </div>)}
    </div>

    <section className="instructor-home__courses" aria-label="Loading assigned courses">
      <header className="instructor-home__section-heading"><Skeleton height={22} width={190} borderRadius={4} /><Skeleton height={16} width={110} borderRadius={4} /></header>
      <div className="instructor-home__course-grid">{[0, 1, 2].map(index => <HomeCourseSkeleton key={index} />)}</div>
    </section>

    <div className="instructor-home__teaching-flow instructor-skeleton-card">
      <Skeleton className="instructor-home__skeleton-heading" height={22} width={160} borderRadius={4} />
      <ol>{[0, 1, 2, 3, 4].map(index => <li key={index}>
        <Skeleton className="instructor-home__skeleton-dot" height={20} width={20} circle />
        <div className="instructor-home__skeleton-flow-copy"><Skeleton height={14} width="52%" borderRadius={4} /><Skeleton height={11} width="74%" borderRadius={4} /></div>
      </li>)}</ol>
      <div className="instructor-home__approval-note"><Skeleton height={12} width="62%" borderRadius={4} /></div>
    </div>
  </section>;
}
