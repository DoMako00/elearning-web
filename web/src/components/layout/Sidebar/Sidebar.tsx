import { ChevronRight, Leaf, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBrand } from "../../../app/providers/BrandProvider";
import { useMessages } from "../../../app/providers/MessagesProvider";
import { useAuth } from "../../../app/providers/AuthProvider";
import { SidebarNavItem } from "./SidebarNavItem";
import {
  primarySidebarItems,
  secondarySidebarItems,
  sidebarProfile,
} from "./sidebar.config";
import "./Sidebar.css";

function getDisplayName(emailOrName: string | null | undefined) {
  if (!emailOrName) return sidebarProfile.name;
  const localPart = emailOrName.split("@")[0]?.trim();
  if (!localPart) return emailOrName;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || sidebarProfile.initials;
}

export function Sidebar() {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { unreadChatsCount } = useMessages();
  const isProfileActive = location.pathname === "/profile";
  const isAuthenticated = auth.status === "authenticated";
  const profileName = getDisplayName(auth.user?.name);
  const profileInitials = getInitials(profileName);

  // Inject live unread-chats badge into the Messages nav item
  const liveNavItems = primarySidebarItems.map((item) =>
    item.label === "Messages"
      ? { ...item, badge: unreadChatsCount || undefined }
      : item
  );

  return (
    <aside
      className="student-sidebar flex h-full min-h-0 flex-col bg-(--color-surface) px-(--sidebar-gutter) pb-3.75"
      aria-label="Student navigation"
      data-sidebar
    >
      <div className="sidebar-brand-wrapper">
        <div className="sidebar-brand flex h-10 shrink-0 items-center gap-3 px-3.75">
          <span className="sidebar-brand-mark grid size-8 place-items-center rounded-2.25 bg-(--color-brand-hover) text-white">
            <Leaf className="size-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="sidebar-brand-name truncate text-19px font-semibold text-(--color-text-primary)">
            {brand.name}
          </span>
        </div>
      </div>

      <nav className="sidebar-primary-nav mt-4" aria-label="Primary navigation">
        <ul className="space-y-(--sidebar-nav-gap)">
          {liveNavItems.map((item) => (
            <li key={item.label}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-h-3 flex-1" aria-hidden="true" />

      <nav className="sidebar-secondary-nav mb-4" aria-label="Support navigation">
        <ul className="space-y-(--sidebar-nav-gap)">
          {secondarySidebarItems.map((item) => (
            <li key={item.label}>
              <SidebarNavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative">
        {isAuthenticated ? (
          <button
            type="button"
            className={`sidebar-profile flex w-full min-h-19.5 shrink-0 items-center gap-3 rounded-2.5 bg-(--color-brand-soft) px-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring) ${
              isProfileActive
                ? "ring-2 ring-(--color-brand,#20a862)"
                : "hover:opacity-90"
            }`}
            aria-label={`View profile for ${profileName}`}
            onClick={() => navigate("/profile")}
          >
            <div className="sidebar-profile-avatar-wrap relative shrink-0">
              <span className="sidebar-profile-avatar grid size-11 shrink-0 place-items-center rounded-full bg-(--color-brand-hover) text-sm font-semibold text-white">
                {profileInitials}
              </span>
              <span className="sidebar-profile-status-dot" aria-hidden="true" />
            </div>

            <span className="sidebar-profile-copy min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-(--color-text-primary)">
                {profileName}
              </span>
              <span className="mt-1 block truncate text-xs text-(--color-text-secondary)">
                Student
              </span>
            </span>

            <ChevronRight
              className="sidebar-profile-chevron size-4 shrink-0 text-(--color-text-secondary)"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        ) : (
          <button
            type="button"
            className="sidebar-profile sidebar-profile--signin flex w-full min-h-19.5 shrink-0 items-center gap-3 rounded-2.5 bg-(--color-brand-soft) px-3 text-left transition-all duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring)"
            aria-label="Sign in to your student account"
            onClick={() => navigate("/auth/sign-in", { state: { from: "/my-courses" } })}
          >
            <div className="sidebar-profile-avatar-wrap relative shrink-0">
              <span className="sidebar-profile-avatar grid size-11 shrink-0 place-items-center rounded-full bg-(--color-brand-hover) text-sm font-semibold text-white">
                <LogIn className="size-5" aria-hidden="true" />
              </span>
            </div>

            <span className="sidebar-profile-copy min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-(--color-text-primary)">
                Sign in
              </span>
              <span className="mt-1 block truncate text-xs text-(--color-text-secondary)">
                Student access
              </span>
            </span>

            <ChevronRight
              className="sidebar-profile-chevron size-4 shrink-0 text-(--color-text-secondary)"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </aside>
  );
}
