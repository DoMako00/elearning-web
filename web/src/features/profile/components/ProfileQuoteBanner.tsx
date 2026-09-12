import React from "react";
import { Stethoscope, Heart } from "lucide-react";

interface ProfileQuoteBannerProps {
  quote?: string;
  userName?: string;
}

export const ProfileQuoteBanner: React.FC<ProfileQuoteBannerProps> = ({
  quote = "Small steps every day lead to big results.",
  userName = "Juliana",
}) => {
  return (
    <div className="relative shrink-0 mt-2 overflow-hidden rounded-xl border border-emerald-100 bg-linear-to-r from-emerald-50/70 via-[#f3faf6] to-emerald-50/50 px-4 py-2 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        {/* Left / Center Quote */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          <div className="grid size-7 place-items-center rounded-lg bg-emerald-100/80 text-emerald-700 shrink-0">
            <Stethoscope className="size-3.5" />
          </div>
          <div>
            <p className="text-xs sm:text-[13px] font-semibold text-gray-800 tracking-tight">
              &ldquo;{quote}&rdquo;
            </p>
            <p className="text-[11px] font-medium text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
              <span>Keep going, {userName}!</span>
              <Heart className="size-2.5 fill-emerald-600 text-emerald-600" />
            </p>
          </div>
        </div>

        {/* Right Slogan */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-[9px] tracking-widest font-bold text-emerald-800/70 uppercase">
            Healthier People
          </span>
          <span className="text-[9px] tracking-widest font-bold text-emerald-600/70 uppercase">
            Brighter Tomorrows
          </span>
        </div>
      </div>
    </div>
  );
};
