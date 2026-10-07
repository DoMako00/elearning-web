import React from "react";
import { FileText, MoreVertical } from "lucide-react";

export interface DocumentItem {
  id: string;
  filename: string;
  extension: string;
  courseTitle: string;
  fileSize: string;
  timestamp: string;
}

export interface DocumentListRowProps {
  document: DocumentItem;
  onClick?: () => void;
  onMoreClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function getFileTypeStyle(extension: string): {
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  const ext = extension.toLowerCase().replace(".", "");

  switch (ext) {
    case "pdf":
      return {
        bgColor: "bg-rose-50",
        textColor: "text-rose-500",
        borderColor: "border-rose-100",
      };
    case "pptx":
    case "ppt":
      return {
        bgColor: "bg-amber-50",
        textColor: "text-amber-500",
        borderColor: "border-amber-100",
      };
    case "docx":
    case "doc":
      return {
        bgColor: "bg-sky-50",
        textColor: "text-sky-500",
        borderColor: "border-sky-100",
      };
    case "xlsx":
    case "xls":
      return {
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-500",
        borderColor: "border-emerald-100",
      };
    default:
      return {
        bgColor: "bg-blue-50",
        textColor: "text-blue-500",
        borderColor: "border-blue-100",
      };
  }
}

export const DocumentListRow: React.FC<DocumentListRowProps> = ({
  document,
  onClick,
  onMoreClick,
  className = "",
}) => {
  const fileStyle = getFileTypeStyle(document.extension);

  return (
    <div
      onClick={onClick}
      className={`w-full bg-white rounded-2xl border border-slate-100 p-3 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-200 transition-all cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* File Type Icon badge */}
        <div
          className={`w-10 h-10 rounded-xl ${fileStyle.bgColor} ${fileStyle.textColor} border ${fileStyle.borderColor} flex items-center justify-center shrink-0 shadow-2xs`}
        >
          <FileText className="w-5 h-5" strokeWidth={2} />
        </div>

        {/* Text metadata */}
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 truncate leading-snug">
            {document.filename}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {document.courseTitle} <span className="text-slate-300">·</span> {document.fileSize}
          </p>
        </div>
      </div>

      {/* Right meta & More Menu */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
          {document.timestamp}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoreClick?.(e);
          }}
          aria-label="More options"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
