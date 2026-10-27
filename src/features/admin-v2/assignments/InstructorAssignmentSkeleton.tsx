import "./instructor-assignment-workspace.css";

const bar = (width: string, height = 12, radius?: number) => <span className="instructor-assignments__skeleton-block" style={{ width, height, borderRadius: radius }} aria-hidden="true" />;

export function StudentListSkeleton() {
  return <div className="instructor-assignments__student-skeletons" role="status" aria-label="Loading students">{[0, 1, 2, 3, 4, 5].map(row => <div className="instructor-assignments__student-row" key={row}><span className="instructor-assignments__student-name">{bar("62%", 14)}{bar("34%", 11)}</span>{bar("86px", 26, 999)}{bar("48px", 14)}{bar("14px", 14)}</div>)}</div>;
}

export function ResponseSkeleton() {
  return <div className="instructor-assignments__response-skeleton" role="status" aria-label="Loading submission">
    <header className="instructor-assignments__response-heading"><div>{bar("150px", 24)}{bar("60px", 14)}{bar("72px", 26, 999)}</div><div>{bar("70px", 11)}{bar("110px", 14)}</div></header>
    <div className="instructor-assignments__attachments"><div className="instructor-assignments__attachment">{bar("20px", 20)}{bar("48%", 14)}</div></div>
    <div className="instructor-assignments__report-scroll"><article className="instructor-assignments__report">{bar("42%", 22)}{bar("30%", 12)}{bar("100%", 10)}{bar("96%", 10)}{bar("90%", 10)}{bar("98%", 10)}{bar("84%", 10)}{bar("92%", 10)}</article></div>
  </div>;
}

export function InstructorAssignmentSkeleton() {
  return <main className="instructor-assignments instructor-assignments--loading" aria-busy="true" aria-label="Loading assignments and grading">
    <div className="instructor-assignments__tabs"><div className="instructor-assignments__tablist">{bar("100px", 22)}{bar("160px", 22)}</div><div className="instructor-assignments__tabs-actions">{bar("100px", 40, 10)}{bar("130px", 40, 10)}</div></div>
    <div className="instructor-assignments__summary">
      <div>{bar("56px", 12)}{bar("100%", 42, 10)}</div><div>{bar("76px", 12)}{bar("100%", 42, 10)}</div><div className="instructor-assignments__summary-detail">{bar("22px", 22)}{bar("90px", 28)}</div><div className="instructor-assignments__summary-detail">{bar("48px", 14)}{bar("84px", 26, 999)}</div><div className="instructor-assignments__summary-detail">{bar("100%", 16)}</div>
    </div>
    <div className="instructor-assignments__grading-grid">
      <section className="instructor-assignments__panel instructor-assignments__students">
        <header className="instructor-assignments__panel-heading">{bar("110px", 24)}{bar("220px", 42, 10)}</header>
        <div className="instructor-assignments__filters">{bar("64px", 36, 999)}{bar("90px", 36, 999)}{bar("86px", 36, 999)}{bar("120px", 36, 999)}</div>
        <div className="instructor-assignments__student-scroll"><StudentListSkeleton /></div>
        <footer className="instructor-assignments__panel-footer">{bar("110px", 14)}{bar("140px", 42, 10)}</footer>
      </section>
      <section className="instructor-assignments__panel instructor-assignments__response"><ResponseSkeleton /></section>
      <aside className="instructor-assignments__panel instructor-assignments__grade">
        <header className="instructor-assignments__grade-heading"><div>{bar("170px", 24)}{bar("90px", 13)}</div><div className="instructor-assignments__row-navigation">{bar("40px", 40, 10)}{bar("40px", 40, 10)}</div></header>
        <div className="instructor-assignments__grade-form"><div className="instructor-assignments__grade-fields">{bar("46px", 13)}{bar("100%", 44, 10)}{bar("64px", 13)}{bar("100%", 130, 10)}{bar("100%", 44, 10)}</div>{bar("100%", 48, 10)}</div>
      </aside>
    </div>
  </main>;
}
