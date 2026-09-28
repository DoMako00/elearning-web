import {
  ChevronRight,
  LogOut,
  Settings,
  User,
  UsersRound,
} from "lucide-react";
import { useEffect, useRef } from "react";
import "./SidebarProfileDropdown.css";

export interface SidebarProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  name?: string;
  role?: string;
  initials?: string;
  onMenuItemClick?: (itemKey: string) => void;
  onLogOut?: () => void;
}

export function SidebarProfileDropdown({
  isOpen,
  onClose,
  triggerRef,
  name = "Juliana Silva",
  role = "Student",
  initials = "J",
  onMenuItemClick,
  onLogOut,
}: SidebarProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape key
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
    },
    {
      key: "settings",
      label: "Account Settings",
      icon: Settings,
    },
    {
      key: "switch-account",
      label: "Switch Account",
      icon: UsersRound,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="sidebar-profile-dropdown"
      role="menu"
      aria-label="User profile options"
    >
      <div className="sidebar-profile-dropdown__beak" aria-hidden="true" />

      <div className="sidebar-profile-dropdown__header">
        <div className="sidebar-profile-dropdown__header-bg" aria-hidden="true">
          <svg
            className="sidebar-profile-dropdown__wave"
            viewBox="0 0 200 80"
            fill="none"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,55 C60,20 120,65 200,20 L200,0 L0,0 Z"
              fill="url(#sidebarWaveGrad)"
              opacity="0.85"
            />
            <defs>
              <linearGradient id="sidebarWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#86efac" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="sidebar-profile-dropdown__header-content">
          <div className="sidebar-profile-dropdown__avatar-wrap">
            <span className="sidebar-profile-dropdown__avatar">
              {initials}
            </span>
            <span className="sidebar-profile-dropdown__status-dot" aria-hidden="true" />
          </div>

          <div className="sidebar-profile-dropdown__user-info">
            <h4 className="sidebar-profile-dropdown__name">{name}</h4>
            <span className="sidebar-profile-dropdown__role">{role}</span>
          </div>
        </div>
      </div>

      <div className="sidebar-profile-dropdown__divider" />

      <ul className="sidebar-profile-dropdown__list" role="list">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <button
                type="button"
                className="sidebar-profile-dropdown__item"
                role="menuitem"
                onClick={() => {
                  onMenuItemClick?.(item.key);
                  onClose();
                }}
              >
                <div className="sidebar-profile-dropdown__item-left">
                  <Icon className="sidebar-profile-dropdown__item-icon" aria-hidden="true" />
                  <span className="sidebar-profile-dropdown__item-label">{item.label}</span>
                </div>

                <ChevronRight className="sidebar-profile-dropdown__item-arrow" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-profile-dropdown__divider" />

      <div className="sidebar-profile-dropdown__footer">
        <button
          type="button"
          className="sidebar-profile-dropdown__logout"
          role="menuitem"
          onClick={() => {
            onLogOut?.();
            onClose();
          }}
        >
          <LogOut className="sidebar-profile-dropdown__logout-icon" aria-hidden="true" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
