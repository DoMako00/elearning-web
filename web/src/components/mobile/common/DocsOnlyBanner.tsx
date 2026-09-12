import React from "react";
import { FileText } from "lucide-react";

interface DocsOnlyBannerProps {
  className?: string;
  variant?: "inline" | "banner";
}

export const DocsOnlyBanner: React.FC<DocsOnlyBannerProps> = ({
  className = "",
  variant = "banner",
}) => {
  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800/90 ${className}`}
      >
        <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Mobile access is for documents and resources only.</span>
      </span>
    );
  }

  return (
    <div
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-900 text-xs shadow-2xs ${className}`}
      role="note"
      aria-label="Mobile access constraint"
    >
      <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <FileText className="w-3 h-3" />
      </div>
      <p className="text-[11px] font-medium text-emerald-800 leading-tight">
        Mobile access is for documents and resources only.
      </p>
    </div>
  );
};
