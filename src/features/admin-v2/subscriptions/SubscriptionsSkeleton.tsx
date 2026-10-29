import { Skeleton } from "../../../components/ui/Skeleton";
import "../shared/admin-split-view.css";
import "./subscriptions.css";

/* Same grid and classes as the loaded Subscriptions page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function SubscriptionsSkeleton() {
  return <section className="admin-v2__page admin-v2__subscriptions" aria-busy="true" aria-label="Loading subscriptions">
    <div className="admin-v2__metrics admin-v2__subscription-metrics">
      {[0, 1, 2, 3, 4].map(index => <article key={index} className="admin-v2__metric">
        <Skeleton width={46} height={46} borderRadius={12} />
        <div style={{ display: "grid", gap: 6 }}>{bar(110, 13)}{bar(48, 26)}{bar(100, 11)}</div>
      </article>)}
    </div>
    <div className="admin-v2__subscription-actions-row">
      <section className="admin-v2__plan-strip">
        <div style={{ display: "grid", gap: 6 }}>{bar(110, 16)}{bar(200, 12)}</div>
        <div className="admin-v2__plan-pills">{[0, 1, 2].map(index => <Skeleton key={index} width={130} height={44} borderRadius={12} />)}</div>
      </section>
      <Skeleton width={190} height={56} borderRadius={14} />
    </div>
    <div className="admin-v2__subscription-layout">
      <div className="admin-v2__subscription-main">
        <section className="admin-v2__table-card">
          <header className="admin-v2__table-toolbar">
            <div style={{ display: "grid", gap: 6 }}>{bar(130, 18)}{bar(60, 12)}</div>
            <div className="admin-v2__table-tools"><Skeleton width={150} height={40} borderRadius={10} /><Skeleton width={170} height={40} borderRadius={10} /></div>
          </header>
          <div className="admin-v2__table-scroll">
            <table className="admin-v2__table admin-v2__subscription-table"><thead><tr><th>Owner</th><th>Offering</th><th>Plan</th><th>Seats</th><th>Status</th><th>Start</th><th>End</th><th>Access</th></tr></thead>
              <tbody>{[0, 1, 2, 3, 4].map(row => <tr key={row}>
                <td><span className="admin-v2__owner-cell"><Skeleton width={34} height={34} circle /><span style={{ display: "grid", gap: 5 }}>{bar(110, 14)}{bar(56, 10)}</span></span></td>
                <td>{bar(190, 12)}</td><td>{bar(64, 12)}</td><td>{bar(34, 12)}</td><td>{bar(66, 22)}</td><td>{bar(70, 12)}</td><td>{bar(70, 12)}</td><td>{bar(60, 12)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
      <aside className="admin-v2__inspector admin-v2__subscription-inspector">
        <header className="admin-v2__inspector-title"><div style={{ display: "grid", gap: 7 }}>{bar(150, 16)}{bar(230, 11)}</div>{bar(70, 22)}</header>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}><Skeleton width={42} height={42} circle /><div style={{ display: "grid", gap: 7 }}>{bar(120, 16)}{bar(180, 12)}</div></div>
        <div style={{ display: "grid", gap: 14, padding: "4px 18px 18px" }}>{[0, 1, 2, 3, 4, 5].map(row => <div key={row} style={{ display: "flex", justifyContent: "space-between" }}>{bar(100, 13)}{bar(120, 13)}</div>)}</div>
      </aside>
    </div>
  </section>;
}
