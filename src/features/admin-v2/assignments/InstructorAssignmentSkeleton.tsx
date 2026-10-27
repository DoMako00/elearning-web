import { Skeleton } from "@mantine/core";
import "./instructor-assignment-workspace.css";

const bar = (width: string, height = 12) => <Skeleton width={width} height={height} radius="sm" />;

export function InstructorAssignmentSkeleton() {
  return <main className="instructor-assignments instructor-assignments--loading" aria-busy="true" aria-label="Loading assignments and grading">
    <header className="instructor-assignments__heading">
      <div>{bar("150px", 9)}{bar("260px", 23)}{bar("300px", 12)}</div>
      <div className="instructor-assignments__heading-actions">{bar("92px", 36)}{bar("125px", 36)}</div>
    </header>
    <div className="instructor-assignments__tabs">{bar("110px", 34)}{bar("170px", 34)}</div>
    <div className="instructor-assignments__summary instructor-assignments__summary--skeleton">
      {bar("100%", 42)}{bar("100%", 42)}{bar("88%", 28)}{bar("80%", 28)}{bar("100%", 28)}
    </div>
    <div className="instructor-assignments__grading-grid">
      <section className="instructor-assignments__panel instructor-assignments__students">
        <header className="instructor-assignments__panel-heading">{bar("100px", 18)}{bar("180px", 34)}</header>
        <div className="instructor-assignments__skeleton-filters">{bar("100%", 30)}{bar("100%", 30)}{bar("100%", 30)}{bar("100%", 30)}</div>
        <div className="instructor-assignments__student-skeletons">{[0, 1, 2, 3, 4, 5, 6].map(row => <div key={row}><i /><span><b /><small /></span><em /><strong /></div>)}</div>
        <footer className="instructor-assignments__panel-footer">{bar("90px", 12)}{bar("115px", 34)}</footer>
      </section>
      <section className="instructor-assignments__panel instructor-assignments__response">
        <header className="instructor-assignments__response-heading">{bar("140px", 20)}{bar("95px", 13)}</header>
        <div className="instructor-assignments__attachments"><div className="instructor-assignments__attachment">{bar("65%", 14)}{bar("24px", 24)}</div></div>
        <div className="instructor-assignments__response-skeleton"><div>{bar("170px", 15)}{bar("110px", 12)}{bar("70%", 12)}</div><section>{bar("50%", 20)}{bar("92%", 13)}{bar("100%", 9)}{bar("96%", 9)}{bar("88%", 9)}{bar("98%", 9)}{bar("91%", 9)}</section></div>
        <footer className="instructor-assignments__response-footer">{bar("140px", 12)}{bar("85px", 12)}</footer>
      </section>
      <aside className="instructor-assignments__panel instructor-assignments__grade">
        <header className="instructor-assignments__grade-heading">{bar("140px", 19)}{bar("70px", 30)}</header>
        <div className="instructor-assignments__grade-skeleton">{bar("100%", 12)}{bar("78%", 40)}{bar("100%", 12)}{bar("100%", 100)}{bar("100%", 38)}{bar("100%", 12)}{bar("100%", 60)}{bar("100%", 36)}{bar("100%", 42)}</div>
      </aside>
    </div>
  </main>;
}
