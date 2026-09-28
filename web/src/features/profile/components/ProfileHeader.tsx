import React, { useRef } from "react";
import { Camera, Calendar, MapPin, Edit3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProfileTabId, UserProfileData } from "../types/profile.types";

interface ProfileHeaderProps {
  profile: UserProfileData;
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  onEditClick: () => void;
  onAvatarUpload?: (newUrl: string) => void;
}

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "achievements", label: "Achievements" },
  { id: "saved", label: "Saved" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  activeTab,
  onTabChange,
  onEditClick,
  onAvatarUpload,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      onAvatarUpload?.(tempUrl);
    }
  };

  return (
    <div className="w-full shrink-0">
      {/* Top Back Nav Link */}
      <div className="mb-1.5 flex items-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 py-0.5"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="size-3.5" />
          <span>My Profile</span>
        </button>
      </div>

      {/* Hero Banner Container with Stethoscope Artwork and Soft Pastel Theme */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-linear-to-r from-emerald-50 via-[#f0faf5] to-emerald-50/60 px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 shadow-xs">
        {/* Subtle decorative background watermarks */}
        <div
          className="pointer-events-none absolute -right-4 -bottom-6 opacity-15 sm:opacity-25 lg:opacity-35 select-none"
          aria-hidden="true"
        >
          <svg width="280" height="150" viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M260 20C280 40 310 70 310 110C310 150 280 180 250 180C220 180 200 150 200 110C200 60 250 20 280 10"
              stroke="#059669"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="200" cy="110" r="14" fill="#10B981" />
            <path
              d="M140 160C110 160 80 140 80 110C80 80 110 60 140 60"
              stroke="#10B981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 6"
            />
            <circle cx="280" cy="10" r="8" fill="#047857" />
          </svg>
        </div>

        {/* Motivational Callout Artwork on the right (matches screenshot) */}
        <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-5 select-none opacity-90">
          <div className="text-right">
            <span className="block font-serif italic text-emerald-800/85 text-base leading-tight">
              Better Doctors
            </span>
            <span className="block font-serif italic text-emerald-700/80 text-sm leading-tight">
              Brighter Tomorrows
            </span>
          </div>

          {/* Stethoscope Illustration SVG */}
          <div className="relative size-20 text-emerald-700">
            <svg
              className="size-full filter drop-shadow-sm"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M48 90 C70 90, 85 70, 85 45 C85 25, 75 12, 60 12" />
              <path d="M48 90 C26 90, 15 70, 15 45 C15 25, 25 12, 40 12" />
              <path d="M40 12 V8" />
              <path d="M60 12 V8" />
              <circle cx="50" cy="92" r="5" fill="#10B981" />
            </svg>
          </div>
        </div>

        {/* Content Row: Avatar + Info + Edit Button */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-3 sm:gap-4.5">
            {/* Avatar with Camera Trigger */}
            <div className="group relative shrink-0">
              <div className="relative size-16 sm:size-18 lg:size-20 overflow-hidden rounded-full ring-3 ring-white shadow-md bg-emerald-100">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="size-full object-cover"
                />
              </div>

              {/* Upload trigger button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 grid size-6 sm:size-7 place-items-center rounded-full bg-white text-gray-700 shadow-md ring-1 ring-emerald-50 transition-all hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="Change profile avatar"
                aria-label="Upload new avatar image"
              >
                <Camera className="size-3 sm:size-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                aria-hidden="true"
              />
            </div>

            {/* User Meta Information */}
            <div className="space-y-1 sm:space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none">
                  {profile.name}
                </h1>
              </div>

              <p className="text-xs sm:text-sm lg:text-base font-semibold text-gray-700">
                <span>{profile.specialty}</span>
                <span className="mx-1.5 sm:mx-2 text-emerald-500">•</span>
                <span className="text-gray-600 font-medium">{profile.institution}</span>
              </p>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-lg hidden xs:block">
                {profile.bio}
              </p>

              {/* Details Tags (Location & Joined Date) */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 sm:size-4 text-emerald-600 shrink-0" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 sm:size-4 text-emerald-600 shrink-0" />
                  <span>Joined {profile.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Action Button */}
          <div className="self-stretch sm:self-auto flex justify-end shrink-0">
            <button
              type="button"
              onClick={onEditClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-emerald-700 shadow-xs transition-all hover:bg-emerald-50 hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Edit3 className="size-3.5 sm:size-4 text-emerald-600" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation Bar (Under Banner) */}
      <nav
        className="mt-3 flex border-b border-gray-200 overflow-x-auto no-scrollbar"
        aria-label="Profile section tabs"
      >
        <div className="flex gap-8 min-w-max px-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`relative pb-2.5 text-base lg:text-[17px] tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t ${
                  isActive
                    ? "text-emerald-700 font-extrabold"
                    : "text-gray-500 hover:text-gray-800 font-semibold"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-emerald-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
