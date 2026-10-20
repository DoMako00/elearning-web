import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarkStudentNotificationsRead, useStudentNotifications } from "../api/useStudentNotifications";
import { safeInternalPath } from "../../../shared/utils/safeInternalPath";
import { useIsMobile } from "../../../hooks/useIsMobile";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Full notifications list backed by the Student notifications API. Shared by
 * the desktop and mobile shells so students can read and mark notifications
 * on any screen size. */
export function NotificationsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const notificationsQuery = useStudentNotifications();
  const markRead = useMarkStudentNotificationsRead();
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => item.readAt === null).length;

  return (
    <div className="min-h-full bg-slate-50">
      <section className="mx-auto w-full max-w-3xl px-4 py-5" aria-labelledby="notifications-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 id="notifications-title" className={isMobile ? "sr-only" : "text-xl font-bold text-slate-900"}>Notifications</h1>
          <button
            type="button"
            disabled={unreadCount === 0 || markRead.isPending}
            onClick={() => markRead.mutate(null)}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            {markRead.isPending ? "Marking…" : "Mark all as read"}
          </button>
        </div>
        {markRead.isError ? (
          <p role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {markRead.error instanceof Error ? markRead.error.message : "Notifications could not be marked as read."}
          </p>
        ) : null}

        {notificationsQuery.isPending ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading notifications…</p> : null}
        {notificationsQuery.isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center text-sm text-rose-800">
            <p>Notifications could not be loaded.</p>
            <button type="button" onClick={() => void notificationsQuery.refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white">
              <RefreshCw className="size-4" aria-hidden="true" /> Try again
            </button>
          </div>
        ) : null}
        {notificationsQuery.isSuccess && notifications.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">You have no notifications yet.</p>
        ) : null}

        {notifications.length > 0 ? (
          <ul className="space-y-2" aria-label={`${unreadCount} unread notifications`}>
            {notifications.map((item) => {
              const target = safeInternalPath(item.deepLink);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.readAt === null) markRead.mutate(item.id);
                      if (target) navigate(target);
                    }}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${item.readAt === null ? "border-emerald-200 bg-white" : "border-slate-100 bg-white/70"}`}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Bell className="size-4" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 break-words">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-slate-600 break-words">{item.body}</span>
                      <time className="mt-1 block text-xs text-slate-500" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </span>
                    {item.readAt === null ? <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" aria-label="Unread" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
