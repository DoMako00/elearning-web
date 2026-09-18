import {
  Users,
  Code2,
  FolderGit2,
  MessageCircle,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { FeaturedStudyGroup } from "../types/community";

interface FeaturedGroupCardProps {
  group: FeaturedStudyGroup;
  onJoinToggle?: (isJoined: boolean) => void;
}

export function FeaturedGroupCard({
  group,
  onJoinToggle,
}: FeaturedGroupCardProps) {
  const [isJoined, setIsJoined] = useState(group.isJoined || false);

  const handleToggle = () => {
    const next = !isJoined;
    setIsJoined(next);
    onJoinToggle?.(next);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all hover:shadow-xs h-full">
      {/* Left Visual Illustration Tile (Dark Emerald / Graduation Cap) */}
      <div className="relative flex sm:flex-col justify-between items-center sm:items-stretch p-3.5 sm:p-4 sm:w-42.5 xl:w-50 shrink-0 bg-linear-to-br from-[#0c4028] via-[#093521] to-[#041c11] text-white overflow-hidden">
        {/* Subtle Background Pattern / Glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-emerald-400 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-emerald-500 blur-2xl" />
        </div>

        {/* Top Tag Badge */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] sm:text-[10px] font-bold xl:text-[8.7px] tracking-wider uppercase bg-emerald-400/25 text-emerald-300 border border-emerald-400/40 backdrop-blur-xs">
            <Sparkles className="size-3 text-emerald-300" />
            FEATURED STUDY GROUP
          </span>
        </div>

        {/* Center Line Art Illustration (Graduation cap over students) */}
        <div className="relative z-10 my-1 hidden sm:flex flex-col items-center justify-center">
          <div className="relative w-24 h-20 xl:w-28 xl:h-24 flex items-center justify-center">
            <svg
              viewBox="0 0 120 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-emerald-400/90 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]"
            >
              {/* Graduation Cap */}
              <path
                d="M60 12L18 32L60 52L102 32L60 12Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 38.5V60C32 60 42 70 60 70C78 70 88 60 88 60V38.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M102 32V56"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="102" cy="58" r="2.5" fill="currentColor" />

              {/* Student Heads outline */}
              <path
                d="M60 76C66.6274 76 72 70.6274 72 64C72 57.3726 66.6274 52 60 52C53.3726 52 48 57.3726 48 64C48 70.6274 53.3726 76 60 76Z"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M34 88C34 78 45 74 60 74C75 74 86 78 86 88"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M26 68C30 68 33 65 33 61C33 57 30 54 26 54C22 54 19 57 19 61C19 65 22 68 26 68Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M10 84C10 76 18 72 26 72C30 72 34 73 37 75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M94 68C98 68 101 65 101 61C101 57 98 54 94 54C90 54 87 57 87 61C87 65 90 68 94 68Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M110 84C110 76 102 72 94 72C90 72 86 73 83 75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Member Count Pill */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-[11.5px] font-semibold bg-black/40 text-emerald-200 border border-emerald-400/25 backdrop-blur-xs">
            <Users className="size-3.5 text-emerald-400" />
            <span>{group.memberCount + (isJoined ? 1 : 0)} members</span>
          </span>
        </div>
      </div>

      {/* Right Content Section */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[19px] sm:text-[18px] xl:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
                {group.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] sm:text-[13px] text-slate-600 xl:text-[18px] leading-relaxed line-clamp-2">
                {group.description}
              </p>
            </div>
          </div>

          {/* Group Metadata Tags Grid */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] sm:text-[12px] font-medium text-slate-600 xl:text-[14px]">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <GraduationCap className="size-4 text-emerald-600" />
              <span>{group.tags.level}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <Code2 className="size-4 text-emerald-600" />
              <span>{group.tags.tech}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <FolderGit2 className="size-4 text-emerald-600" />
              <span>{group.tags.type}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <MessageCircle className="size-4 text-emerald-600" />
              <span>{group.tags.schedule}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Member Avatars + CTA Button */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Overlapping Avatars */}
            <div className="flex -space-x-2 overflow-hidden">
              {group.avatars.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="Member"
                  className="inline-block size-7 rounded-full ring-2 ring-white object-cover shadow-xs"
                />
              ))}
            </div>
            <span className="text-[12px] font-medium text-emerald-700">
              {group.activeCountText}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isJoined
                ? "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80 border border-emerald-300"
                : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-600/20 shadow-sm"
            }`}
          >
            {isJoined ? "Joined ✓" : "Join group"}
          </button>
        </div>
      </div>
    </div>
  );
}
