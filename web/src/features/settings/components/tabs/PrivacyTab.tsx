import React from "react";
import { Eye, Activity, Database } from "lucide-react";
import type { PrivacyPreferences } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface PrivacyTabProps {
  privacy: PrivacyPreferences;
  onUpdate: <K extends keyof PrivacyPreferences>(
    key: K,
    value: PrivacyPreferences[K]
  ) => void;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({ privacy, onUpdate }) => {
  const visibilityOptions: {
    value: PrivacyPreferences["profileVisibility"];
    title: string;
    description: string;
  }[] = [
    {
      value: "public",
      title: "Public",
      description: "Visible to everyone across all institutions and search engines.",
    },
    {
      value: "students",
      title: "Students Only",
      description: "Only verified enrolled students and teachers on GreenLearn can see your profile.",
    },
    {
      value: "private",
      title: "Private",
      description: "Completely hidden. Only instructors whose courses you are enrolled in can view basic details.",
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Profile Visibility (Radio Group) */}
      <SettingsCard
        title="Profile Visibility"
        subtitle="Determine who can discover your learning portfolio and achievements."
        icon={<Eye className="w-4 h-4 stroke-2" />}
      >
        <div className="space-y-2.5 pt-1">
          {visibilityOptions.map((opt) => {
            const isSelected = privacy.profileVisibility === opt.value;
            return (
              <label
                key={opt.value}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs"
                    : "bg-gray-50/50 border-gray-100 hover:bg-gray-50/90"
                }`}
              >
                <input
                  type="radio"
                  name="profileVisibility"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => onUpdate("profileVisibility", opt.value)}
                  className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <span className="block text-xs sm:text-[13px] font-bold text-gray-900 leading-tight">
                    {opt.title}
                  </span>
                  <span className="block text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {opt.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </SettingsCard>

      {/* 2. Online Status (Toggle Switch) */}
      <SettingsCard
        title="Online Presence"
        subtitle="Control real-time activity indicators visible to classmates."
        icon={<Activity className="w-4 h-4 stroke-2" />}
      >
        <div className="pt-1">
          <ToggleSwitch
            checked={privacy.showOnlineStatus}
            onChange={(checked) => onUpdate("showOnlineStatus", checked)}
            label="Show when I am online"
            description="Disabling this will hide your presence in the Community and Messages tabs."
          />
        </div>
      </SettingsCard>

      {/* 3. Data Usage & Telemetry (Checkboxes) */}
      <SettingsCard
        title="Data Usage & Insights"
        subtitle="Help us tune recommendations and system stability while maintaining anonymity."
        icon={<Database className="w-4 h-4 stroke-2" />}
      >
        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={privacy.allowTelemetry}
              onChange={(e) => onUpdate("allowTelemetry", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 accent-emerald-600 cursor-pointer"
            />
            <div>
              <span className="block text-xs sm:text-[13px] font-semibold text-gray-800 leading-tight">
                Allow anonymous telemetry to improve course recommendations
              </span>
              <span className="block text-[11px] text-gray-500 mt-0.5">
                Aggregated watch time and quiz performance metrics are anonymized before model processing.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-gray-100">
            <input
              type="checkbox"
              checked={privacy.allowPersonalization}
              onChange={(e) => onUpdate("allowPersonalization", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 accent-emerald-600 cursor-pointer"
            />
            <div>
              <span className="block text-xs sm:text-[13px] font-semibold text-gray-800 leading-tight">
                Personalized study plan reminders
              </span>
              <span className="block text-[11px] text-gray-500 mt-0.5">
                Allows AI engines to recommend specific anatomical models and quizzes based on prior errors.
              </span>
            </div>
          </label>
        </div>
      </SettingsCard>
    </div>
  );
};
