import React, { useState } from "react";
import {
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import type { HelpArticle } from "../../../types/help";
import { HELP_CATEGORIES, POPULAR_ARTICLES } from "../data/helpCenterData";

interface ArticleDetailModalProps {
  article: HelpArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onBackToCategory?: () => void;
  onSelectRelatedArticle?: (article: HelpArticle) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  isOpen,
  onClose,
  onBackToCategory,
  onSelectRelatedArticle,
}) => {
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !article) return null;

  const category = HELP_CATEGORIES.find((c) => c.id === article.categoryId);

  const relatedArticles = (article.content.relatedArticleIds || [])
    .map((id) => POPULAR_ARTICLES.find((a) => a.id === id))
    .filter((a): a is HelpArticle => Boolean(a));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
            {onBackToCategory && (
              <button
                type="button"
                onClick={onBackToCategory}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{category ? category.title : "Back"}</span>
              </button>
            )}
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium truncate max-w-50 sm:max-w-85">
              {article.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              aria-label="Bookmark article"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isSaved
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close article modal"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Article Header & Meta */}
          <div className="border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                {category?.title || "Help Guide"}
              </span>
              {article.views && (
                <span className="text-xs text-gray-400">• {article.views} views</span>
              )}
            </div>

            <h1
              id="article-detail-title"
              className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug"
            >
              {article.title}
            </h1>

            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {article.readTime}
              </span>
              <span>•</span>
              <span>Updated {article.lastUpdated}</span>
            </div>
          </div>

          {/* Overview Section */}
          <div className="text-sm sm:text-[14.5px] text-gray-700 leading-relaxed font-normal">
            <p>{article.content.overview}</p>
          </div>

          {/* Callout Notice (Tip / Warning / Note) */}
          {article.content.callout && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
                article.content.callout.type === "warning"
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : article.content.callout.type === "tip"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-blue-50/80 border-blue-200 text-blue-900"
              }`}
            >
              {article.content.callout.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : article.content.callout.type === "tip" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1 leading-relaxed">
                <span className="font-semibold capitalize">
                  {article.content.callout.type}:{" "}
                </span>
                {article.content.callout.text}
              </div>
            </div>
          )}

          {/* Step-by-Step Resolution Steps */}
          {article.content.steps && article.content.steps.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Step-by-step instructions
              </h3>
              <div className="space-y-3.5">
                {article.content.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50/70 border border-gray-100"
                  >
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Was this article helpful? (Feedback Module) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Was this article helpful?
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Your feedback helps us continuously improve our guides.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedback("helpful")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  feedback === "helpful"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedback("not-helpful")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  feedback === "not-helpful"
                    ? "bg-gray-800 text-white border-gray-800 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>No</span>
              </button>
            </div>
          </div>

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight mb-2.5">
                Related articles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedArticles.map((relArt) => (
                  <button
                    key={relArt.id}
                    type="button"
                    onClick={() => onSelectRelatedArticle?.(relArt)}
                    className="p-3 rounded-xl border border-gray-100 bg-white hover:border-emerald-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h5 className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                        {relArt.title}
                      </h5>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {relArt.readTime}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
