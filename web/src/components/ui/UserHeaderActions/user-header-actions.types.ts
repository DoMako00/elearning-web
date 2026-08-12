export interface UserHeaderActionsProps {
  avatarSrc: string;
  avatarAlt?: string;
  xp?: number;
  hasNotification?: boolean;
  onNotificationClick?: () => void;
  onXpClick?: () => void;
  onAvatarClick?: () => void;
  className?: string;
}
