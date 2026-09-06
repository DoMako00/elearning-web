import { Bell, BookOpen, ClipboardCheck, MessageSquare, X } from "lucide-react";
import { useEffect, useRef } from "react";
import "./NotificationsDropdown.css";

export interface NotificationItem {
  id: string;
  type: "message" | "assignment" | "course" | "system";
  title: string;
  body: string;
  time: string;
  isUnread: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "message",
    title: "New message from Dr. Ahmed Hassan",
    body: "Thanks! The diagram really helped clarify the relationships.",
    time: "10 min ago",
    isUnread: true,
  },
  {
    id: "n2",
    type: "assignment",
    title: "Assignment due soon",
    body: "Upper Limb Clinical Case Review is due in 2 days.",
    time: "1 hr ago",
    isUnread: true,
  },
  {
    id: "n3",
    type: "message",
    title: "New message from Prof. Sarah Johnson",
    body: "Please review the updated assignment rubric for the enzyme kinetics case study.",
    time: "2 hr ago",
    isUnread: true,
  },
  {
    id: "n4",
    type: "course",
    title: "Lesson unlocked",
    body: "Lesson 4: Thorax & Thoracic Wall is now available in Human Anatomy I.",
    time: "Yesterday",
    isUnread: false,
  },
  {
    id: "n5",
    type: "assignment",
    title: "Assignment graded",
    body: "Your submission for Brachial Plexus Diagram has been graded.",
    time: "Yesterday",
    isUnread: false,
  },
];

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
  onMarkAllRead?: () => void;
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  triggerRef,
  notifications = MOCK_NOTIFICATIONS,
  onMarkAllRead,
}: NotificationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => n.isUnread).length;

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
        {notifications.map((notif) => (
          <li key={notif.id}>
            <button
              type="button"
              className={`notif-item${notif.isUnread ? " notif-item--unread" : ""}`}
              onClick={onClose}
            >
              <div className="notif-item__icon-box">
                <NotifIcon type={notif.type} />
              </div>
              <div className="notif-item__copy">
                <p className="notif-item__title">{notif.title}</p>
                <p className="notif-item__body">{notif.body}</p>
                <time className="notif-item__time">{notif.time}</time>
              </div>
              {notif.isUnread && (
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
        }}>
          Mark all as read
        </button>
      </div>
    </div>
  );
}
