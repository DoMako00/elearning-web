import React from "react";
import { FileText, ArrowUpRight, ExternalLink } from "lucide-react";
import type { ResearchPublication } from "../../../types/instructor";

interface ResearchPublicationsCardProps {
  publications: ResearchPublication[];
}

export const ResearchPublicationsCard: React.FC<ResearchPublicationsCardProps> = ({
  publications,
}) => {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs overflow-hidden shrink-0 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5 shrink-0">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Research & Publications</span>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        {publications.map((paper) => (
          <div
            key={paper.id}
            className="flex items-start gap-2.5 text-xs group cursor-pointer"
            onClick={() => paper.linkUrl && window.open(paper.linkUrl, "_blank")}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <FileText className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                <span className="truncate">{paper.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {paper.journal} • {paper.year}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
