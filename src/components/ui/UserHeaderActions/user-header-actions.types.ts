import type { NotificationItem } from "./NotificationsDropdown";

export interface UserHeaderActionsProps {
  avatarSrc?: string;
  avatarAlt?: string;
  userName?: string;
  userRole?: string;
  xp?: number;
  hasNotification?: boolean;
  unreadNotificationsCount?: number;
  notifications?: NotificationItem[];
  notificationsLoading?: boolean;
  notificationsError?: string | null;
  onNotificationClick?: () => void;
  onReadNotification?: (id: string) => void;
  onMarkAllRead?: () => void;
  onXpClick?: () => void;
  onAvatarClick?: () => void;
  onViewProfile?: () => void;
  onMenuItemClick?: (itemKey: string) => void;
  onLogOut?: () => void;
  className?: string;
}
