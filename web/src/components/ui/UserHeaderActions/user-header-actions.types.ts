export interface UserHeaderActionsProps {
  avatarSrc: string;
  avatarAlt?: string;
  userName?: string;
  userRole?: string;
  xp?: number;
  hasNotification?: boolean;
  unreadNotificationsCount?: number;
  onNotificationClick?: () => void;
  onXpClick?: () => void;
  onAvatarClick?: () => void;
  onViewProfile?: () => void;
  onMenuItemClick?: (itemKey: string) => void;
  onLogOut?: () => void;
  className?: string;
}
