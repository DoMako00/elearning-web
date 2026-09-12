import React from "react";
import { Bell, ChevronLeft, ChevronDown, Leaf } from "lucide-react";
import { XPPill } from "./common/XPPill";

export interface TopAppBarProps {
  variant?: "main" | "detail";
  title?: string;
  backLabel?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  hasUnreadNotification?: boolean;
  xp?: number;
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
  hasUnreadNotification = true,
  xp = 2450,
  avatarUrl = "https://i.pravatar.cc/112?img=47",
  onNotificationClick,
  onAvatarClick,
}) => {
  return (
    <header
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-2xs select-none"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="h-13 px-3.5 flex items-center justify-between gap-2.5">
        {variant === "main" ? (
          <>
            {/* Left: Green logo mark + "GreenLearn" wordmark */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Leaf className="w-4.5 h-4.5" strokeWidth={2.2} />
              </span>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                GreenLearn
              </span>
            </div>

            {/* Right: Bell with unread dot, XPPill, Avatar with chevron */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notifications bell */}
              <button
                type="button"
                onClick={onNotificationClick}
                aria-label="Notifications"
                className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" strokeWidth={1.9} />
                {hasUnreadNotification && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
                    aria-label="Unread notifications"
                  />
                )}
              </button>

              {/* XP Pill */}
              <XPPill xp={xp} />

              {/* Avatar + small chevron */}
              <button
                type="button"
                onClick={onAvatarClick}
                aria-label="User profile menu"
                className="flex items-center gap-0.5 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/80 shadow-2xs">
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Detail variant */}
            {/* Left: Back button + optional label */}
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel ? `Back to ${backLabel}` : "Back"}
                className="inline-flex items-center gap-1 py-1.5 px-2 -ml-2 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
                {backLabel && (
                  <span className="text-xs font-bold leading-none truncate max-w-28">
                    {backLabel}
                  </span>
                )}
              </button>

              {/* Center / Adjacent title */}
              {title && (
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate pl-1">
                  {title}
                </h1>
              )}
            </div>

            {/* Right: Optional contextual slot */}
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
