import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, ChevronDown, Leaf } from "lucide-react";
import { XPPill } from "./common/XPPill";
import { useBrand } from "../../app/providers/BrandProvider";
import { useStudentNotifications } from "../../features/student/api/useStudentNotifications";
import { useStudentProfile } from "../../features/student/api/useStudentLearning";
import { useOptionalScreenStack } from "./ScreenStack";

function initialsFor(name: string | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export interface TopAppBarProps {
  variant?: "main" | "detail";
  title?: string;
  backLabel?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  /** Overrides the unread state derived from the real notifications feed. */
  hasUnreadNotification?: boolean;
  /** Shown only when a real XP balance is supplied; XP is not tracked yet. */
  xp?: number;
  /** Shown only when a real profile photo URL is supplied; otherwise initials. */
  avatarUrl?: string;
  onNotificationClick?: () => void;
  onAvatarClick?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  variant = "main",
  title,
  backLabel,
  onBack,
  rightSlot,
  hasUnreadNotification,
  xp,
  avatarUrl,
  onNotificationClick,
  onAvatarClick,
}) => {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const notificationsQuery = useStudentNotifications();
  const profileQuery = useStudentProfile();
  const unreadCount = (notificationsQuery.data ?? []).filter((item) => item.readAt === null).length;
  const showUnread = hasUnreadNotification ?? unreadCount > 0;
  const fullName = profileQuery.data?.fullName;
  // Screens pushed on top of a tab (Assignments, Help, Messages, Community)
  // render the main bar too; they always need a way back.
  const screenStack = useOptionalScreenStack();
  const canGoBack = variant === "main" && Boolean(screenStack?.canPop);
  return (
    <header
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-2xs select-none"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
      }}
    >
      {/* mobile-topbar-inner → shrinks to h-11 on ≤375px via mobile-se.css */}
      <div className="mobile-topbar-inner h-10 px-3.5 flex items-center justify-between gap-2">
        {variant === "main" ? (
          <>
            {/* Left: back (when pushed) + logo */}
            <div className="flex items-center gap-2 min-w-0">
              {canGoBack ? (
                <button
                  type="button"
                  onClick={() => screenStack?.pop()}
                  aria-label="Back"
                  className="-ml-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-emerald-600 hover:bg-emerald-50/70 focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.4]" aria-hidden="true" />
                </button>
              ) : null}
              <span className="mobile-topbar-logo-icon w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Leaf className="w-3 h-3" strokeWidth={2.2} />
              </span>
              <span className="mobile-topbar-wordmark text-sm font-extrabold text-slate-900 tracking-tight">
                {brand.name}
              </span>
            </div>

            {/* Right: Bell, XPPill, Avatar */}
            <div className="mobile-topbar-right flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onNotificationClick ?? (() => navigate("/notifications"))}
                aria-label={showUnread && unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                className="mobile-topbar-bell relative min-w-11 min-h-11 inline-flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <Bell className="w-4 h-4" strokeWidth={1.9} aria-hidden="true" />
                {showUnread && (
                  <span
                    className="bell-dot absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </button>

              {typeof xp === "number" ? <XPPill xp={xp} /> : null}

              <button
                type="button"
                onClick={onAvatarClick ?? (() => navigate("/profile"))}
                aria-label="Open your profile"
                className="flex items-center gap-0.5 min-h-11 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <div className="mobile-topbar-avatar w-7 h-7 rounded-full overflow-hidden border border-emerald-500/80 shadow-2xs bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : <span aria-hidden="true">{initialsFor(fullName)}</span>}
                </div>
                <ChevronDown className="mobile-topbar-avatar-chevron w-3 h-3 text-slate-400" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Detail variant */}
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel ? `Back to ${backLabel}` : "Back"}
                className="inline-flex min-h-11 items-center gap-1 py-1.5 px-2 -ml-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
                {backLabel && (
                  <span className="text-xs font-bold leading-none truncate max-w-28">
                    {backLabel}
                  </span>
                )}
              </button>

              {title && (
                <h1 className="text-sm font-bold text-slate-900 truncate pl-1">
                  {title}
                </h1>
              )}
            </div>

            {rightSlot && (
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                {rightSlot}
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};
