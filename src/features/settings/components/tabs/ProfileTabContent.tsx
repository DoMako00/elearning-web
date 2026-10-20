import React, { useState } from "react";
import {
  FileText,
  Edit2,
  Camera,
  Lock,
  Laptop,
  Users,
  Crown,
  ChevronRight,
  ChevronDown,
  Download,
  UserCheck,
  Trash2,
  ArrowRight,
  Shield,
} from "lucide-react";
import type {
  StudentProfileData,
  DeviceSession,
  SubscriptionPlan,
} from "../../../../types/settings";

interface ProfileTabContentProps {
  profile: StudentProfileData;
  onUpdateProfile: <K extends keyof StudentProfileData>(
    field: K,
    value: StudentProfileData[K]
  ) => void;
  onSaveProfile?: () => Promise<void>;
  devices: DeviceSession[];
  subscription: SubscriptionPlan;
  contactSubTab: "email" | "phone";
  setContactSubTab: (tab: "email" | "phone") => void;
  newContactValue: string;
  setNewContactValue: (val: string) => void;
  onChangePhotoClick: () => void;
  onManageDevicesClick: () => void;
  onCloseAccountClick: () => void;
  onSendVerificationCode: () => void;
  onVerifyEmail: () => void;
  emailCode: string;
  setEmailCode: (code:string) => void;
  emailFlowStep: "idle" | "current" | "new";
  linkedEmail?: string;
  onDownloadDataClick: () => void;
  onSwitchAccountClick: () => void;
  onViewPlansClick: () => void;
  leftColumnOnly?: boolean;
  rightColumnOnly?: boolean;
  /** Render only the verified email change card. */
  contactChangeOnly?: boolean;
}

export const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  profile,
  onUpdateProfile,
  onSaveProfile,
  devices,
  subscription,
  contactSubTab,
  setContactSubTab,
  newContactValue,
  setNewContactValue,
  onChangePhotoClick,
  onManageDevicesClick,
  onCloseAccountClick,
  onSendVerificationCode,
  onVerifyEmail,
  emailCode,
  setEmailCode,
  emailFlowStep,
  linkedEmail,
  onDownloadDataClick,
  onSwitchAccountClick,
  onViewPlansClick,
  leftColumnOnly,
  rightColumnOnly,
  contactChangeOnly,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const currentDevice = devices.find((d) => d.isCurrent) || devices[0];

  // The verified email link/change flow. Exposed on its own so the desktop
  // Settings page can render it (it previously lived only in a column that
  // was never mounted).
  const contactChangeCard = (
    <>
        {/* 2. Change Email or Phone Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Change Email or Phone
              </h3>
              <p className="text-[11px] text-gray-500">
                Email becomes a login method only after you verify ownership. Phone is optional contact information and never receives sign-in codes.
              </p>
              {contactSubTab === "email" && <p className="text-[11px] text-gray-600 mt-1">Verified login email: {linkedEmail || "Not linked yet"}</p>}
            </div>
          </div>

          {/* Subtabs: Change Email / Change Phone */}
          <div className="flex items-center gap-4 border-b border-gray-100 mb-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setContactSubTab("email");
                setNewContactValue("");
              }}
              className={`pb-1.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                contactSubTab === "email"
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
              className={`pb-1.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
                contactSubTab === "phone"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              Change Phone
            </button>
          </div>

          {/* Form Input + CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {contactSubTab === "email" && emailFlowStep !== "idle" ? <>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/\D/g,""))} placeholder={emailFlowStep === "current" ? "Code sent to your current verified email" : "Code sent to the new email"} className="flex-1 w-full h-9.5 px-3.5 text-xs bg-gray-50/70 border border-gray-200/90 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white placeholder-gray-400 shadow-2xs transition-all" />
            <button type="button" onClick={onVerifyEmail} className="w-full sm:w-auto h-9.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap">{emailFlowStep === "current" ? "Continue securely" : "Verify new email"}</button>
            </> : <>
            <input
              type={contactSubTab === "email" ? "email" : "tel"}
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
              placeholder={
                contactSubTab === "email"
                  ? "Enter your new email address"
                  : "Enter your new phone number"
              }
              className="flex-1 w-full h-9.5 px-3.5 text-xs bg-gray-50/70 border border-gray-200/90 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white placeholder-gray-400 shadow-2xs transition-all"
            />
            <button
              type="button"
              onClick={onSendVerificationCode}
              className="w-full sm:w-auto h-9.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Send verification code
            </button>
            </>}
          </div>
        </div>
    </>
  );

  const leftColumn = (
    <div className="flex flex-col gap-3 min-w-0 w-full">
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
              onClick={() => { if(isEditingProfile){void onSaveProfile?.().then(()=>setIsEditingProfile(false));return;}setIsEditingProfile(true); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditingProfile ? "Save" : "Edit"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar & Change photo button */}
            <div className="flex flex-col items-center gap-2 shrink-0 self-center sm:self-auto">
              <div className="relative w-22 h-22 sm:w-24 sm:h-24">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-xs">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" /> : <span className="w-full h-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">{profile.fullName.trim().charAt(0) || "?"}</span>}
                </div>
                <button
                  type="button"
                  onClick={onChangePhotoClick}
                  disabled
                  aria-label="Change photo icon"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-emerald-700 cursor-pointer transition-transform hover:scale-105"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
                <button
                type="button"
                onClick={onChangePhotoClick}
                  disabled
                className="px-3.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 rounded-xl transition-colors cursor-pointer"
              >
                Change photo
              </button>
              <span className="text-[10px] text-gray-400">Profile photo uploads are not enabled.</span>
            </div>

            {/* Profile Input Grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profile.fullName}
                  onChange={(e) => onUpdateProfile("fullName", e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-gray-50/80 disabled:bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  disabled
                  value={profile.studentId}
                  className="w-full h-9 px-3 text-xs bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-500 cursor-not-allowed font-mono shadow-2xs"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Verified login email
                </label>
                <input
                  type="text"
                  disabled
                  value={linkedEmail ?? ""}
                  placeholder="No verified email linked"
                  className="w-full h-9 px-3 text-xs bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-500 cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Phone number
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="h-9 px-2.5 bg-gray-50/80 border border-gray-200/90 rounded-xl flex items-center gap-1.5 text-xs text-gray-700 shrink-0 shadow-2xs">
                    <span>{profile.phoneCountryFlag}</span>
                    <span className="font-medium">{profile.phoneCountryCode}</span>
                  </div>
                  <input
                    type="tel"
                    disabled={!isEditingProfile}
                    value={profile.phoneNumber}
                    onChange={(e) => onUpdateProfile("phoneNumber", e.target.value)}
                    className="flex-1 h-9 px-3 text-xs bg-gray-50/80 disabled:bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all min-w-0 shadow-2xs"
                  />
                </div>
              </div>

              {/* University */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  University
                </label>
                <div className="relative">
                  <select
                    disabled
                    value={profile.university}
                    className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 disabled:bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
                  >
                    <option value={profile.university}>{profile.university || "Unavailable"}</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Academic Year & Major */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={profile.academicYear}
                      className="w-full h-9 pl-2.5 pr-7 text-xs bg-gray-50/80 disabled:bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
                    >
                      <option value={profile.academicYear}>{profile.academicYear || "Unavailable"}</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Major
                  </label>
                  <div className="relative">
                    <select
                      disabled
                      value={profile.major}
                      className="w-full h-9 pl-2.5 pr-7 text-xs bg-gray-50/80 disabled:bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
                    >
                      <option value={profile.major}>{profile.major || "Not provided"}</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {contactChangeCard}

        {/* 3. Sign-in method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Sign-in method
              </h3>
              <p className="text-[11px] text-gray-500">
                {linkedEmail ? `Verified email OTP${linkedEmail ? ` · ${linkedEmail}` : ""}` : "No verified email is linked. Account activation credentials are used until you link a real email."}
              </p>
            </div>
          </div>
        </div>
    </div>
  );

  const rightColumn = (
    <div className="w-full lg:w-84 xl:w-90 flex flex-col gap-3 shrink-0">
        {/* 1. Devices & Access Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Laptop className="w-4 h-4 stroke-2" />
              </div>
              <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                Devices & Access
              </h4>
            </div>
            <button
              type="button"
              onClick={onManageDevicesClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Manage devices</span>
            </button>
          </div>
            <p className="text-[11px] text-gray-500 mb-3">
            Device slots and replacement eligibility are controlled by your current Seat.
          </p>

          {/* Current Device pill widget */}
          <div className="p-3 rounded-xl border border-emerald-100 bg-[#f4fcf7] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white text-gray-700 border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                <Laptop className="w-4 h-4 text-gray-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {currentDevice?.name ?? "No active device record"}
                  </span>
                  {currentDevice?.isCurrent && <span className="text-[10.5px] font-semibold text-emerald-700 flex items-center gap-1">(Current Device)<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /></span>}
                </div>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  {[currentDevice?.browser,currentDevice?.os].filter(Boolean).join(" • ") || "No current session details returned"}
                </p>
                <p className="text-[9.5px] text-gray-400 mt-0.5">
                  {currentDevice?.lastActive ? `Last active: ${currentDevice.lastActive}` : ""}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-200/80 rounded-full shrink-0">
              This device
            </span>
          </div>
        </div>

        {/* 2. Seat and device policy */}
        <div className="p-3.5 rounded-2xl bg-[#f0fbf5] border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
                Device and Seat policy
              </h4>
              <p className="text-[11px] text-gray-600 truncate mt-0.5">
                Access is based on the assigned Semester Offering Seat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewPlansClick}
            disabled
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-300 rounded-xl transition-all shrink-0 shadow-2xs flex items-center gap-1 cursor-pointer hover:shadow-xs"
          >
            <span>Admin managed</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 3. Subscription & Plan Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 stroke-2" />
              </div>
              <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
                Subscription & Plan
              </h4>
            </div>
            <button
              type="button"
              onClick={onViewPlansClick}
              disabled
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
            >
              View details
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Review your assigned Offering. Purchases and seat changes are managed by an authorized Admin.
          </p>

          {/* Active plan card */}
          <div className="p-3 rounded-xl border border-emerald-100 bg-[#f4fcf7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-2xs shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-900">{subscription.name}</h5>
                <p className="text-[10.5px] text-gray-500">
                  {subscription.seats} seat • {subscription.duration}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full">
                {subscription.status}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                Term ends {subscription.renewDate}
              </p>
            </div>
          </div>

          {/* Action rows */}
          <div className="divide-y divide-gray-100 text-xs mt-1">
            <button
              type="button"
              onClick={onViewPlansClick}
              disabled
              title="Seat changes are managed by an authorized Admin."
              className="w-full py-2.5 flex items-center justify-between text-left hover:bg-gray-50/70 -mx-1 px-1 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-6 h-6 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h6 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors text-xs">
                    Seat changes
                  </h6>
                  <p className="text-[10.5px] text-gray-400 truncate">
                    Seat assignment is managed by an authorized Admin.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            </button>

            <button
              type="button"
              onClick={onViewPlansClick}
              disabled
              className="w-full py-2.5 flex items-center justify-between text-left hover:bg-gray-50/70 -mx-1 px-1 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-6 h-6 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h6 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors text-xs">
                    Manual payment review
                  </h6>
                  <p className="text-[10.5px] text-gray-400 truncate">
                    There are no stored cards or automatic renewals.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            </button>
          </div>
        </div>

        {/* 4. Account Actions Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gray-900">
              Account Actions
            </h4>
          </div>
          <p className="text-[11px] text-gray-500">Other account related actions.</p>

          <div className="grid grid-cols-3 gap-2.5 mt-1">
            <button
              type="button"
              onClick={onDownloadDataClick}
              disabled
              className="p-2.5 rounded-xl border border-gray-100 hover:border-emerald-300 bg-[#f9fafb] hover:bg-emerald-50/40 text-left transition-all cursor-pointer flex flex-col justify-between min-h-20 shadow-2xs"
            >
              <Download className="w-4 h-4 text-gray-600 mb-2" />
              <div>
                <span className="block text-[11px] font-bold text-gray-800 leading-tight">
                  Download My Data
                </span>
                <span className="block text-[9.5px] text-gray-400 mt-0.5 leading-tight">
                  Get a copy of your learning data and activity.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onSwitchAccountClick}
              className="p-2.5 rounded-xl border border-gray-100 hover:border-emerald-300 bg-[#f9fafb] hover:bg-emerald-50/40 text-left transition-all cursor-pointer flex flex-col justify-between min-h-20 shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-gray-600 mb-2" />
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
              disabled
              className="p-2.5 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-left transition-all cursor-pointer flex flex-col justify-between min-h-20 shadow-2xs"
            >
              <Trash2 className="w-4 h-4 text-rose-500 mb-2" />
              <div>
                <span className="block text-[11px] font-bold text-rose-700 leading-tight">
                  Close Account
                </span>
                <span className="block text-[9.5px] text-rose-500/80 mt-0.5 leading-tight">
                  Self-service account closure is not available.
                </span>
              </div>
            </button>
          </div>
        </div>
    </div>
  );

  if (contactChangeOnly) {
    return contactChangeCard;
  }

  if (leftColumnOnly) {
    return leftColumn;
  }

  if (rightColumnOnly) {
    return rightColumn;
  }

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-3.5 w-full">
      <div className="flex-1 min-w-0">{leftColumn}</div>
      {rightColumn}
    </div>
  );
};
