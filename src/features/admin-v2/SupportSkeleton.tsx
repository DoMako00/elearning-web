import { Skeleton } from "../../components/ui/Skeleton";
import "./support-inbox.css";

/* Same grid and classes as the loaded Support Inbox. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function SupportSkeleton() {
  return <section className="admin-v2__page admin-v2__support-page" aria-busy="true" aria-label="Loading support inbox">
    <div className="admin-v2__support-layout">
      <section className="admin-v2__table-card">
        <header className="admin-v2__table-toolbar">
          <div style={{ display: "grid", gap: 6 }}>{bar(190, 18)}{bar(110, 12)}</div>
          <Skeleton width={110} height={40} borderRadius={10} />
        </header>
        <div className="admin-v2__support-table-wrap">
          <table className="admin-v2__table"><thead><tr><th>Student</th><th>Subject</th><th>Last message</th><th>Updated</th><th>Unread</th></tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5].map(row => <tr key={row}><td>{bar(110, 14)}</td><td>{bar(130, 12)}</td><td>{bar(220, 12)}</td><td>{bar(130, 12)}</td><td>{bar(22, 20)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <aside className="admin-v2__inspector admin-v2__support-inspector">
        <header className="admin-v2__inspector-title"><div style={{ display: "grid", gap: 7 }}>{bar(180, 17)}{bar(130, 12)}</div></header>
        <div className="admin-v2__support-messages">{[0, 1, 2].map(index => <div key={index} style={{ justifySelf: index % 2 ? "end" : "start", width: index % 2 ? "70%" : "85%" }}><Skeleton height={64} borderRadius={12} /></div>)}</div>
      </aside>
    </div>
  </section>;
}
