import { Skeleton } from "../../../components/ui/Skeleton";
import "./content-approvals.css";

/* Same grid and classes as the loaded Content approvals page. Rendered above MantineProvider: keep Mantine out. */
const bar = (width: number | string, height = 12) => <Skeleton width={width} height={height} borderRadius={4} />;

export function ContentApprovalsSkeleton({ bare = false }: { bare?: boolean }) {
  const body = <div className="admin-v2__approvals" aria-busy="true" aria-label="Loading content approvals">
      <div className="admin-v2__approvals-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "grid", gap: 8, flex: 1 }}>{bar("62%", 14)}{bar("40%", 14)}</div>
        <Skeleton width={110} height={40} borderRadius={10} />
      </div>
      <div className="admin-v2__approvals-panel" style={{ padding: 16, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><div style={{ display: "grid", gap: 7 }}>{bar(210, 17)}{bar(130, 12)}</div>{bar(90, 24)}</div>
        <div className="admin-v2__approvals-skeleton-grid">{[0, 1].map(index => <div key={index} className="admin-v2__approvals-skeleton-card">
          <div style={{ display: "flex", gap: 12 }}><Skeleton width={42} height={42} borderRadius={10} /><div style={{ display: "grid", gap: 7, flex: 1 }}>{bar("60%", 15)}{bar("40%", 12)}</div></div>
          <div className="admin-v2__approval-meta"><Skeleton height={44} borderRadius={10} /><Skeleton height={44} borderRadius={10} /></div>
          {bar("80%", 12)}<Skeleton height={84} borderRadius={10} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Skeleton width={150} height={42} borderRadius={10} /><Skeleton width={160} height={42} borderRadius={10} /></div>
        </div>)}</div>
      </div>
    </div>;
  return bare ? body : <section className="admin-v2__page admin-v2__approvals-page">{body}</section>;
}
