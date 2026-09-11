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
        subtitle="Stay updated on coursework milestones, daily practice, and due dates."
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
              description="Receive prompts 24 hours and 2 hours before submission deadlines."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.learningAlerts.lessonReminders}
              onChange={(checked) =>
                onToggle("learningAlerts", "lessonReminders", checked)
              }
              label="Lesson Reminders"
              description="Get nudges for upcoming live sessions and unfinished lesson modules."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.learningAlerts.dailyStreakWarnings}
              onChange={(checked) =>
                onToggle("learningAlerts", "dailyStreakWarnings", checked)
              }
              label="Daily Streak Warnings"
              description="Keep your XP streak alive with evening reminders if you haven't studied today."
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
              description="Notify when study partners or teachers message your inbox."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.socialCommunity.mentionsInCommunity}
              onChange={(checked) =>
                onToggle("socialCommunity", "mentionsInCommunity", checked)
              }
              label="Mentions in Community"
              description="Get alerted when another student tags @you in forum threads."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.socialCommunity.repliesToPosts}
              onChange={(checked) =>
                onToggle("socialCommunity", "repliesToPosts", checked)
              }
              label="Replies to My Posts"
              description="Alert whenever someone answers your questions or comments."
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
              description="Important notifications about unrecognized logins and password resets."
            />
          </div>

          <div className="py-2.5">
            <ToggleSwitch
              checked={notifications.systemAlerts.billingUpdates}
              onChange={(checked) =>
                onToggle("systemAlerts", "billingUpdates", checked)
              }
              label="Billing Updates"
              description="Receipts, invoice summaries, and payment method expirations."
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
