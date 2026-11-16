import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ShieldCheck, WifiOff, X } from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import "../pages/student-extra-pages.css";

/** Native modal supplies focus containment, Escape and focus restoration. */
export function StudentConfirmDialog({ open, title, children, confirmLabel, pending = false, error, onCancel, onConfirm }: {
  open: boolean; title: string; children: ReactNode; confirmLabel: string;
  pending?: boolean; error?: string; onCancel: () => void; onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="student-confirm" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }}>
    <div className="student-confirm__heading">
      <span className="student-confirm__icon"><ShieldCheck size={24} aria-hidden="true" /></span>
      <button type="button" className="student-confirm__close" aria-label="Close confirmation" disabled={pending} onClick={onCancel}><X size={20} /></button>
    </div>
    <h2 id={titleId}>{title}</h2>
    <div id={descriptionId} className="student-confirm__description">{children}</div>
    {error && <p className="assessment-inline-error" role="alert"><AlertCircle size={18} aria-hidden="true" /> {error}</p>}
    <div className="student-confirm__actions">
      <button type="button" autoFocus disabled={pending} onClick={onCancel}>Keep reviewing</button>
      <button type="button" className="assessment-action" disabled={pending} onClick={onConfirm}>{pending ? "Submitting…" : confirmLabel}</button>
    </div>
  </dialog>;
}

export function StudentPanelSkeleton({ label = "Loading content", rows = 3 }: { label?: string; rows?: number }) {
  return <div className="student-panel-skeleton" role="status" aria-busy="true" aria-label={label}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, index) => <div className="student-panel-skeleton__row" key={index}>
      <Skeleton width={40} height={40} borderRadius={12} className="shrink-0" />
      <div className="student-panel-skeleton__copy"><Skeleton width={`${70 - index % 3 * 12}%`} height={16} /><Skeleton width="45%" height={12} /></div>
    </div>)}
  </div>;
}

/** Offline is a browser signal, never an assertion about server availability. */
export function StudentConnectionNotice() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return offline ? <div className="student-connection-notice" role="alert"><WifiOff size={20} aria-hidden="true" /><div><strong>You’re offline</strong><p>Reconnect before saving changes or submitting your work.</p></div></div> : null;
}
