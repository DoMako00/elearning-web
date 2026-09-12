import React from "react";
import {
  CheckCircle2,
  Building2,
  Briefcase,
  Stethoscope,
  MapPin,
  Mail,
  Clock,
  Camera,
  Edit3,
} from "lucide-react";
import type { InstructorProfile } from "../../../types/instructor";

interface InstructorHeroBannerProps {
  instructor: InstructorProfile;
  onEditClick: () => void;
  isSelf?: boolean;
}

export const InstructorHeroBanner: React.FC<InstructorHeroBannerProps> = ({
  instructor,
  onEditClick,
  isSelf = true,
}) => {
  return (
    <div className="w-full shrink-0 space-y-2">
      {/* Top Breadcrumb & Page Title Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span>Profile</span>
              <span className="text-slate-300">/</span>
              <span>Instructor Profile</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Instructor Profile
            </h1>
          </div>
          <span className="hidden md:inline-block text-xs sm:text-sm text-slate-500 border-l border-slate-200 pl-3">
            Inspire. Teach. Advance healthcare education.
          </span>
        </div>

        {/* Action button */}
        {isSelf && (
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
          >
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>Edit profile</span>
          </button>
        )}
      </div>

      {/* Main Hero Card */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-xs">
        {/* Right Background Art Overlay */}
        <div
          className="absolute top-0 right-0 h-full w-full sm:w-[46%] pointer-events-none opacity-60 sm:opacity-85 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src={instructor.bannerArtworkUrl}
            alt=""
            className="h-full w-full object-cover object-center mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-linear-to-r from-white via-white/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-white/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left: Avatar & Info */}
          <div className="lg:col-span-8 flex flex-row gap-4 items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-3 ring-slate-100 overflow-hidden bg-slate-100 shadow-xs">
                <img
                  src={instructor.avatarUrl}
                  alt={instructor.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Online badge */}
              <span
                className="absolute top-0.5 left-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                title="Active Faculty Member"
              />

              {/* Edit Camera Button */}
              <button
                type="button"
                onClick={onEditClick}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 flex items-center justify-center shadow-xs hover:scale-105 transition-all cursor-pointer"
                title="Update photo"
                aria-label="Update avatar photo"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                  {instructor.name}
                </h2>
                {instructor.isVerified && (
                  <span title="Verified Faculty Member" className="inline-flex">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50 shrink-0" />
                  </span>
                )}
                <span className="text-xs sm:text-sm font-semibold text-slate-600 ml-1">
                  • {instructor.title}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-slate-700 mt-2">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{instructor.institution}</span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{instructor.yearsOfExperience}</span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{instructor.medicalSpecialization}</span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{instructor.location}</span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{instructor.email}</span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{instructor.officeHours}</span>
                </div>
              </div>

              {/* Bio summary */}
              <p className="text-xs sm:text-[13px] text-slate-600 leading-snug line-clamp-1 mt-2">
                {instructor.bioSummary}
              </p>
            </div>
          </div>

          {/* Right: Quote & Slogan */}
          <div className="hidden lg:flex lg:col-span-4 flex-col items-end justify-center text-right pl-3">
            <div className="max-w-70 space-y-1.5">
              <blockquote className="text-xs sm:text-sm font-medium italic text-slate-700 leading-snug">
                "{instructor.inspirationalQuote}"
              </blockquote>
              <div className="flex items-center justify-end gap-2 text-emerald-800 pt-1">
                <span className="text-xs font-bold tracking-wider uppercase font-serif">
                  Teach • Heal • Advance
                </span>
                <svg
                  className="w-4.5 h-4.5 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
