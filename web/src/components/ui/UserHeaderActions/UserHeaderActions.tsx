import { Bell, ChevronDown, Sparkles } from "lucide-react";
import type { UserHeaderActionsProps } from "./user-header-actions.types";
import "./UserHeaderActions.css";

const numberFormatter = new Intl.NumberFormat("en-US");

export function UserHeaderActions({
  avatarSrc,
  avatarAlt = "User avatar",
  xp = 2450,
  hasNotification = false,
  onNotificationClick,
  onXpClick,
  onAvatarClick,
  className = "",
}: UserHeaderActionsProps) {
  const formattedXp = `${numberFormatter.format(xp)} XP`;

  return (
    <div
      className={`user-header-actions flex h-[60px] w-max shrink-0 items-center gap-0 ${className}`}
      aria-label="User header actions"
    >
      <button
        type="button"
        className="user-header-actions__notifications relative grid size-[28px] shrink-0 place-items-center rounded-full text-[var(--color-text-primary)] transition-opacity duration-150 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
        aria-label="Notifications"
        onClick={onNotificationClick}
      >
        <Bell className="size-6" strokeWidth={1.8} aria-hidden="true" />
        {hasNotification ? (
          <span
            className="absolute right-0 top-0 size-[9px] rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-brand)]"
            aria-label="Unread notifications"
          />
        ) : null}
      </button>

      <button
        type="button"
        className="user-header-actions__xp ml-8 flex h-[58px] w-[138px] shrink-0 items-center justify-center gap-[11px] rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
        aria-label={`${formattedXp} experience points`}
        onClick={onXpClick}
      >
        <Sparkles
          className="user-header-actions__xp-icon size-[22px] shrink-0 text-[var(--color-brand)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="user-header-actions__xp-copy whitespace-nowrap text-base font-semibold leading-none">
          {formattedXp}
        </span>
      </button>

      <button
        type="button"
        className="user-header-actions__avatar ml-[30px] size-14 shrink-0 overflow-hidden rounded-full transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
        aria-label={`Open profile options for ${avatarAlt}`}
        onClick={onAvatarClick}
      >
        <img
          className="size-full object-cover"
          src={avatarSrc}
          alt={avatarAlt}
        />
      </button>

      <ChevronDown
        className="user-header-actions__chevron ml-2 size-[18px] shrink-0 text-[var(--color-text-primary)]"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}
