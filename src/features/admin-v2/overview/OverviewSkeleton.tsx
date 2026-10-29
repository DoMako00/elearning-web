import { Skeleton } from "../../../components/ui/Skeleton";
import "./admin-overview.css";

/* Same grid and classes as the loaded Super Admin overview. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function OverviewSkeleton() {
  return <section className="admin-v2__page admin-overview-v2" aria-busy="true" aria-label="Loading overview">
    <div className="admin-overview-v2__metrics">
      {[0, 1, 2, 3].map(index => <div key={index} className="admin-overview-v2__metric">
        <Skeleton width={44} height={44} borderRadius={12} />
        <span className="admin-overview-v2__metric-copy">{bar(110, 12)}{bar(52, 28)}{bar(96, 11)}</span>
      </div>)}
    </div>
    <div className="admin-overview-v2__main">
      <section className="admin-overview-v2__card admin-overview-v2__flow">
        <header>{bar(240, 20)}</header>
        <ol>{[0, 1, 2, 3].map(index => <li key={index}><span className="admin-overview-v2__skeleton-row">
          {bar(18, 14)}<Skeleton width={40} height={40} borderRadius={10} />
          <span className="admin-overview-v2__step-copy">{bar("42%", 14)}{bar("72%", 12)}</span>
          {bar(72, 22)}
        </span></li>)}</ol>
      </section>
      <div className="admin-overview-v2__side">
        <section className="admin-overview-v2__card admin-overview-v2__attention">
          <header>{bar(170, 20)}</header>
          <ul>{[0, 1].map(index => <li key={index}><span className="admin-overview-v2__skeleton-row">{bar(17, 17)}{bar("70%", 13)}</span></li>)}</ul>
        </section>
        <section className="admin-overview-v2__card admin-overview-v2__shortcuts">
          <header>{bar(160, 20)}</header>
          <ul>{[0, 1, 2, 3].map(index => <li key={index}><span className="admin-overview-v2__skeleton-row">{bar(17, 17)}{bar("55%", 13)}</span></li>)}</ul>
        </section>
      </div>
    </div>
  </section>;
}
