import React from "react";
import { Settings, Bell, Key, User, Palette } from "lucide-react";

export const SettingsTab: React.FC = () => {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mb-2.5">
          <Settings className="size-5" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Profile Settings</h3>
        <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Account preferences, notifications, security credentials, and LMS integration settings can be configured here in upcoming updates.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1 text-xs text-gray-600">
            <User className="size-3 text-gray-400" />
            <span>Profile Data</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1 text-xs text-gray-600">
            <Bell className="size-3 text-gray-400" />
            <span>Notifications</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1 text-xs text-gray-600">
            <Key className="size-3 text-gray-400" />
            <span>Security & 2FA</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1 text-xs text-gray-600">
            <Palette className="size-3 text-gray-400" />
            <span>Appearance</span>
          </span>
        </div>
      </div>
    </div>
  );
};
