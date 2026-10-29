import { Crown, X } from "lucide-react";
import { useEffect, type FormEvent, type PropsWithChildren, type ReactNode } from "react";
import type { BrandCode, RecordStatus } from "../types/adminV2.types";
import { brandName } from "../data/adminV2.defaults";
import "./admin-drawer.css";

const toneByStatus: Record<RecordStatus, string> = {
  Active: "success", Published: "success", Approved: "success", Draft: "warning", Archived: "muted", Closed: "muted", Suspended: "danger", Inactive: "muted", Pending: "warning", "Pending Payment": "warning", "Pending Review": "warning", "Pending Verification": "warning", "Payment Rejected": "danger", Rejected: "danger", "Expiring Soon": "warning", Expired: "muted", Cancelled: "danger", "Past Due": "danger", Revoked: "muted", "Replacement Pending": "warning", Withdrawn: "muted", Submitted: "warning", Reviewed: "success", Returned: "warning",
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`admin-v2__status is-${toneByStatus[status]}`}><i aria-hidden="true" />{status}</span>;
}

export function BrandBadge({ brand }: { brand: BrandCode }) {
  return <span className={`admin-v2__brand-badge is-${brand}`}>{brand === "elite" ? <Crown className="admin-v2__brand-crown" size={12} aria-hidden="true" /> : <span className="admin-v2__brand-shield"><i /></span>}{brandName(brand)}</span>;
}

export function MetricCard({ icon: Icon, label, value, note, tone = "green" }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; note: string; tone?: string }) {
  return <article className={`admin-v2__metric is-${tone}`}><span className="admin-v2__metric-icon"><Icon size={19} aria-hidden="true" /></span><div><span className="admin-v2__metric-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

export function Drawer({ title, subtitle, onClose, children, footer }: PropsWithChildren<{ title: string; subtitle: string; onClose: () => void; footer?: ReactNode }>) {
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [onClose]);
  return <div className="admin-v2__overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-v2__drawer" role="dialog" aria-modal="true" aria-label={title}><header><div><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className="admin-v2__icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></header><div className="admin-v2__drawer-body">{children}</div>{footer && <footer>{footer}</footer>}</section></div>;
}

export function ConfirmDialog({ title, detail, confirmLabel = "Confirm", onCancel, onConfirm, pending = false }: { title: string; detail: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void; pending?: boolean }) {
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); }; window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [onCancel]);
  return <div className="admin-v2__overlay admin-v2__overlay--center" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}><section className="admin-v2__confirm" role="alertdialog" aria-modal="true" aria-labelledby="admin-v2-confirm-title"><h2 id="admin-v2-confirm-title">{title}</h2><p>{detail}</p><div><button type="button" className="admin-v2__button" onClick={onCancel} disabled={pending}>Keep</button><button type="button" className="admin-v2__button is-danger" onClick={onConfirm} disabled={pending}>{pending ? "Working…" : confirmLabel}</button></div></section></div>;
}

export function FormField({ label, children, wide = false }: PropsWithChildren<{ label: string; wide?: boolean }>) {
  return <label className={`admin-v2__field${wide ? " is-wide" : ""}`}><span>{label}</span>{children}</label>;
}

export function FormActions({ children }: PropsWithChildren) { return <div className="admin-v2__form-actions">{children}</div>; }

export function stopSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); }
