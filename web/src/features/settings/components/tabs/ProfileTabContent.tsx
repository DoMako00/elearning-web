import React, { useState } from "react";
import {
  FileText,
  Edit2,
  Lock,
  Laptop,
  Users,
  Crown,
  ChevronRight,
  Download,
  UserCheck,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import type {
  StudentProfileData,
  DeviceSession,
  SubscriptionPlan,
} from "../../../../types/settings";
import {
  UNIVERSITIES,
  ACADEMIC_YEARS,
  MAJORS,
} from "../../data/settingsMockData";

interface ProfileTabContentProps {
  profile: StudentProfileData;
  onUpdateProfile: <K extends keyof StudentProfileData>(
    field: K,
    value: StudentProfileData[K]
  ) => void;
  devices: DeviceSession[];
  subscription: SubscriptionPlan;
  contactSubTab: "email" | "phone";
  setContactSubTab: (tab: "email" | "phone") => void;
  newContactValue: string;
  setNewContactValue: (val: string) => void;
  onChangePhotoClick: () => void;
  onChangePasswordClick: () => void;
  onManageDevicesClick: () => void;
  onCloseAccountClick: () => void;
  onSendVerificationCode: () => void;
  onDownloadDataClick: () => void;
  onSwitchAccountClick: () => void;
  onViewPlansClick: () => void;
}

export const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  profile,
  onUpdateProfile,
  devices,
  subscription,
  contactSubTab,
  setContactSubTab,
  newContactValue,
  setNewContactValue,
  onChangePhotoClick,
  onChangePasswordClick,
  onManageDevicesClick,
  onCloseAccountClick,
  onSendVerificationCode,
  onDownloadDataClick,
  onSwitchAccountClick,
  onViewPlansClick,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const currentDevice = devices.find((d) => d.isCurrent) || devices[0];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-3.5 w-full">
      {/* ── LEFT MAIN COLUMN (~65% width) ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* 1. Profile Information Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between h-fit">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                  Profile Information
                </h3>
                <p className="text-[11px] text-gray-500">
                  Keep your information up to date. This will be used across your learning experience.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditingProfile ? "Save" : "Edit"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar & Change photo button */}
            <div className="flex flex-col items-center gap-2 shrink-0 self-center sm:self-auto">
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-xs">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={onChangePhotoClick}
                  aria-label="Change photo icon"
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-emerald-700 cursor-pointer z-100"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={onChangePhotoClick}
                className="px-3 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                Change photo
              </button>
              <span className="text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
            </div>

            {/* Profile Input Grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profile.fullName}
                  onChange={(e) => onUpdateProfile("fullName", e.target.value)}
                  className="w-full h-8.5 px-2.5 text-xs bg-gray-50/70 disabled:bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  disabled
                  value={profile.studentId}
                  className="w-full h-8.5 px-2.5 text-xs bg-gray-100/80 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed font-mono"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full h-8.5 px-2.5 text-xs bg-gray-100/80 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Phone number
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="h-8.5 px-2 bg-gray-100/80 border border-gray-200 rounded-lg flex items-center gap-1 text-xs text-gray-700 shrink-0">
                    <span>{profile.phoneCountryFlag}</span>
                    <span>{profile.phoneCountryCode}</span>
                  </div>
                  <input
                    type="tel"
                    disabled={!isEditingProfile}
                    value={profile.phoneNumber}
                    onChange={(e) => onUpdateProfile("phoneNumber", e.target.value)}
                    className="flex-1 h-8.5 px-2.5 text-xs bg-gray-50/70 disabled:bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0"
                  />
                </div>
              </div>

              {/* University */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  University
                </label>
                <select
                  disabled={!isEditingProfile}
                  value={profile.university}
                  onChange={(e) => onUpdateProfile("university", e.target.value)}
                  className="w-full h-8.5 px-2 text-xs bg-gray-50/70 disabled:bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {UNIVERSITIES.map((u: string) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year & Major */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Academic Year
                  </label>
                  <select
                    disabled={!isEditingProfile}
                    value={profile.academicYear}
                    onChange={(e) => onUpdateProfile("academicYear", e.target.value)}
                    className="w-full h-8.5 px-1.5 text-xs bg-gray-50/70 disabled:bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {ACADEMIC_YEARS.map((y: string) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Major
                  </label>
                  <select
                    disabled={!isEditingProfile}
                    value={profile.major}
                    onChange={(e) => onUpdateProfile("major", e.target.value)}
                    className="w-full h-8.5 px-1.5 text-xs bg-gray-50/70 disabled:bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {MAJORS.map((m: string) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Change Email or Phone Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Change Email or Phone
              </h3>
              <p className="text-[11px] text-gray-500">
                For security, we'll send a verification code to your new contact information.
              </p>
            </div>
          </div>

          {/* Subtabs: Change Email / Change Phone */}
          <div className="flex items-center gap-3 border-b border-gray-100 mb-2.5">
            <button
              type="button"
              onClick={() => {
                setContactSubTab("email");
                setNewContactValue("");
              }}
              className={`pb-1.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${contactSubTab === "email"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
            >
              Change Email
            </button>
            <button
              type="button"
              onClick={() => {
                setContactSubTab("phone");
                setNewContactValue("");
              }}
              className={`pb-1.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${contactSubTab === "phone"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
            >
              Change Phone
            </button>
          </div>

          {/* Form Input + CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type={contactSubTab === "email" ? "email" : "tel"}
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
              placeholder={
                contactSubTab === "email"
                  ? "Enter your new email address"
                  : "Enter your new phone number"
              }
              className="flex-1 w-full h-9 px-3 text-xs bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={onSendVerificationCode}
              className="w-full sm:w-auto h-9 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Send verification code
            </button>
          </div>
        </div>

        {/* 3. Password Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Password
              </h3>
              <p className="text-[11px] text-gray-500">
                Use a strong password to keep your account secure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onChangePasswordClick}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Change password
          </button>
        </div>
      </div>

      {/* ── RIGHT COLUMN (~35% width) ── */}
      <div className="w-full lg:w-77.5 xl:w-82.5 flex flex-col gap-3 shrink-0">
        {/* 1. Devices & Access Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                Devices & Access
              </h4>
            </div>
            <button
              type="button"
              onClick={onManageDevicesClick}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Manage devices
            </button>
          </div>
          <p className="text-[10.5px] text-gray-400 mb-2.5">
            Your account can only be active on one device at a time.
          </p>

          {/* Current Device pill widget */}
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {currentDevice.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                    (Current Device)
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  {currentDevice.browser} • {currentDevice.os} • {currentDevice.location}
                </p>
                <p className="text-[9.5px] text-gray-400 mt-0.5">
                  Last active: {currentDevice.lastActive}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded-full shrink-0">
              This device
            </span>
          </div>
        </div>

        {/* 2. Need to use multiple devices? CTA Banner */}
        <div className="p-3 rounded-2xl bg-linear-to-r from-emerald-50 via-[#ecfbf2] to-[#e1f7ea] border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
                Need to use multiple devices?
              </h4>
              <p className="text-[10.5px] text-gray-600 truncate mt-0.5">
                Upgrade to a Friends Plan to add more seats and devices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewPlansClick}
            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-300 rounded-lg transition-colors shrink-0 shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <span>View Plans</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 3. Subscription & Plan Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-2xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                Subscription & Plan
              </h4>
            </div>
            <button
              type="button"
              onClick={onViewPlansClick}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              View details
            </button>
          </div>
          <p className="text-[10.5px] text-gray-400">
            Manage your plan, seats, and billing information.
          </p>

          {/* Active plan card */}
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white text-emerald-700 flex items-center justify-center shadow-2xs shrink-0">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-900">{subscription.name}</h5>
                <p className="text-[10px] text-gray-500">
                  {subscription.seats} seat • {subscription.duration}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full">
                {subscription.status}
              </span>
              <p className="text-[9.5px] text-gray-400 mt-1">
                Renews on {subscription.renewDate}
              </p>
            </div>
          </div>

          {/* Action rows */}
          <div className="divide-y divide-gray-50 text-xs">
            <button
              type="button"
              onClick={onViewPlansClick}
              className="w-full py-2 flex items-center justify-between text-left hover:bg-gray-50/70 -mx-1 px-1 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="min-w-0 pr-2">
                <h6 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors text-xs">
                  Upgrade to Friends Plan
                </h6>
                <p className="text-[10px] text-gray-400 truncate">
                  Add more seats for family or friends.
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
            </button>

            <button
              type="button"
              onClick={onViewPlansClick}
              className="w-full py-2 flex items-center justify-between text-left hover:bg-gray-50/70 -mx-1 px-1 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="min-w-0 pr-2">
                <h6 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors text-xs">
                  Billing & Payment Methods
                </h6>
                <p className="text-[10px] text-gray-400 truncate">
                  Manage your payment methods and view invoices.
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* 4. Account Actions Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-2xs flex flex-col gap-2">
          <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
            Account Actions
          </h4>
          <p className="text-[10.5px] text-gray-400">Other account related actions.</p>

          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              type="button"
              onClick={onDownloadDataClick}
              className="p-2 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/60 hover:bg-emerald-50/30 text-left transition-colors cursor-pointer flex flex-col justify-between"
            >
              <Download className="w-3.5 h-3.5 text-gray-500 mb-1" />
              <div>
                <span className="block text-[11px] font-bold text-gray-800 leading-tight">
                  Download My Data
                </span>
                <span className="block text-[9.5px] text-gray-400 mt-0.5 leading-tight">
                  Get a copy of learning data.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onSwitchAccountClick}
              className="p-2 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/60 hover:bg-emerald-50/30 text-left transition-colors cursor-pointer flex flex-col justify-between"
            >
              <UserCheck className="w-3.5 h-3.5 text-gray-500 mb-1" />
              <div>
                <span className="block text-[11px] font-bold text-gray-800 leading-tight">
                  Switch Account
                </span>
                <span className="block text-[9.5px] text-gray-400 mt-0.5 leading-tight">
                  Sign out and use a different account.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onCloseAccountClick}
              className="p-2 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-left transition-colors cursor-pointer flex flex-col justify-between"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 mb-1" />
              <div>
                <span className="block text-[11px] font-bold text-rose-700 leading-tight">
                  Close Account
                </span>
                <span className="block text-[9.5px] text-rose-500/80 mt-0.5 leading-tight">
                  Permanently delete account.
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
