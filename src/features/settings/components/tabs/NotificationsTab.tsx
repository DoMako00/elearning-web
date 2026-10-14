import React from "react";
import { BookOpen, Users, Bell } from "lucide-react";
import type { NotificationPreferences } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface NotificationsTabProps {
  notifications: NotificationPreferences;
  onToggle: (
    group: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  onToggle,
}) => {
  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Learning Alerts */}
      <SettingsCard
        title="Learning Alerts"
        subtitle="These in-app notification preferences are saved to your account. Delivery availability depends on enabled platform notifications."
        icon={<BookOpen className="w-4 h-4 stroke-2" />}
      >
        <div className="divide-y divide-gray-100 pt-1">
          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.learningAlerts.assignmentDeadlines}
              onChange={(checked) =>
                onToggle("learningAlerts", "assignmentDeadlines", checked)
              }
              label="Assignment Deadlines"
              description="Preference saved; notification delivery is not enabled by this setting alone."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.learningAlerts.lessonReminders}
              onChange={(checked) =>
                onToggle("learningAlerts", "lessonReminders", checked)
              }
              label="Lesson Reminders"
              description="Preference saved; no reminder is sent until a platform notification is created."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.learningAlerts.dailyStreakWarnings}
              onChange={(checked) =>
                onToggle("learningAlerts", "dailyStreakWarnings", checked)
              }
              label="Daily Streak Warnings"
              description="Preference saved; no streak reminder is currently generated."
            />
          </div>
        </div>
      </SettingsCard>

      {/* 2. Social & Community */}
      <SettingsCard
        title="Social & Community"
        subtitle="Manage alerts when students interact with your posts or message you."
        icon={<Users className="w-4 h-4 stroke-2" />}
      >
        <div className="divide-y divide-gray-100 pt-1">
          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.socialCommunity.directMessages}
              onChange={(checked) =>
                onToggle("socialCommunity", "directMessages", checked)
              }
              label="New Direct Messages"
              description="Preference saved for future in-app message notifications."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.socialCommunity.mentionsInCommunity}
              onChange={(checked) =>
                onToggle("socialCommunity", "mentionsInCommunity", checked)
              }
              label="Mentions in Community"
              description="Preference saved for future in-app community notifications."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.socialCommunity.repliesToPosts}
              onChange={(checked) =>
                onToggle("socialCommunity", "repliesToPosts", checked)
              }
              label="Replies to My Posts"
              description="Preference saved for future in-app reply notifications."
            />
          </div>
        </div>
      </SettingsCard>

      {/* 3. System Alerts */}
      <SettingsCard
        title="System Alerts"
        subtitle="Critical notices about security, privacy policies, and plan renewals."
        icon={<Bell className="w-4 h-4 stroke-2" />}
      >
        <div className="divide-y divide-gray-100 pt-1">
          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.systemAlerts.securityAlerts}
              onChange={(checked) =>
                onToggle("systemAlerts", "securityAlerts", checked)
              }
              label="Security Alerts"
              description="Preference saved for future in-app security notifications."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.systemAlerts.billingUpdates}
              onChange={(checked) =>
                onToggle("systemAlerts", "billingUpdates", checked)
              }
              label="Billing Updates"
              description="Preference saved for future in-app commercial notices. No card or renewal data is stored."
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
