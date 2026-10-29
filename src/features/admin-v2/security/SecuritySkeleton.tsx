import { Skeleton } from "../../../components/ui/Skeleton";
import "./security.css";

/* Same grid and classes as the loaded Security page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function SecuritySkeleton() {
  return <section className="admin-v2__page sec-v2" aria-busy="true" aria-label="Loading security">
    <div className="sec-v2__kpis">
      {[0, 1, 2, 3].map(index => <article key={index} className="sec-v2__kpi">
        <Skeleton width={46} height={46} borderRadius={12} />
        <div style={{ display: "grid", gap: 6 }}>{bar(110, 13)}{bar(40, 26)}{bar(140, 11)}</div>
      </article>)}
    </div>
    <div className="sec-v2__grid">
      <section className="sec-v2__card sec-v2__main">
        <header><Skeleton width={300} height={42} borderRadius={11} />{bar(150, 13)}</header>
        <div className="sec-v2__scroll">
          <table className="sec-v2__table"><thead><tr><th>Device</th><th>Student</th><th>Platform</th><th>Last seen</th><th>Status</th><th /></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5].map(row => <tr key={row}>
              <td><span className="sec-v2__device"><Skeleton width={17} height={17} borderRadius={4} /><span style={{ display: "grid", gap: 5 }}>{bar(110, 14)}{bar(130, 11)}</span></span></td>
              <td><div style={{ display: "grid", gap: 5 }}>{bar(110, 14)}{bar(140, 11)}</div></td>
              <td><div style={{ display: "grid", gap: 5 }}>{bar(80, 14)}{bar(60, 11)}</div></td>
              <td>{bar(120, 12)}</td><td>{bar(64, 22)}</td><td><Skeleton width={96} height={32} borderRadius={9} /></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="sec-v2__card sec-v2__actions">
        <header>{bar(80, 17)}</header>
        <div className="sec-v2__target"><Skeleton width={40} height={40} circle /><div style={{ display: "grid", gap: 6 }}>{bar(120, 14)}{bar(180, 11)}</div></div>
        <ul>{[0, 1, 2, 3].map(index => <li key={index}><Skeleton height={54} borderRadius={11} /></li>)}</ul>
      </aside>
    </div>
  </section>;
}
