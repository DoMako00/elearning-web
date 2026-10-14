import { Bell, BookOpen, ClipboardCheck, MessageSquare, X } from "lucide-react";
import { useEffect, useRef } from "react";
import "./NotificationsDropdown.css";

export interface NotificationItem {
  id: string;
  type: "message" | "assignment" | "assessment" | "community" | "course" | "subscription" | "system";
  title: string;
  body: string;
  deepLink: string | null;
  createdAt: string;
  readAt: string | null;
}

function NotifIcon({ type }: { type: NotificationItem["type"] }) {
  if (type === "message")    return <MessageSquare  className="notif-item__type-icon notif-item__type-icon--message"    aria-hidden="true" />;
  if (type === "assignment") return <ClipboardCheck className="notif-item__type-icon notif-item__type-icon--assignment" aria-hidden="true" />;
  if (type === "course")     return <BookOpen       className="notif-item__type-icon notif-item__type-icon--course"     aria-hidden="true" />;
  return                            <Bell           className="notif-item__type-icon notif-item__type-icon--system"     aria-hidden="true" />;
}

export interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  notifications?: NotificationItem[];
  loading?: boolean;
  error?: string | null;
  onMarkAllRead?: () => void;
  onReadNotification?: (id: string) => void;
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  triggerRef,
  notifications = [],
  loading = false,
  error = null,
  onMarkAllRead,
  onReadNotification,
}: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="notif-dropdown"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="notif-dropdown__beak" aria-hidden="true" />

      {/* Header */}
      <div className="notif-dropdown__header">
        <div className="notif-dropdown__header-left">
          <Bell className="notif-dropdown__header-icon" aria-hidden="true" />
          <h3 className="notif-dropdown__title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="notif-dropdown__badge">{unreadCount}</span>
          )}
        </div>
        <button
          type="button"
          className="notif-dropdown__close"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <div className="notif-dropdown__divider" />

      {/* List */}
      <ul className="notif-dropdown__list" role="list">
        {loading ? <li className="notif-item__body" role="status">Loading notifications…</li> : null}
        {!loading && error ? <li className="notif-item__body" role="alert">{error}</li> : null}
        {!loading && !error && notifications.length === 0 ? <li className="notif-item__body">No notifications yet.</li> : null}
        {!loading && !error && notifications.map((notif) => (
          <li key={notif.id}>
            <button
              type="button"
              className={`notif-item${!notif.readAt ? " notif-item--unread" : ""}`}
              onClick={() => {
                if (!notif.readAt) onReadNotification?.(notif.id);
                if (notif.deepLink) window.location.assign(notif.deepLink);
                onClose();
              }}
            >
              <div className="notif-item__icon-box">
                <NotifIcon type={notif.type} />
              </div>
              <div className="notif-item__copy">
                <p className="notif-item__title">{notif.title}</p>
                <p className="notif-item__body">{notif.body}</p>
                <time className="notif-item__time" dateTime={notif.createdAt}>{formatNotificationDate(notif.createdAt)}</time>
              </div>
              {!notif.readAt && (
                <span className="notif-item__dot" aria-label="Unread" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="notif-dropdown__divider" />

      <div className="notif-dropdown__footer">
        <button type="button" className="notif-dropdown__mark-all" onClick={() => {
          onMarkAllRead?.();
          onClose();
        }} disabled={unreadCount === 0 || loading || Boolean(error)}>
          Mark all as read
        </button>
      </div>
    </div>
  );
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
