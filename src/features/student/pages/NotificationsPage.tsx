import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarkStudentNotificationsRead, useStudentNotifications } from "../api/useStudentNotifications";
import { safeInternalPath } from "../../../shared/utils/safeInternalPath";
import { useIsMobile } from "../../../hooks/useIsMobile";
import "./student-extra-pages.css";

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
    <main className="student-notifications-page">
      <section className="student-notifications" aria-labelledby="notifications-title">
        <header className="student-notifications__header">
          <h1 id="notifications-title" className={isMobile ? "sr-only" : undefined}>Notifications</h1>
          <button
            type="button"
            disabled={unreadCount === 0 || markRead.isPending}
            onClick={() => markRead.mutate(null)}
            className="student-notifications__mark-read"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            {markRead.isPending ? "Marking…" : "Mark all as read"}
          </button>
        </header>
        {markRead.isError ? (
          <p role="alert" className="student-extra-page__state student-extra-page__state--error">
            {markRead.error instanceof Error ? markRead.error.message : "Notifications could not be marked as read."}
          </p>
        ) : null}

        {notificationsQuery.isPending ? <p role="status" className="student-extra-page__state">Loading notifications…</p> : null}
        {notificationsQuery.isError ? (
          <div role="alert" className="student-notifications__error">
            <p>Notifications could not be loaded.</p>
            <button type="button" onClick={() => void notificationsQuery.refetch()} className="assessment-action">
              <RefreshCw className="size-4" aria-hidden="true" /> Try again
            </button>
          </div>
        ) : null}
        {notificationsQuery.isSuccess && notifications.length === 0 ? (
          <p className="student-extra-page__state" role="status">You have no notifications yet.</p>
        ) : null}

        {notifications.length > 0 ? (
          <ul className="student-notifications__list" aria-label={`${unreadCount} unread notifications`}>
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
                    className={`student-notification${item.readAt === null ? " is-unread" : ""}`}
                  >
                    <span className="student-notification__icon" aria-hidden="true"><Bell className="size-4" /></span>
                    <span className="student-notification__copy">
                      <span className="student-notification__title">{item.title}</span>
                      <span className="student-notification__body">{item.body}</span>
                      <time className="student-notification__date" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </span>
                    {item.readAt === null ? <span className="student-notification__unread" aria-label="Unread" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
