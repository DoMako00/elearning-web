import { Skeleton } from "../../../components/ui/Skeleton";
import "./curriculum.css";

/* Same grid and classes as the loaded Curriculum page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function CurriculumSkeleton() {
  return <section className="admin-v2__page admin-v2__curriculum" aria-busy="true" aria-label="Loading curriculum">
    <div className="v2-phase-toolbar">
      <div className="v2-curriculum-summary">{bar(70, 20)}{bar(120, 13)}</div>
      <div className="v2-phase-toolbar__actions"><Skeleton width={290} height={40} borderRadius={10} /><Skeleton width={140} height={40} borderRadius={10} /></div>
    </div>
    <div className="v2-curriculum-grid">
      <section className="v2-phase-panel v2-curriculum-years">
        <header><div>{bar(110, 11)}<div style={{ height: 6 }} />{bar(150, 18)}</div></header>
        <div className="v2-curriculum-year-list">
          <div className="v2-year-item is-selected"><div className="v2-year-item__select">{bar(90, 15)}{bar(150, 12)}</div><Skeleton width={32} height={32} borderRadius={9} /></div>
        </div>
      </section>
      <section className="v2-phase-panel v2-curriculum-structure">
        <header><div>{bar(60, 11)}<div style={{ height: 6 }} />{bar(120, 18)}</div><Skeleton width={130} height={36} borderRadius={9} /></header>
        <div className="v2-semester-list">
          {[0, 1].map(index => <div className="v2-semester is-open" key={index}>
            <header><div className="v2-semester__toggle"><Skeleton width={15} height={15} borderRadius={4} /><span>{bar(100, 15)}<div style={{ height: 5 }} />{bar(60, 12)}</span></div></header>
            {index === 0 && <div className="v2-semester__units">{[0, 1, 2, 3].map(row => <div className="v2-unit-row" key={row}>{bar(52, 12)}<span className="v2-unit-row__title">{bar("62%", 14)}<div style={{ height: 5 }} />{bar("38%", 11)}</span>{bar(58, 22)}<span /></div>)}</div>}
          </div>)}
        </div>
      </section>
      <aside className="v2-phase-panel v2-curriculum-inspector">
        <header><div>{bar(120, 11)}<div style={{ height: 6 }} />{bar(110, 18)}</div></header>
        <div className="v2-unit-inspector__body">
          {bar("60%", 24)}<div style={{ height: 10 }} />{bar("34%", 13)}
          <dl className="v2-detail-grid">{[0, 1, 2, 3, 4].map(row => <div key={row}>{bar(90, 12)}{bar(110, 13)}</div>)}</dl>
        </div>
        <footer className="v2-inspector-actions"><Skeleton width={96} height={38} borderRadius={9} /><Skeleton width={110} height={38} borderRadius={9} /><Skeleton width={96} height={38} borderRadius={9} /></footer>
      </aside>
    </div>
  </section>;
}
