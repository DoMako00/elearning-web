import React, { useState } from "react";
import { Star, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { StudentReview } from "../../../types/instructor";

interface StudentReviewsCarouselProps {
  reviews: StudentReview[];
}

export const StudentReviewsCarousel: React.FC<StudentReviewsCarouselProps> = ({
  reviews,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (reviews.length === 0) return null;

  const currentReview = reviews[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : reviews.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < reviews.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-2xs shrink-0 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <Star className="w-4 h-4 text-emerald-600 fill-emerald-100" />
          <span>Student Reviews</span>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Review Content */}
      <div className="py-2.5 space-y-2">
        {/* Rating and Date Row */}
        <div className="flex items-center justify-between text-xs sm:text-[13px]">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-900 ml-0.5">
              {currentReview.rating.toFixed(1)}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {currentReview.date}
          </span>
        </div>

        {/* Review Quote */}
        <blockquote className="text-xs sm:text-[13px] text-slate-600 italic leading-relaxed">
          "{currentReview.quote}"
        </blockquote>

        {/* Reviewer Meta */}
        <div className="flex items-center gap-2.5 pt-1">
          <img
            src={currentReview.studentAvatar}
            alt={currentReview.studentName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="min-w-0">
            <div className="text-xs sm:text-[13px] font-bold text-slate-900 truncate leading-tight">
              {currentReview.studentName}
            </div>
            <div className="text-xs text-slate-500 truncate leading-tight mt-0.5">
              {currentReview.studentRole}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handlePrev}
          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Previous review"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Pagination Dots */}
        <div className="flex items-center gap-1.5">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? "w-4 bg-emerald-600"
                  : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Next review"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
