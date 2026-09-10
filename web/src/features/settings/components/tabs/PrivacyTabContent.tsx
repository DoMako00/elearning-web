import React from "react";
import { Eye } from "lucide-react";
import type { PrivacyPreferences } from "../../../../types/settings";

interface PrivacyTabContentProps {
  privacy: PrivacyPreferences;
  onUpdate: <K extends keyof PrivacyPreferences>(field: K, val: PrivacyPreferences[K]) => void;
}

export const PrivacyTabContent: React.FC<PrivacyTabContentProps> = ({
  privacy,
  onUpdate,
}) => {
  return (
    <div className="flex flex-col gap-3.5 max-w-3xl">
      {/* Profile Visibility */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-bold text-gray-900">
            Profile Visibility
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Control who can see your courses, achievements, and student profile.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: "public", title: "Public", desc: "Anyone on GreenLearn can view" },
            { id: "students", title: "Students Only", desc: "Only enrolled classmates" },
            { id: "private", title: "Private", desc: "Only you and your instructors" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onUpdate("profileVisibility", item.id as any)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                privacy.profileVisibility === item.id
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400"
                  : "bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-100/60"
              }`}
            >
              <span className="block text-xs font-bold leading-tight">{item.title}</span>
              <span className="block text-[10.5px] text-gray-500 mt-1 leading-tight">
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity & Direct Messages */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Online Status Indicator
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Show a green status dot to fellow study group members when you are active.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate("showActivityStatus", !privacy.showActivityStatus)}
            className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              privacy.showActivityStatus ? "bg-emerald-600" : "bg-gray-200"
            }`}
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                privacy.showActivityStatus ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Allow Direct Messaging
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Allow other students and mentors to send you direct chat requests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onUpdate("allowDirectMessages", !privacy.allowDirectMessages)}
            className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              privacy.allowDirectMessages ? "bg-emerald-600" : "bg-gray-200"
            }`}
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                privacy.allowDirectMessages ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
