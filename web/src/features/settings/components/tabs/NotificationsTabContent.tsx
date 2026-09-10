import React from "react";
import { Bell } from "lucide-react";
import type { NotificationPreferences } from "../../../../types/settings";

interface NotificationsTabContentProps {
  notifications: NotificationPreferences;
  onToggle: (category: keyof NotificationPreferences, channel: "email" | "push" | "sms") => void;
}

const CATEGORIES: {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}[] = [
  {
    key: "courseUpdates",
    title: "Course Updates & Announcements",
    description: "New lectures, syllabus changes, and instructor announcements.",
  },
  {
    key: "assignments",
    title: "Assignments & Deadlines",
    description: "Reminders about upcoming submissions and grading results.",
  },
  {
    key: "directMessages",
    title: "Direct Messages",
    description: "Chat notifications from peers, instructors, and study groups.",
  },
  {
    key: "communityReplies",
    title: "Community & Forum Mentions",
    description: "Replies to your questions, upvotes, and mentor feedback.",
  },
];

export const NotificationsTabContent: React.FC<NotificationsTabContentProps> = ({
  notifications,
  onToggle,
}) => {
  return (
    <div className="flex flex-col gap-3.5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">
            Notification Preferences
          </h3>
        </div>

        {/* Matrix Header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 pb-2 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">Topic</div>
          <div className="col-span-2 text-center">Email</div>
          <div className="col-span-2 text-center">Push</div>
          <div className="col-span-2 text-center">SMS</div>
        </div>

        {/* Matrix Rows */}
        <div className="divide-y divide-gray-50">
          {CATEGORIES.map((cat) => {
            const prefs = notifications[cat.key];
            return (
              <div
                key={cat.key}
                className="py-3 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2"
              >
                <div className="col-span-6">
                  <h4 className="text-xs font-bold text-gray-900">{cat.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{cat.description}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-center col-span-2">
                  <span className="text-[11px] text-gray-500 sm:hidden">Email:</span>
                  <button
                    type="button"
                    onClick={() => onToggle(cat.key, "email")}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      prefs.email ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                        prefs.email ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-center col-span-2">
                  <span className="text-[11px] text-gray-500 sm:hidden">Push:</span>
                  <button
                    type="button"
                    onClick={() => onToggle(cat.key, "push")}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      prefs.push ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                        prefs.push ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-center col-span-2">
                  <span className="text-[11px] text-gray-500 sm:hidden">SMS:</span>
                  <button
                    type="button"
                    onClick={() => onToggle(cat.key, "sms")}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      prefs.sms ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                        prefs.sms ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
