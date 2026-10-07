import { NavLink } from "react-router-dom";
import type { SidebarItem } from "./sidebar.config";

interface SidebarNavItemProps {
  item: SidebarItem;
}

const baseClasses =
  "sidebar-nav-item flex h-[var(--sidebar-nav-item-height)] w-full items-center gap-[18px] rounded-[var(--radius-nav)] px-[18px] text-[15px] font-medium leading-none transition-colors duration-200 motion-reduce:transition-none";

export function SidebarNavItem({ item }: SidebarNavItemProps) {
  const Icon = item.icon;
  const renderContent = (isActive = false) => (
    <>
      <Icon
        className={`size-[21px] shrink-0 ${
          isActive ? "text-[var(--color-brand)]" : ""
        }`}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="sidebar-nav-label min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="sidebar-nav-badge grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft-strong)] text-xs font-semibold text-[var(--color-brand-hover)]">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (!item.enabled) {
    return (
      <span
        className={`${baseClasses} cursor-default text-[var(--color-text-primary)]`}
        aria-disabled="true"
        data-future-navigation={item.href}
      >
        {renderContent()}
      </span>
    );
  }

  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      className={({ isActive }) =>
        `${baseClasses} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 ${
          isActive
            ? "bg-[var(--color-brand-soft)] text-[var(--color-text-active)]"
            : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
        }`
      }
      aria-label={item.label}
    >
      {({ isActive }) => renderContent(isActive)}
    </NavLink>
  );
}
