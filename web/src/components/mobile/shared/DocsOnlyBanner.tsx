import React from "react";
import { FileText } from "lucide-react";

export interface DocsOnlyBannerProps {
  className?: string;
  variant?: "compact" | "full" | "inline" | "banner";
}

export const DocsOnlyBanner: React.FC<DocsOnlyBannerProps> = ({
  className = "",
  variant = "compact",
}) => {
  // In the screenshot: a clean subtle line with FileText icon + "Mobile access is for documents and resources only."
  if (variant === "compact" || variant === "inline") {
    return (
      <div
        className={`flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500/90 font-medium ${className}`}
        role="note"
        aria-label="Mobile access constraint"
      >
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.8} />
        <span>Mobile access is for documents and resources only.</span>
      </div>
    );
  }

  // Full / banner card variant (used in settings/drawers or when prominent notice is needed)
  return (
    <div
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 text-xs shadow-2xs ${className}`}
      role="note"
      aria-label="Mobile access constraint"
    >
      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5" strokeWidth={2} />
      </div>
      <p className="text-[11.5px] font-medium text-emerald-800 leading-snug">
        Mobile access is for documents and resources only.
      </p>
    </div>
  );
};
