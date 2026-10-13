import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PropsWithChildren } from "react";

export function TableFrame({ title, count, toolbar, children, footer }: PropsWithChildren<{ title: string; count: string; toolbar?: React.ReactNode; footer?: React.ReactNode }>) {
  return <section className="admin-v2__table-card"><header className="admin-v2__table-toolbar"><div><strong>{title}</strong><span>{count}</span></div>{toolbar}</header><div className="admin-v2__table-scroll">{children}</div>{footer}</section>;
}

export function Pagination({ page, pageCount, total, pageSize, onPageChange }: { page: number; pageCount: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return <footer className="admin-v2__pagination"><span>Showing {first} to {last} of {total} results</span><div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={15} /></button><strong>{page}</strong><span>of {pageCount}</span><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight size={15} /></button></div></footer>;
}

export function InspectorSection({ title, action, children }: PropsWithChildren<{ title: string; action?: React.ReactNode }>) {
  return <section className="admin-v2__inspector-section"><header><h3>{title}</h3>{action}</header>{children}</section>;
}

export function InspectorFields({ fields }: { fields: readonly (readonly [string, React.ReactNode])[] }) {
  return <dl className="admin-v2__fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>;
}
