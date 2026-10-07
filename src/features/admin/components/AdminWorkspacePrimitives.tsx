import { Inbox, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function WorkspaceMetric({
  title,
  value,
  note,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <article className="admin-workspace-metric">
      <span className="admin-workspace-metric__icon">
        <Icon aria-hidden="true" />
      </span>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export function WorkspaceCard({
  title,
  children,
  className = "",
  aside,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <section className={`admin-workspace-card ${className}`}>
      <header>
        <h2>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function WorkspaceState({
  loading,
  error,
  title = "No records yet",
  onRetry,
}: {
  loading?: boolean;
  error?: boolean;
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="admin-workspace-state" role={error ? "alert" : "status"}>
      <span>
        <Inbox aria-hidden="true" />
      </span>
      <h3>
        {loading ? "Loading records…" : error ? "Records unavailable" : title}
      </h3>
      <p>
        {loading
          ? "Retrieving the selected brand’s records."
          : error
            ? "Records could not be loaded. No sample values have been substituted."
            : "Available records will appear here for the selected brand."}
      </p>
      {error && onRetry && (
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

export function statusTone(
  value: string,
): "success" | "warning" | "danger" | "neutral" {
  if (
    [
      "active",
      "approved",
      "confirmed",
      "published",
      "success",
      "trusted",
      "info",
    ].includes(value)
  )
    return "success";
  if (
    [
      "pending",
      "pending_review",
      "draft",
      "expiring",
      "expiring_soon",
      "review",
      "warning",
      "past_due",
    ].includes(value)
  )
    return "warning";
  if (
    [
      "rejected",
      "suspended",
      "failed",
      "cancelled",
      "critical",
      "disabled",
    ].includes(value)
  )
    return "danger";
  return "neutral";
}

export function WorkspaceBadge({ value }: { value: string }) {
  return (
    <span className={`admin-workspace-badge is-${statusTone(value)}`}>
      <i aria-hidden="true" />
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function WorkspaceInspector({
  title,
  selected,
  children,
  onClose,
}: {
  title: string;
  selected: boolean;
  children?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <aside className="admin-workspace-inspector" aria-label={title}>
      <header>
        <ShieldCheck aria-hidden="true" />
        <div>
          <small>DETAILS</small>
          <h2>{title}</h2>
        </div>
        {onClose && (
          <button type="button" aria-label="Close details" onClick={onClose}>
            ×
          </button>
        )}
      </header>
      <div className="admin-workspace-inspector__body">
        {selected ? (
          children
        ) : (
          <div className="admin-workspace-state">
            <span>
              <Inbox aria-hidden="true" />
            </span>
            <h3>Select a record</h3>
            <p>Choose a row to review its details alongside the list.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function WorkspaceFields({
  fields,
}: {
  fields: readonly (readonly [string, ReactNode])[];
}) {
  return (
    <dl className="admin-workspace-fields">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "Unavailable"}</dd>
        </div>
      ))}
    </dl>
  );
}
