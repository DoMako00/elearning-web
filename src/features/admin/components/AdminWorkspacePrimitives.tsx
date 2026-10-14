import { Inbox, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function WorkspaceMetric({ title, value, note, icon: Icon }: { title: string; value: string | number; note: string; icon: LucideIcon }) {
  return <article className="admin-workspace-metric"><span className="admin-workspace-metric__icon"><Icon aria-hidden="true" /></span><div><span>{title}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
export function WorkspaceCard({ title, children, className = "", aside }: { title: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return <section className={`admin-workspace-card ${className}`}><header><h2>{title}</h2>{aside}</header>{children}</section>;
}
export function WorkspaceState({ loading, error, title = "No records yet", onRetry }: { loading?: boolean; error?: boolean; title?: string; onRetry?: () => void }) {
  return <div className="admin-workspace-state" role="status"><span><Inbox aria-hidden="true" /></span><h3>{loading ? "Loading records…" : error ? "Records unavailable" : title}</h3><p>{loading ? "Retrieving the selected brand’s records." : error ? "This view cannot retrieve records from the current data source. No totals or records have been substituted." : "Available records will appear here for the selected brand."}</p>{error && onRetry && <button type="button" onClick={onRetry}><RefreshCw aria-hidden="true" />Try again</button>}</div>;
}
export function WorkspaceBadge({ value }: { value: string }) {
  const tone = ["active", "confirmed", "published", "info"].includes(value) ? "success" : ["failed", "critical", "suspended", "revoked"].includes(value) ? "danger" : ["pending", "pending_review", "warning", "past_due"].includes(value) ? "warning" : "neutral";
  return <span className={`admin-workspace-badge is-${tone}`}><i aria-hidden="true" />{value.replaceAll("_", " ")}</span>;
}
export function WorkspaceInspector({ title, selected, children }: { title: string; selected: boolean; children?: ReactNode }) {
  return <aside className="admin-workspace-inspector" aria-label={title}><header><ShieldCheck aria-hidden="true" /><div><small>DETAILS</small><h2>{title}</h2></div><span className="admin-workspace-readonly">Read only</span></header>{selected ? children : <div className="admin-workspace-state"><span><Inbox aria-hidden="true" /></span><h3>Select a record</h3><p>Choose an available row to review its details.</p></div>}<footer><ShieldCheck aria-hidden="true" />Only available record information is displayed.</footer></aside>;
}
export function WorkspaceFields({ fields }: { fields: readonly (readonly [string, ReactNode])[] }) {
  return <dl className="admin-workspace-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "Unavailable"}</dd></div>)}</dl>;
}

