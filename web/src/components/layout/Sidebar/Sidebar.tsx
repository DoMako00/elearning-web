import { ChevronDown, Leaf } from "lucide-react";
import { useBrand } from "../../../app/providers/BrandProvider";
import { SidebarNavItem } from "./SidebarNavItem";
import {
  primarySidebarItems,
  secondarySidebarItems,
  sidebarProfile,
} from "./sidebar.config";

export function Sidebar() {
  const { brand } = useBrand();

  return (
    <aside
      className="flex h-full min-h-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-[var(--sidebar-gutter)] pb-[15px] pt-10"
      aria-label="Student navigation"
      data-sidebar
    >
      <div className="flex h-10 shrink-0 items-center gap-3 px-[15px]">
        <span className="grid size-8 place-items-center rounded-[9px] bg-[var(--color-brand-hover)] text-white">
          <Leaf className="size-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="truncate text-[19px] font-semibold text-[var(--color-text-primary)]">
          {brand.name}
        </span>
      </div>

      <nav className="mt-10" aria-label="Primary navigation">
        <ul className="space-y-[var(--sidebar-nav-gap)]">
          {primarySidebarItems.map((item) => (
            <li key={item.label}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-h-3 flex-1" aria-hidden="true" />

      <nav className="mb-4" aria-label="Support navigation">
        <ul className="space-y-[var(--sidebar-nav-gap)]">
          {secondarySidebarItems.map((item) => (
            <li key={item.label}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-h-[78px] shrink-0 items-center gap-3 rounded-[var(--radius-profile)] bg-[var(--color-brand-soft)] px-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-brand-hover)] text-sm font-semibold text-white">
          {sidebarProfile.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {sidebarProfile.name}
          </span>
          <span className="mt-1 block truncate text-xs text-[var(--color-text-secondary)]">
            {sidebarProfile.role}
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-[var(--color-text-secondary)]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
}
