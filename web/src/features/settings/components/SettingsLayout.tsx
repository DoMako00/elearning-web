import React from "react";
import type { SettingsTabId } from "../../../types/settings";
import { SettingsTabNav } from "./SettingsTabNav";

interface SettingsLayoutProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  rightSidebar,
}) => {
  return (
    <div className="w-full h-auto  md:h-screen md:overflow-hidden flex flex-col min-h-0 bg-transparent">
      {/* Scrollable container strictly for desktop vs mobile */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-1 pb-6 px-1">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 w-full">
          {/* ── MAIN CONTENT COLUMN ── */}
          <div className="flex-1 flex flex-col gap-3.5 min-w-0">
            {/* Settings Hero Banner matching design */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#f4fbf7] via-[#eef9f3] to-[#e4f6ec] border border-[#d6eedf] px-5 py-4 flex items-center justify-between shadow-2xs shrink-0">
              {/* Decorative soft green organic blur shapes */}
              <div className="absolute -right-8 -top-12 w-48 h-48 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute right-32 -bottom-10 w-36 h-36 bg-emerald-100/50 rounded-full blur-xl pointer-events-none" />

              {/* Left: Heading & Subtitle */}
              <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  Settings
                </h1>
                <p className="text-xs sm:text-[13px] text-gray-500 mt-1">
                  Manage your account, security, devices, and preferences.
                </p>
              </div>

              {/* Right: Motivational badge with decorative plant leaf */}
              <div className="relative z-10 hidden sm:flex text-left items-center gap-3">
                <div className="text-left">
                  <p className="text-xs text-gray-400 leading-snug">A better</p>
                  <p className="text-xs font-medium text-gray-600 leading-snug">
                    learning experience
                  </p>
                  <p className="text-xs font-medium text-gray-600 leading-snug">
                    starts with you
                  </p>
                  <div className="w-4 h-0.5 bg-emerald-500 mt-1 mr-auto rounded-full" />
                </div>

                {/* Decorative soft green leaf SVG */}
                <div className="w-12 h-14 text-emerald-300/80 shrink-0 select-none pointer-events-none">
                  <svg viewBox="0 0 48 56" fill="currentColor" className="w-full h-full opacity-60">
                    <path
                      d="M24 0C24 0 40 12 40 28C40 44 26 56 24 56C22 56 8 44 8 28C8 12 24 0 24 0Z"
                      fill="url(#leaf-grad-settings)"
                    />
                    <path
                      d="M24 6V50M24 20L34 26M24 30L34 36M24 20L14 26M24 30L14 36"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.4"
                    />
                    <defs>
                      <linearGradient id="leaf-grad-settings" x1="24" y1="0" x2="24" y2="56" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a7f3d0" stopOpacity="0.7" />
                        <stop stopColor="#34d399" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Fixed Tab Navigation Map */}
            <div className="py-1 shrink-0">
              <SettingsTabNav activeTab={activeTab} onTabChange={onTabChange} />
            </div>

            {/* Dynamic Tab Content Area */}
            <div className="pt-1">
              {children}
            </div>
          </div>

          {/* ── RIGHT COLUMN (starts from the top) ── */}
          {rightSidebar && (
            <div className="w-full lg:w-84 xl:w-90 shrink-0">
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
