import { Skeleton } from "../../../components/ui/Skeleton";
import "./courses.css";

/* Same grid and classes as the loaded Course setup page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function CoursesSkeleton() {
  return <section className="admin-v2__page admin-v2__courses" aria-busy="true" aria-label="Loading courses">
    <div className="admin-v2__filterbar">
      {[0, 1, 2, 3, 4].map(index => <div className="admin-v2__filter-field" key={index}>{bar(70, 12)}<Skeleton height={40} borderRadius={10} /></div>)}
    </div>
    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar">
          <div style={{ display: "grid", gap: 6 }}>{bar(90, 18)}{bar(70, 12)}</div>
          <div className="admin-v2__table-tools"><Skeleton width={230} height={40} borderRadius={10} /><Skeleton width={130} height={40} borderRadius={10} /><Skeleton width={130} height={40} borderRadius={10} /></div>
        </header>
        <div className="admin-v2__table-scroll">
          <table className="admin-v2__table"><thead><tr><th>Course title</th><th>Brand</th><th>Scope</th><th>Linked subject / module</th><th>Instructor</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5, 6, 7].map(row => <tr key={row}>
              <td>{bar(row % 2 ? 150 : 120, 14)}</td><td>{bar(64, 22)}</td><td>{bar(70, 12)}</td><td>{bar(150, 12)}</td>
              <td><span className="admin-v2__instructor-cell"><Skeleton width={30} height={30} circle />{bar(80, 12)}</span></td>
              <td>{bar(72, 22)}</td><td>{bar(66, 12)}</td><td><Skeleton width={34} height={34} borderRadius={9} /></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__course-inspector">
        <header className="admin-v2__inspector-head">{bar(120, 14)}</header>
        <div className="admin-v2__course-summary">
          <Skeleton height={104} borderRadius={12} />
          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>{bar("80%", 20)}<div style={{ display: "flex", gap: 6 }}>{bar(78, 26)}{bar(60, 26)}</div></div>
        </div>
        <div style={{ display: "grid", gap: 14, padding: 16 }}>{[0, 1, 2, 3, 4, 5].map(row => <div key={row} style={{ display: "flex", justifyContent: "space-between" }}>{bar(90, 13)}{bar(110, 13)}</div>)}</div>
      </aside>
    </div>
  </section>;
}
