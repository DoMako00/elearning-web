import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useRef } from "react";
import "./ProfileDropdown.css";

export interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  avatarSrc: string;
  avatarAlt?: string;
  userName?: string;
  userRole?: string;
  unreadNotificationsCount?: number;
  onViewProfile?: () => void;
  onMenuItemClick?: (itemKey: string) => void;
  onLogOut?: () => void;
}

export function ProfileDropdown({
  isOpen,
  onClose,
  triggerRef,
  avatarSrc,
  avatarAlt = "User",
  userName = "Juliana Silva",
  userRole = "Student",
  unreadNotificationsCount = 3,
  onViewProfile,
  onMenuItemClick,
  onLogOut,
}: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return; // Let the trigger button's onClick handle toggling
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const menuItems = [
    {
      key: "profile",
      label: "My Profile",
      icon: User,
      hasArrow: true,
    },
    {
      key: "settings",
      label: "Account Settings",
      icon: Settings,
      hasArrow: true,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotificationsCount,
      hasArrow: false,
    },
    {
      key: "certificates",
      label: "My Certificates",
      icon: BadgeCheck,
      hasArrow: true,
    },
    {
      key: "help",
      label: "Help Center",
      icon: CircleHelp,
      hasArrow: true,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="profile-dropdown-popup"
      role="menu"
      aria-label="User profile menu"
    >
      <div className="profile-dropdown-beak" aria-hidden="true" />

      <div className="profile-dropdown-header">
        <div className="profile-dropdown-header-bg" aria-hidden="true">
          <svg
            className="profile-dropdown-wave"
            viewBox="0 0 240 80"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,55 C70,18 160,60 240,15 L240,0 L0,0 Z"
              fill="url(#headerWaveGrad)"
              opacity="0.85"
            />
            <defs>
              <linearGradient id="headerWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#86efac" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.12" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="profile-dropdown-header__content">
          <div className="profile-dropdown-avatar">
            <img src={avatarSrc} alt={avatarAlt} />
          </div>

          <div className="profile-dropdown-user-info">
            <h4 className="profile-dropdown-name">{userName}</h4>
            <span className="profile-dropdown-role">{userRole}</span>
          </div>

          <button
            type="button"
            className="profile-dropdown-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.();
              onClose();
            }}
          >
            <User className="size-3.5" aria-hidden="true" />
            <span>View Profile</span>
          </button>
        </div>
      </div>

      <div className="profile-dropdown-divider" />

      {/* Navigation List */}
      <ul className="profile-dropdown-list" role="list">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <button
                type="button"
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => {
                  onMenuItemClick?.(item.key);
                  onClose();
                }}
              >
                <div className="profile-dropdown-item__left">
                  <Icon className="profile-dropdown-item__icon" aria-hidden="true" />
                  <span className="profile-dropdown-item__label">{item.label}</span>
                </div>

                <div className="profile-dropdown-item__right">
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="profile-dropdown-badge">{item.badge}</span>
                  ) : null}
                  {item.hasArrow ? (
                    <ChevronRight className="profile-dropdown-item__arrow" aria-hidden="true" />
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="profile-dropdown-divider" />

      {/* Log Out Action */}
      <div className="profile-dropdown-footer">
        <button
          type="button"
          className="profile-dropdown-logout"
          role="menuitem"
          onClick={() => {
            onLogOut?.();
            onClose();
          }}
        >
          <LogOut className="profile-dropdown-logout__icon" aria-hidden="true" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
