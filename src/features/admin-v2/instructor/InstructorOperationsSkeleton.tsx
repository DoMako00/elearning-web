import { Skeleton } from "../../../components/ui/Skeleton";
import "./instructor-operations.css";
import "./instructor-operations-skeleton.css";

/*
 * Route-level skeletons for Students, Subscriptions and Exams & quizzes. They reuse the loaded pages' classes so the
 * grid is identical. Rendered by the route loading fallback, which sits above MantineProvider: keep Mantine out of here.
 */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

function Heading({ titleWidth, textWidth, buttonWidth }: { titleWidth: number; textWidth: number; buttonWidth: number }) {
  return <div className="instructor-operations__page-heading instructor-ops-skel__heading">
    <div className="instructor-ops-skel__heading-copy">{bar(132, 20)}{bar(titleWidth, 32)}{bar(textWidth, 14)}</div>
    <Skeleton width={buttonWidth} height={44} borderRadius={11} />
  </div>;
}

export function InstructorStudentsSkeleton() {
  return <section className="admin-v2__page admin-v2__instructor-students" aria-busy="true" aria-label="Loading students">
    <Heading titleWidth={150} textWidth={430} buttonWidth={190} />
    <div className="instructor-ops-skel__students-grid">
      <div className="instructor-ops-skel__card admin-v2__instructor-student-create">
        <div className="instructor-ops-skel__row">{bar(18, 18)}{bar(170, 20)}</div>
        {bar("92%", 11)}{bar("68%", 11)}
        {[0, 1, 2].map(index => <div className="instructor-ops-skel__field" key={index}>{bar(96, 12)}<Skeleton height={42} borderRadius={10} /></div>)}
        <Skeleton height={43} borderRadius={10} />
      </div>
      <div className="instructor-ops-skel__card admin-v2__instructor-student-roster">
        <div className="instructor-ops-skel__split instructor-ops-skel__roster-head">
          <div className="instructor-ops-skel__stack">{bar(180, 20)}{bar(300, 11)}</div>
          <Skeleton width={260} height={42} borderRadius={10} />
        </div>
        <div className="instructor-ops-skel__table">
          <div className="instructor-ops-skel__table-head">{[70, 120, 100, 56].map((width, index) => <span key={index}>{bar(width, 10)}</span>)}</div>
          {[0, 1, 2, 3, 4].map(row => <div className="instructor-ops-skel__table-row" key={row}>
            <span className="instructor-ops-skel__stack">{bar(120, 13)}{bar(90, 10)}</span>
            <span>{bar("80%", 11)}</span>
            <span>{bar("70%", 11)}</span>
            <span>{bar(64, 22)}</span>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}

export function InstructorSubscriptionsSkeleton() {
  return <section className="admin-v2__page admin-v2__instructor-subscriptions" aria-busy="true" aria-label="Loading subscriptions">
    <Heading titleWidth={190} textWidth={520} buttonWidth={210} />
    <div className="instructor-ops-skel__notice">{bar(17, 17)}<span className="instructor-ops-skel__stack">{bar(240, 13)}{bar("82%", 11)}</span></div>
    <section className="admin-v2__table-card admin-v2__plans">
      <header><div className="instructor-ops-skel__stack">{bar(190, 18)}{bar(290, 11)}</div></header>
      <div className="admin-v2__plan-grid">
        {[0, 1, 2].map(index => <article key={index} className={index === 0 ? "is-featured" : ""}>
          <Skeleton width={38} height={38} borderRadius={10} />
          <div className="instructor-ops-skel__plan-title">{bar(90, 15)}</div>
          <div className="instructor-ops-skel__stack instructor-ops-skel__plan-copy">{bar("90%", 11)}{bar("60%", 11)}</div>
          {bar(70, 28)}
          <div className="instructor-ops-skel__stack instructor-ops-skel__plan-list">{bar("88%", 10)}{bar("70%", 10)}{index > 0 && bar("82%", 10)}</div>
          <Skeleton height={37} borderRadius={8} />
        </article>)}
      </div>
    </section>
    <div className="instructor-ops-skel__card instructor-operations__request-card">
      <div className="instructor-ops-skel__split instructor-ops-skel__request-head"><div className="instructor-ops-skel__stack">{bar(170, 20)}{bar(240, 11)}</div>{bar(30, 22)}</div>
      <div className="instructor-ops-skel__requests">
        {[0, 1].map(index => <div className="instructor-ops-skel__card instructor-operations__request-item" key={index}>
          <div className="instructor-ops-skel__split"><div className="instructor-ops-skel__stack">{bar(150, 15)}{bar(210, 11)}</div>{bar(110, 22)}</div>
          <div className="instructor-ops-skel__split">{bar(120, 11)}{bar(80, 16)}</div>
        </div>)}
      </div>
    </div>
  </section>;
}

export function InstructorAssessmentsSkeleton() {
  return <section className="admin-v2__page admin-v2__instructor-assessments" aria-busy="true" aria-label="Loading exams and quizzes">
    <header className="admin-v2__page-header"><div className="instructor-ops-skel__stack">{bar(210, 32)}{bar(520, 13)}</div></header>
    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar">
          <div className="instructor-ops-skel__stack">{bar(130, 16)}{bar(80, 11)}</div>
          <div className="admin-v2__table-tools instructor-ops-skel__tools">
            <Skeleton width={132} height={42} borderRadius={10} />
            <Skeleton width={190} height={42} borderRadius={10} />
            <Skeleton width={210} height={42} borderRadius={10} />
            <Skeleton width={118} height={42} borderRadius={10} />
          </div>
        </header>
        <div className="admin-v2__table-scroll">
          <table className="admin-v2__table"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Questions</th><th>Attempts</th></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5].map(row => <tr key={row}><td>{bar(row % 2 ? 190 : 150, 14)}</td><td>{bar(44, 12)}</td><td>{bar(60, 20)}</td><td>{bar(24, 12)}</td><td>{bar(24, 12)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__course-inspector">
        <header className="admin-v2__inspector-title"><div className="instructor-ops-skel__stack">{bar(180, 18)}{bar(130, 11)}</div></header>
        <div className="instructor-ops-skel__inspector-body">
          {[0, 1, 2].map(row => <div className="instructor-ops-skel__split" key={row}>{bar(90, 12)}{bar(110, 12)}</div>)}
          {bar(150, 14)}
          {[0, 1, 2].map(row => <div className="instructor-ops-skel__field" key={row}>{bar(110, 11)}<Skeleton height={38} borderRadius={8} /></div>)}
          <Skeleton height={42} borderRadius={10} />
        </div>
      </aside>
    </div>
  </section>;
}
