import { Bell, ChevronDown, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { ProfileDropdown } from "./ProfileDropdown";
import { XpDropdown } from "./XpDropdown";
import type { UserHeaderActionsProps } from "./user-header-actions.types";
import "./UserHeaderActions.css";

const numberFormatter = new Intl.NumberFormat("en-US");

export function UserHeaderActions({
  avatarSrc,
  avatarAlt = "Juliana Silva",
  userName = "Juliana Silva",
  userRole = "Student",
  xp = 2450,
  hasNotification = false,
  unreadNotificationsCount = 3,
  onNotificationClick,
  onXpClick,
  onAvatarClick,
  onViewProfile,
  onMenuItemClick,
  onLogOut,
  className = "",
}: UserHeaderActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isXpOpen, setIsXpOpen] = useState(false);

  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const xpTriggerRef = useRef<HTMLButtonElement>(null);

  const formattedXp = `${numberFormatter.format(xp)} XP`;

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    setIsXpOpen(false);
    onAvatarClick?.();
  };

  const toggleXp = () => {
    setIsXpOpen((prev) => !prev);
    setIsDropdownOpen(false);
    onXpClick?.();
  };

  return (
    <div
      className={`user-header-actions relative flex items-center ${className}`}
      aria-label="User header actions"
    >
      {/* Notifications Button */}
      <button
        type="button"
        className="user-header-actions__notifications relative grid shrink-0 place-items-center rounded-full text-[var(--color-text-primary)] transition-opacity duration-150 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
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

      {/* Experience Points Button + Dropdown */}
      <div className="relative flex items-center user-header-actions__xp-wrap">
        <button
          ref={xpTriggerRef}
          type="button"
          className={`user-header-actions__xp flex shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 ${
            isXpOpen ? "user-header-actions__xp--active" : "hover:opacity-85"
          }`}
          aria-label={`${formattedXp} experience points`}
          aria-haspopup="true"
          aria-expanded={isXpOpen}
          onClick={toggleXp}
        >
          <Sparkles
            className="user-header-actions__xp-icon shrink-0 text-[var(--color-brand)]"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span className="user-header-actions__xp-copy whitespace-nowrap font-semibold leading-none">
            {formattedXp}
          </span>
          <ChevronDown
            className="user-header-actions__xp-chevron shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {/* XP Dropdown Popup */}
        <XpDropdown
          isOpen={isXpOpen}
          onClose={() => setIsXpOpen(false)}
          triggerRef={xpTriggerRef}
          xp={xp}
        />
      </div>

      {/* Profile Trigger (Avatar + Chevron) */}
      <div className="relative flex items-center user-header-actions__profile-wrap">
        <button
          ref={profileTriggerRef}
          type="button"
          className={`user-header-actions__profile-btn flex items-center gap-2 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 ${
            isDropdownOpen ? "opacity-100" : "hover:opacity-90"
          }`}
          aria-label={`User menu for ${userName}`}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          onClick={toggleDropdown}
        >
          <div
            className={`user-header-actions__avatar shrink-0 overflow-hidden rounded-full transition-all duration-200 ${
              isDropdownOpen
                ? "ring-2 ring-[var(--color-brand,#20a862)] ring-offset-2"
                : ""
            }`}
          >
            <img
              className="size-full object-cover"
              src={avatarSrc}
              alt={avatarAlt}
            />
          </div>

          <ChevronDown
            className={`user-header-actions__chevron shrink-0 text-[var(--color-text-primary)] transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-[var(--color-brand,#20a862)]" : ""
            }`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {/* Profile Dropdown Popup */}
        <ProfileDropdown
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          triggerRef={profileTriggerRef}
          avatarSrc={avatarSrc}
          avatarAlt={avatarAlt}
          userName={userName}
          userRole={userRole}
          unreadNotificationsCount={unreadNotificationsCount}
          onViewProfile={onViewProfile}
          onMenuItemClick={onMenuItemClick}
          onLogOut={onLogOut}
        />
      </div>
    </div>
  );
}
