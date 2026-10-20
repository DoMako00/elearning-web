import React, { useState } from "react";
import { User, Camera, ChevronDown, Check } from "lucide-react";
import type { StudentProfileData } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";

interface ProfileTabProps {
  profile: StudentProfileData;
  verifiedEmail?: string;
  onUpdateProfile: <K extends keyof StudentProfileData>(
    field: K,
    value: StudentProfileData[K]
  ) => void;
  onChangePhotoClick: () => void;
  onSave?: () => Promise<void> | void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  verifiedEmail = "",
  onUpdateProfile,
  onChangePhotoClick,
  onSave,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving,setIsSaving]=useState(false);
  const [saveError,setSaveError]=useState<string|null>(null);

  // Success is shown only after the save promise resolves; a rejected save
  // surfaces its error and never claims the changes were stored.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(isSaving||!onSave)return;
    setIsSaving(true);
    setIsSaved(false);
    setSaveError(null);
    try{await onSave();setIsSaved(true);setTimeout(() => setIsSaved(false), 2500);}
    catch(error){setSaveError(error instanceof Error?error.message:"Your changes could not be saved.");}
    finally{setIsSaving(false);}
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Identity & Avatar */}
      <SettingsCard
        title="Profile Information"
        subtitle="Keep your identity and learning details up to date across your learning account."
        icon={<User className="w-4 h-4 stroke-2" />}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
          {/* Avatar Management */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative w-24 h-24">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-xs">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold">{profile.fullName.trim().split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase() || "—"}</span>}
              </div>
              <button
                type="button"
                onClick={onChangePhotoClick}
                disabled
                title="Profile photo uploads are not enabled."
                aria-label="Change photo icon"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-emerald-700 cursor-pointer transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onChangePhotoClick}
              disabled
              title="Profile photo uploads are not enabled."
              className="px-3.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change photo
            </button>
            <span className="text-[10px] text-gray-400">Profile photo uploads are not enabled.</span>
          </div>

          {/* Personal Details Form Grid */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => onUpdateProfile("fullName", e.target.value)}
                placeholder="Full name"
                className="w-full h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
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
                Email address
              </label>
              <input
                type="email"
                disabled
                value={verifiedEmail}
                placeholder="No verified login email linked"
                className="w-full h-9 px-3 text-xs bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-500 cursor-not-allowed shadow-2xs"
              />
            </div>

            {/* Phone Number with Mock Country Code Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Phone number (optional)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative shrink-0">
                    <span className="h-9 px-2.5 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 flex items-center font-medium">{profile.phoneCountryCode || "+"}</span>
                </div>
                <input
                  type="tel"
                  value={profile.phoneNumber}
                  onChange={(e) => onUpdateProfile("phoneNumber", e.target.value)}
                placeholder="Optional phone in international format"
                  className="flex-1 h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all min-w-0 shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* 2. Academic Context */}
      <SettingsCard
        title="Academic Context"
              subtitle="Academic placement is managed by your institution. Contact an Admin if it needs correction."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* University */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              University
            </label>
            <div className="relative">
              <select
                value={profile.university}
                disabled
                className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
              >
                <option value={profile.university}>{profile.university || "Unavailable"}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Academic Year
            </label>
            <div className="relative">
              <select
                value={profile.academicYear}
                disabled
                className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
              >
                <option value={profile.academicYear}>{profile.academicYear || "Unavailable"}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Major */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Major / Specialization
            </label>
            <div className="relative">
              <select
                value={profile.major}
                disabled
                className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
              >
                <option value={profile.major}>{profile.major || "Not provided"}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Action Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saveError && (
          <span role="alert" className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
            {saveError}
          </span>
        )}
        {isSaved && (
          <span role="status" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Changes saved successfully!
          </span>
        )}
        <button
          type="submit"
          disabled={isSaving||!onSave}
          className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm active:scale-98"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
