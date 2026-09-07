import { ArrowRight, Star } from "lucide-react";
import type { MentorSpotlight } from "../types/community";

interface MentorSpotlightCardProps {
  mentor: MentorSpotlight;
  onViewProfile?: () => void;
}

export function MentorSpotlightCard({
  mentor,
  onViewProfile,
}: MentorSpotlightCardProps) {
  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs overflow-hidden flex flex-col items-center text-center transition-all hover:shadow-xs h-full justify-between">
      {/* Top Background Organic Wave Graphic */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-emerald-50/70 to-transparent pointer-events-none" />

      {/* Card Header Title */}
      <div className="w-full text-left mb-1 z-10">
        <h4 className="text-[13.5px] font-bold text-slate-900 tracking-tight">
          Mentor spotlight
        </h4>
      </div>

      {/* Avatar with Verified / Star Badge */}
      <div className="relative my-1 z-10">
        <div className="size-13 sm:size-14 xl:size-15 rounded-full ring-3 ring-white shadow-sm overflow-hidden bg-slate-100 mx-auto">
          <img
            src={mentor.avatarUrl}
            alt={mentor.name}
            className="w-full h-full object-cover"
          />
        </div>
        {mentor.isVerified && (
          <div
            className="absolute bottom-0 right-0 size-4.5 rounded-full bg-emerald-600 text-white grid place-items-center ring-2 ring-white shadow-xs"
            title="Verified Mentor"
          >
            <Star className="size-2.5 fill-current" />
          </div>
        )}
      </div>

      {/* Name and Role */}
      <div className="z-10 mt-0.5">
        <h5 className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-tight">
          {mentor.name}
        </h5>
        <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
          {mentor.role}
        </p>
      </div>

      {/* Experience and Bio summary */}
      <div className="z-10 mt-1 flex flex-col gap-0.5 max-w-60">
        <span className="text-[10.5px] font-semibold text-slate-700">
          {mentor.experienceBadge}
        </span>
        <p className="text-[10.5px] text-slate-500 leading-relaxed line-clamp-1 sm:line-clamp-2">
          {mentor.bioSummary}
        </p>
      </div>

      {/* View Profile Action */}
      <div className="z-10 mt-1.5 w-full pt-1.5 border-t border-slate-100 flex items-center justify-center">
        <button
          type="button"
          onClick={onViewProfile}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group"
        >
          <span>View profile</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
