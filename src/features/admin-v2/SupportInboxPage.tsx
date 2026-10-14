import { useEffect, useMemo, useState } from "react";
import { MessageSquare, RefreshCw, Send } from "lucide-react";
import { TableFrame } from "./shared/AdminV2Table";
import { useAdminSupportActions, useAdminSupportConversations, useAdminSupportMessages } from "./api/useAdminSupport";

const when = (value: string | null | undefined) => value ? new Date(value).toLocaleString() : "—";
const errorText = (error: unknown) => error instanceof Error ? error.message : "Support request failed.";

export function SupportInboxPage() {
  const list = useAdminSupportConversations();
  const items = list.data ?? [];
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [actionError, setActionError] = useState("");
  const selected = useMemo(() => items.find((item) => item.conversationId === selectedId) ?? items[0] ?? null, [items, selectedId]);
  const messages = useAdminSupportMessages(selected?.conversationId ?? null);
  const actions = useAdminSupportActions();
  const pending = actions.markRead.isPending || actions.reply.isPending;
  const visibleMessages = messages.data?.items ?? [];

  useEffect(() => {
    if (!selected && selectedId) setSelectedId("");
    else if (selected && selected.conversationId !== selectedId) setSelectedId(selected.conversationId);
  }, [selected, selectedId]);
  useEffect(() => {
    if (!selected || selected.unreadCount < 1 || actions.markRead.isPending) return;
    void actions.markRead.mutateAsync(selected.conversationId).catch((error) => setActionError(errorText(error)));
  }, [selected?.conversationId, selected?.unreadCount]);

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !draft.trim() || pending || selected.status !== "open") return;
    setActionError("");
    try {
      await actions.reply.mutateAsync({ id: selected.conversationId, body: draft.trim(), expectedVersion: messages.data?.conversation.version ?? selected.version });
      setDraft("");
    } catch (error) { setActionError(errorText(error)); }
  };

  return <section className="admin-v2__page admin-v2__support-page">
    {list.isError && <div className="admin-v2__inline-notice" role="alert">{errorText(list.error)} <button type="button" onClick={() => void list.refetch()}>Retry</button></div>}
    {actionError && <div className="admin-v2__inline-notice" role="alert">{actionError}</div>}
    <div className="admin-v2__support-layout">
      <TableFrame title="Student Support Inbox" count={list.isPending ? "Loading…" : `${items.length} conversations`} toolbar={<div className="admin-v2__table-tools"><button type="button" className="admin-v2__button" onClick={() => void list.refetch()} disabled={list.isFetching}><RefreshCw size={13} /> Refresh</button></div>}>
        {list.isPending ? <div className="admin-v2__empty" role="status">Loading support conversations…</div> : items.length === 0 ? <div className="admin-v2__empty"><MessageSquare size={18} /><strong>No Student support conversations</strong><span>New requests sent from the Student Messages area will appear here.</span></div> : <div className="admin-v2__support-table-wrap"><table className="admin-v2__table"><thead><tr><th>Student</th><th>Subject</th><th>Last message</th><th>Updated</th><th>Unread</th></tr></thead><tbody>{items.map((item) => <tr key={item.conversationId} onClick={() => { setSelectedId(item.conversationId); setActionError(""); }} className={selected?.conversationId === item.conversationId ? "is-selected" : ""}><td><strong>{item.studentName ?? "Student"}</strong><small>{item.studentProfileId.slice(0, 8)}</small></td><td>{item.subject ?? "Support request"}</td><td className="admin-v2__support-preview">{item.lastMessageBody ?? "No message yet"}</td><td>{when(item.updatedAt)}</td><td>{item.unreadCount > 0 ? <span className="admin-v2__support-unread">{item.unreadCount}</span> : "—"}</td></tr>)}</tbody></table></div>}
      </TableFrame>
      {selected ? <aside className="admin-v2__inspector admin-v2__support-inspector">
        <header className="admin-v2__inspector-title"><div><h2>{selected.subject ?? "Support conversation"}</h2><small>{selected.studentName ?? "Student"} · {selected.status}</small></div><span className="admin-v2__support-student-id">{selected.studentProfileId.slice(0, 8)}</span></header>
        <div className="admin-v2__support-messages" aria-live="polite">
          {messages.isPending ? <p role="status" className="admin-v2__empty-inline">Loading saved messages…</p> : messages.isError ? <div className="admin-v2__empty-inline" role="alert">{errorText(messages.error)} <button type="button" onClick={() => void messages.refetch()}>Retry</button></div> : visibleMessages.length === 0 ? <p className="admin-v2__empty-inline">No messages in this thread.</p> : visibleMessages.map((message) => <article key={message.id} className={`admin-v2__support-message${message.senderRole === "admin" ? " is-admin" : ""}`}><div><strong>{message.senderName}</strong><time>{when(message.createdAt)}</time></div><p>{message.body}</p></article>)}
        </div>
        <form className="admin-v2__support-reply" onSubmit={submitReply}><label className="admin-v2__field"><span>Reply to Student</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={10000} rows={4} disabled={selected.status !== "open" || pending} placeholder={selected.status === "open" ? "Write a response…" : "This conversation is closed."} /></label><button type="submit" className="admin-v2__button is-primary" disabled={!draft.trim() || selected.status !== "open" || pending || messages.isPending}><Send size={13} />{actions.reply.isPending ? "Sending…" : "Send reply"}</button></form>
      </aside> : <aside className="admin-v2__inspector admin-v2__support-inspector admin-v2__empty-inspector"><MessageSquare size={22} /><strong>Select a conversation</strong><span>Choose a Student request to read and reply.</span></aside>}
    </div>
  </section>;
}

export default SupportInboxPage;
