import { Skeleton } from "../../../components/ui/Skeleton";
import "./admin-split-view.css";

/* Route-level skeletons for Students and Payments: same grid and classes as the loaded pages.
   Rendered above MantineProvider: keep Mantine out of this file. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

function Metrics({ className, cards }: { className: string; cards: number }) {
  return <div className={`admin-v2__metrics ${className}`}>
    {Array.from({ length: cards }, (_, index) => <article key={index} className={className.includes("student") ? "admin-v2__student-stat" : "admin-v2__metric"}>
      <Skeleton width={46} height={46} borderRadius={12} />
      <div style={{ display: "grid", gap: 6 }}>{bar(100, 13)}{bar(56, 26)}{bar(110, 11)}</div>
    </article>)}
  </div>;
}

export function StudentsSkeleton() {
  return <section className="admin-v2__page admin-v2__students" aria-busy="true" aria-label="Loading students">
    <Metrics className="admin-v2__student-metrics" cards={4} />
    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar">
          <div style={{ display: "grid", gap: 6 }}>{bar(90, 18)}{bar(70, 12)}</div>
          <div className="admin-v2__table-tools"><Skeleton width={200} height={40} borderRadius={10} /><Skeleton width={120} height={40} borderRadius={10} /><Skeleton width={110} height={40} borderRadius={10} /><Skeleton width={120} height={40} borderRadius={10} /><Skeleton width={130} height={40} borderRadius={10} /></div>
        </header>
        <div className="admin-v2__table-scroll">
          <table className="admin-v2__table admin-v2__student-table"><thead><tr><th>Student</th><th>Brand</th><th>Academic level</th><th>Semester</th><th>Status</th><th>Devices</th><th>Last activity</th><th>Actions</th></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5, 6, 7].map(row => <tr key={row}>
              <td><span className="admin-v2__student-cell"><Skeleton width={36} height={36} circle />{bar(row % 2 ? 130 : 100, 14)}</span></td>
              <td>{bar(64, 22)}</td><td>{bar(60, 12)}</td><td>{bar(76, 12)}</td><td>{bar(72, 22)}</td><td>{bar(34, 13)}</td><td>{bar(120, 12)}</td><td><Skeleton width={68} height={34} borderRadius={9} /></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__student-inspector">
        <header className="admin-v2__student-head"><Skeleton width={48} height={48} circle /><div style={{ display: "grid", gap: 8 }}>{bar(140, 20)}{bar(170, 12)}</div></header>
        <div className="admin-v2__tabs" role="presentation">{[0, 1, 2, 3].map(tab => <span key={tab} style={{ display: "grid", placeItems: "center" }}>{bar(56, 14)}</span>)}</div>
        <div style={{ display: "grid", gap: 14, padding: 18 }}>{[0, 1, 2, 3, 4, 5, 6].map(row => <div key={row} style={{ display: "flex", justifyContent: "space-between" }}>{bar(110, 13)}{bar(100, 13)}</div>)}</div>
      </aside>
    </div>
  </section>;
}

export function PaymentsSkeleton() {
  return <section className="admin-v2__page admin-v2__payments" aria-busy="true" aria-label="Loading payments">
    <Metrics className="admin-v2__payment-metrics" cards={4} />
    <div className="admin-v2__workgrid has-inspector">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar">
          <div style={{ display: "grid", gap: 6 }}>{bar(120, 18)}{bar(70, 12)}</div>
          <div className="admin-v2__table-tools"><Skeleton width={170} height={40} borderRadius={10} /><Skeleton width={200} height={40} borderRadius={10} /></div>
        </header>
        <div className="admin-v2__table-scroll">
          <table className="admin-v2__table admin-v2__payment-table"><thead><tr><th>Order ID</th><th>Offering</th><th>Brand</th><th>Students</th><th>Seats</th><th>Amount</th><th>Method</th><th>Submitted</th><th>Status</th></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5].map(row => <tr key={row}>
              <td>{bar(66, 14)}</td><td>{bar(190, 12)}</td><td>{bar(64, 22)}</td><td>{bar(14, 12)}</td><td>{bar(14, 12)}</td><td>{bar(84, 12)}</td><td>{bar(46, 12)}</td><td>{bar(72, 12)}</td><td>{bar(88, 22)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__payment-inspector">
        <header className="admin-v2__inspector-title"><div style={{ display: "grid", gap: 7 }}>{bar(130, 16)}{bar(220, 11)}</div>{bar(96, 22)}</header>
        <div style={{ display: "grid", gap: 14, padding: 18 }}>{[0, 1, 2, 3, 4, 5, 6].map(row => <div key={row} style={{ display: "flex", justifyContent: "space-between" }}>{bar(110, 13)}{bar(120, 13)}</div>)}</div>
        <div style={{ display: "grid", gap: 8, padding: 18 }}><Skeleton height={44} borderRadius={10} /><Skeleton height={44} borderRadius={10} /></div>
      </aside>
    </div>
  </section>;
}
