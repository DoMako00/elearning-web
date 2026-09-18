import {
  ChevronRight,
  LineChart,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef } from "react";
import "./XpDropdown.css";

export interface XpDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  xp?: number;
  onHistoryClick?: () => void;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function XpDropdown({
  isOpen,
  onClose,
  triggerRef,
  xp = 2450,
  onHistoryClick,
}: XpDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formattedXp = `${numberFormatter.format(xp)} XP`;

  // Close when clicking outside or pressing Escape
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

  return (
    <div
      ref={dropdownRef}
      className="xp-dropdown-popup"
      role="menu"
      aria-label="Experience points details"
    >
      {/* Top pointer beak pointing up to the XP pill */}
      <div className="xp-dropdown-beak" aria-hidden="true" />

      {/* Header Card Section */}
      <div className="xp-dropdown-card">
        <div className="xp-dropdown-card__left">
          <div className="xp-dropdown-sparkles-icon">
            <Sparkles className="size-6 text-[#16a34a]" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div className="xp-dropdown-card__info">
            <h4 className="xp-dropdown-card__value">{formattedXp}</h4>
            <p className="xp-dropdown-card__subtitle">Your current experience</p>
          </div>
        </div>

        {/* 3D Soft Star Art */}
        <div className="xp-dropdown-card__art" aria-hidden="true">
          <svg viewBox="0 0 72 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background subtle glow sparkles */}
            <path
              d="M12 18L14 12L20 10L14 8L12 2L10 8L4 10L10 12L12 18Z"
              fill="#86efac"
              opacity="0.8"
            />
            <path
              d="M62 16L63.5 11.5L68 10L63.5 8.5L62 4L60.5 8.5L56 10L60.5 11.5L62 16Z"
              fill="#22c55e"
              opacity="0.9"
            />
            <path
              d="M64 46L65 43L68 42L65 41L64 38L63 41L60 42L63 43L64 46Z"
              fill="#4ade80"
              opacity="0.7"
            />

            {/* 3D Main Green Star */}
            <g filter="url(#starShadow)">
              <path
                d="M42 12.8L46.6 22.2C47.2 23.4 48.3 24.2 49.6 24.4L60 25.9C63.2 26.4 64.5 30.3 62.2 32.5L54.7 39.8C53.8 40.7 53.4 41.9 53.6 43.2L55.4 53.5C55.9 56.7 52.6 59.1 49.7 57.6L40.4 52.7C39.2 52.1 37.8 52.1 36.6 52.7L27.3 57.6C24.4 59.1 21.1 56.7 21.6 53.5L23.4 43.2C23.6 41.9 23.2 40.7 22.3 39.8L14.8 32.5C12.5 30.3 13.8 26.4 17 25.9L27.4 24.4C28.7 24.2 29.8 23.4 30.4 22.2L35 12.8C36.4 9.9 40.6 9.9 42 12.8Z"
                fill="url(#starGrad)"
              />
              <path
                d="M38.5 13.5L42.5 21.8C43.3 23.4 44.8 24.5 46.5 24.8L55.7 26.1C57.6 26.4 58.4 28.8 57 30.1L50.4 36.5C49.1 37.8 48.6 39.5 48.9 41.2L50.4 50.4C50.7 52.3 48.7 53.7 47 52.8L38.8 48.5C37.2 47.7 35.3 47.7 33.7 48.5L25.5 52.8C23.8 53.7 21.8 52.3 22.1 50.4L23.6 41.2C23.9 39.5 23.4 37.8 22.1 36.5L15.5 30.1C14.1 28.8 14.9 26.4 16.8 26.1L26 24.8C27.7 24.5 29.2 23.4 30 21.8L34 13.5C34.9 11.6 37.6 11.6 38.5 13.5Z"
                fill="url(#starHighlight)"
                opacity="0.75"
              />
            </g>

            <defs>
              <linearGradient id="starGrad" x1="16" y1="12" x2="58" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="60%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="starHighlight" x1="37" y1="12" x2="37" y2="45" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#bbf7d0" />
                <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
              </linearGradient>
              <filter id="starShadow" x="9" y="8" width="58" height="56" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#166534" floodOpacity="0.22" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>

      <div className="xp-dropdown-divider" />

      {/* Action Item: XP History */}
      <button
        type="button"
        className="xp-dropdown-history-btn"
        role="menuitem"
        onClick={() => {
          onHistoryClick?.();
          onClose();
        }}
      >
        <div className="xp-dropdown-history-btn__left">
          <div className="xp-dropdown-history-icon-box">
            <LineChart className="size-4 text-[#334155]" aria-hidden="true" />
          </div>
          <span className="xp-dropdown-history-btn__label">XP History</span>
        </div>

        <ChevronRight className="xp-dropdown-history-btn__arrow" aria-hidden="true" />
      </button>
    </div>
  );
}
