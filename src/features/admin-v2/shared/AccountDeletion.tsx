import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import {
  deleteAccountIdentity,
  getAccountDeletionPreview,
  listPendingAccountDeletions,
  retryAccountDeletion,
  type AccountDeletionPreview,
  type DeletionKind,
  type PendingAccountDeletion,
} from "../api/adminAccountDeletionApi";

export function AccountDeletionDialog({ kind, profileId, onCancel, onFinished }: {
  kind: DeletionKind;
  profileId: string;
  onCancel: () => void;
  onFinished: (kind: DeletionKind, status: "pending" | "completed") => void;
}) {
  const [preview, setPreview] = useState<AccountDeletionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    setLoading(true);
    void getAccountDeletionPreview(kind, profileId).then((value) => {
      if (current) setPreview(value);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "The deletion preview could not be loaded.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [kind, profileId]);

  const confirm = async () => {
    if (!preview || !reason.trim() || email.trim().toLowerCase() !== preview.email.toLowerCase()) return;
    setPending(true);
    setError("");
    try {
      const result = await deleteAccountIdentity(kind, profileId, { confirmationEmail: email.trim(), reason: reason.trim() });
      onFinished(kind, result.status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The account deletion could not be started.");
    } finally { setPending(false); }
  };

  return <div className="admin-v2__overlay admin-v2__overlay--center">
    <section className="admin-v2__confirm admin-v2__account-deletion-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-v2-delete-account-title">
      <h2 id="admin-v2-delete-account-title">Delete account identity?</h2>
      {loading && <p role="status">Loading the account and affected Brand records…</p>}
      {error && <p role="alert" className="admin-v2__inline-notice">{error}</p>}
      {preview && <>
        <p>This permanently removes the sign-in identity and direct contact details for <strong>{preview.displayName}</strong>. {kind === "student" ? `${preview.affectedProfileCount} Student profile${preview.affectedProfileCount === 1 ? "" : "s"} across every Brand will be anonymized; learning, payment, subscription and audit history stays under internal IDs.` : "The Admin sign-in will be removed and its profile retained as an internal tombstone."}</p>
        <dl className="admin-v2__account-deletion-details">
          <div><dt>Account email</dt><dd>{preview.email}</dd></div>
          <div><dt>Brands affected</dt><dd>{preview.brandCodes.length ? preview.brandCodes.map((code) => code.toUpperCase()).join(", ") : "No direct Brand assignment"}</dd></div>
          {kind === "student" && <div><dt>Student profiles</dt><dd>{preview.affectedProfileCount}</dd></div>}
        </dl>
        <label className="admin-v2__field"><span>Type the account email to confirm</span><input type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} /></label>
        <label className="admin-v2__field"><span>Reason for deletion</span><textarea maxLength={500} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} disabled={pending} /></label>
      </>}
      <div>
        <button type="button" className="admin-v2__button" onClick={onCancel} disabled={pending}>Keep account</button>
        <button type="button" className="admin-v2__button is-danger" onClick={() => void confirm()} disabled={!preview || loading || pending || !reason.trim() || email.trim().toLowerCase() !== preview.email.toLowerCase()}>{pending ? "Submitting…" : "Delete identity"}</button>
      </div>
    </section>
  </div>;
}

export function PendingAccountDeletions({ refreshKey = 0 }: { refreshKey?: number }) {
  const [items, setItems] = useState<PendingAccountDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setError("");
    try { setItems(await listPendingAccountDeletions()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Pending account deletions could not be loaded."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [refreshKey]);

  const retry = async (item: PendingAccountDeletion) => {
    setWorkingId(item.id);
    setError("");
    setNotice("");
    try {
      const result = await retryAccountDeletion(item.id);
      setNotice(result.status === "completed" ? `Identity cleanup completed for ${item.displayName}.` : `Access is disabled for ${item.displayName}; cleanup is still pending.`);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The account deletion could not be retried."); }
    finally { setWorkingId(""); }
  };

  if (loading) return <p className="admin-v2__empty">Checking pending account cleanup…</p>;
  if (!items.length && !error && !notice) return null;
  return <section className="admin-v2__roles-card admin-v2__account-deletions" aria-label="Pending account deletions">
    <header><span><AlertTriangle size={18} /></span><div><h2>Account cleanup</h2><p>Access is blocked while the server finishes identity deletion.</p></div></header>
    {error && <p role="alert" className="admin-v2__inline-notice">{error}</p>}
    {notice && <p role="status" className="admin-v2__roles-feedback">{notice}</p>}
    {items.map((item) => <article key={item.id} className="admin-v2__account-deletion-row">
      <div><strong>{item.displayName}</strong><small>{item.targetKind === "student" ? "Student" : "Admin"} · {item.email || "Email unavailable"} · {item.brandCodes.map((code) => code.toUpperCase()).join(", ") || "All Brands"}</small><small>Attempts: {item.attemptCount}{item.lastErrorCode ? ` · ${item.lastErrorCode}` : ""}</small></div>
      <button type="button" className="admin-v2__button" onClick={() => void retry(item)} disabled={workingId === item.id}><RefreshCw size={14} /> {workingId === item.id ? "Retrying…" : "Retry cleanup"}</button>
    </article>)}
  </section>;
}

export function DeleteAccountButton({ onClick, disabled = false, children = "Delete account" }: { onClick: () => void; disabled?: boolean; children?: string }) {
  return <button type="button" className="admin-v2__button is-danger" onClick={onClick} disabled={disabled}><Trash2 size={14} /> {children}</button>;
}
