import { Skeleton } from "../../../components/ui/Skeleton";
import "./instructors.css";

/* Same grid and classes as the loaded Instructors page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function InstructorsSkeleton() {
  return <section className="admin-v2__page admin-v2__instructors-page" aria-busy="true" aria-label="Loading instructors">
    <div className="admin-v2__instructor-layout">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar">
          <div style={{ display: "grid", gap: 6 }}>{bar(190, 18)}{bar(80, 12)}</div>
          <Skeleton width={150} height={40} borderRadius={10} />
        </header>
        <div className="admin-v2__table-scroll">
          <div className="admin-v2__instructor-filters"><Skeleton height={40} borderRadius={10} /><Skeleton height={40} borderRadius={10} /><Skeleton height={40} borderRadius={10} /><Skeleton height={40} borderRadius={10} /></div>
          <table className="admin-v2__table admin-v2__instructor-table"><thead><tr><th>Instructor</th><th>Specialties</th><th>Brands</th><th>Active courses</th><th>Status</th><th></th></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5].map(row => <tr key={row}>
              <td><span className="admin-v2__instructor-identity"><Skeleton width={38} height={38} circle /><span style={{ display: "grid", gap: 6 }}>{bar(row % 2 ? 120 : 90, 14)}{bar(150, 11)}</span></span></td>
              <td>{bar(70, 12)}</td><td>{bar(64, 22)}</td><td>{bar(18, 14)}</td><td>{bar(64, 22)}</td><td><Skeleton width={34} height={34} borderRadius={9} /></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__instructor-inspector">
        <header className="admin-v2__instructor-inspector-head">
          <div className="admin-v2__instructor-profile"><Skeleton width={60} height={60} circle /><div style={{ display: "grid", gap: 8 }}>{bar(150, 20)}{bar(70, 22)}{bar(180, 12)}</div></div>
        </header>
        <div className="admin-v2__instructor-tabs" role="presentation">{[0, 1, 2].map(tab => <span key={tab} style={{ display: "grid", placeItems: "center" }}>{bar(64, 14)}</span>)}</div>
        <div style={{ display: "grid", gap: 14, padding: 16 }}>
          <Skeleton height={42} borderRadius={10} />{bar(140, 16)}{bar("100%", 40)}{bar(180, 16)}{bar("100%", 52)}{bar("100%", 52)}
        </div>
      </aside>
    </div>
  </section>;
}
