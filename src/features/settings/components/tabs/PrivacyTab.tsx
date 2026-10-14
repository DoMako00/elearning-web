import React from "react";
import { Eye, Activity, Database } from "lucide-react";
import { SettingsCard } from "../common/SettingsCard";

export const PrivacyTab: React.FC = () => (
  <div className="flex flex-col gap-4 max-w-4xl">
    <SettingsCard title="Profile Visibility" subtitle="Profile access follows the account and course permissions enforced by the platform." icon={<Eye className="w-4 h-4 stroke-2" />}>
      <p className="pt-1 text-xs leading-relaxed text-gray-600">There is no separate profile-visibility preference stored for this account.</p>
    </SettingsCard>
    <SettingsCard title="Online Presence" subtitle="Presence indicators are not a configurable Student account setting." icon={<Activity className="w-4 h-4 stroke-2" />}>
      <p className="pt-1 text-xs leading-relaxed text-gray-600">The application does not publish a real-time online status from this screen.</p>
    </SettingsCard>
    <SettingsCard title="Data Usage & Insights" subtitle="No optional analytics or personalization preference is currently persisted here." icon={<Database className="w-4 h-4 stroke-2" />}>
      <p className="pt-1 text-xs leading-relaxed text-gray-600">Learning activity required for course progress is handled by the platform. This page does not claim to change data-processing preferences.</p>
    </SettingsCard>
  </div>
);
