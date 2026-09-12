import React, { ReactNode } from "react";

export interface HeroBandProps {
  eyebrow?: string;
  heading: string;
  subtitle?: string;
  banner?: ReactNode;
  illustration?: ReactNode;
  variant?: "light" | "dark";
  className?: string;
}

export const HeroBand: React.FC<HeroBandProps> = ({
  eyebrow = "Good morning,",
  heading,
  subtitle,
  banner,
  illustration,
  variant = "light",
  className = "",
}) => {
  const isDark = variant === "dark";

  return (
    <div
      className={`relative w-full overflow-hidden px-4 pt-4 pb-4.5 ${
        isDark
          ? "bg-linear-to-b from-emerald-950 via-emerald-900 to-emerald-900 text-white"
          : "bg-linear-to-b from-[#eef9f2] via-[#e6f7ee]/80 to-transparent text-slate-900"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Left: Text & Info Content */}
        <div className="flex-1 min-w-0 z-10">
          {eyebrow && (
            <p
              className={`text-xs sm:text-[13px] font-medium tracking-tight ${
                isDark ? "text-emerald-300" : "text-slate-500"
              }`}
            >
              {eyebrow}
            </p>
          )}

          <h1
            className={`text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight mt-0.5 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {heading}
          </h1>

          {subtitle && (
            <p
              className={`text-xs sm:text-[13px] font-medium mt-1 ${
                isDark ? "text-emerald-100/90" : "text-slate-500"
              }`}
            >
              {subtitle}
            </p>
          )}

          {banner && <div className="mt-2">{banner}</div>}
        </div>

        {/* Right: Decorative Illustration Slot */}
        {illustration && (
          <div className="shrink-0 relative z-0 flex items-center justify-end -mr-1">
            {illustration}
          </div>
        )}
      </div>
    </div>
  );
};
