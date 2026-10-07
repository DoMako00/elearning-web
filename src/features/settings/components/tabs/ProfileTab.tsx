import React, { useState } from "react";
import { User, Camera, ChevronDown, Check } from "lucide-react";
import type { StudentProfileData } from "../../../../types/settings";
import {
  UNIVERSITIES,
  ACADEMIC_YEARS,
  MAJORS,
  COUNTRY_CODES,
} from "../../data/settingsMockData";
import { SettingsCard } from "../common/SettingsCard";

interface ProfileTabProps {
  profile: StudentProfileData;
  onUpdateProfile: <K extends keyof StudentProfileData>(
    field: K,
    value: StudentProfileData[K]
  ) => void;
  onChangePhotoClick: () => void;
  onSave?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onUpdateProfile,
  onChangePhotoClick,
  onSave,
}) => {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Identity & Avatar */}
      <SettingsCard
        title="Profile Information"
        subtitle="Keep your identity and learning details up to date across GreenLearn."
        icon={<User className="w-4 h-4 stroke-2" />}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
          {/* Avatar Management */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative w-24 h-24">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-emerald-500/80 shadow-xs">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={onChangePhotoClick}
                aria-label="Change photo icon"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-emerald-700 cursor-pointer transition-transform hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onChangePhotoClick}
              className="px-3.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 rounded-xl transition-colors cursor-pointer"
            >
              Change photo
            </button>
            <span className="text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
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
                placeholder="e.g. Juliana Ahmed"
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
                value={profile.email}
                className="w-full h-9 px-3 text-xs bg-gray-50/50 border border-gray-200/90 rounded-xl text-gray-500 cursor-not-allowed shadow-2xs"
              />
            </div>

            {/* Phone Number with Mock Country Code Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Phone number
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative shrink-0">
                  <select
                    value={profile.phoneCountryCode}
                    onChange={(e) => {
                      const selected = COUNTRY_CODES.find(
                        (c) => c.code === e.target.value
                      );
                      if (selected) {
                        onUpdateProfile("phoneCountryCode", selected.code);
                        onUpdateProfile("phoneCountryFlag", selected.flag);
                      }
                    }}
                    aria-label="Country Code"
                    className="h-9 pl-2 pr-6 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs font-medium"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <input
                  type="tel"
                  value={profile.phoneNumber}
                  onChange={(e) => onUpdateProfile("phoneNumber", e.target.value)}
                  placeholder="112 345 6789"
                  className="flex-1 h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all min-w-0 shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* 2. Academic Context */}
      <SettingsCard
        title="Academic Context"
        subtitle="Manage your enrolled university, academic level, and primary specialization."
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
                onChange={(e) => onUpdateProfile("university", e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
              >
                {UNIVERSITIES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
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
                onChange={(e) => onUpdateProfile("academicYear", e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
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
                onChange={(e) => onUpdateProfile("major", e.target.value)}
                className="w-full h-9 pl-3 pr-8 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer appearance-none transition-all shadow-2xs"
              >
                {MAJORS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Action Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {isSaved && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            Changes saved successfully!
          </span>
        )}
        <button
          type="submit"
          className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm active:scale-98"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};
