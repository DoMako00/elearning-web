
import React, { useState } from 'react';
import { MoreHorizontal, Bookmark, Play } from 'lucide-react';
import courseImage from '../../../Assets/dashboard/human-anatomy.webp';
import './index.css';

interface Continue_learningProps {
  title?: string;
  courseName?: string;
  courseSubtitle?: string;
  status?: string;
  currentLesson?: number;
  totalLessons?: number;
  progressPercentage?: number;
  imageSrc?: string;
  onContinue?: () => void;
}

const Continue_learning: React.FC<Continue_learningProps> = ({
  title = "Continue Learning",
  courseName = "Human Anatomy I",
  courseSubtitle = "Structure & Organization",
  status = "In Progress",
  currentLesson = 6,
  totalLessons = 14,
  progressPercentage = 60,
  imageSrc = courseImage,
  onContinue,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const renderCourseName = (name: string) => {
    if (name.includes('\n')) {
      return name.split('\n').map((line, idx) => (
        <span key={idx} className="block">{line}</span>
      ));
    }
    return name;
  };

  return (
    <section className="continue-learning w-full max-w-(--card-max-width) font-sans">
      <div className="continue-learning-card w-full bg-(--secondary-color) rounded-(--border-radius-card) border border-(--color-border-color) pt-(--card-padding-top) pb-(--card-padding-bottom) pl-(--card-padding-left) pr-(--card-padding-right) shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="continue-learning-header flex items-center justify-between mb-6">
          <h2 className="continue-learning-title text-section-title font-bold text-(--text-color-black) tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            aria-label="More options"
            className="continue-learning-options w-11 h-11 rounded-(--border-radius) border border-(--color-border-color) flex items-center justify-center text-(--paragraphs) hover:bg-(--label-color-light-green) hover:text-(--text-color-black) transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="continue-learning-main flex items-center gap-(--media-details-gap) mb-(--main-footer-gap)">
          <div className="continue-learning-media relative shrink-0 w-(--media-width) h-(--media-height) rounded-(--border-radius-media) overflow-hidden shadow-sm group/media">
            <img
              src={imageSrc}
              alt={courseName}
              decoding="async"
              loading="eager"
              className="continue-learning-image w-full h-full object-cover transition-transform duration-500 ease-out group-hover/media:scale-108"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-18 h-18 rounded-full bg-white/30 scale-75 opacity-0 group-hover/media:opacity-100 group-hover/media:scale-125 transition-all duration-500 ease-out" />
              <div className="continue-learning-play-button absolute w-12 h-12 rounded-full bg-white opacity-100 group-hover/media:scale-110 transition-all duration-300 ease-out flex items-center justify-center shadow-sm">
                <Play className="continue-learning-play-icon w-4.5 h-4.5 text-(--primary-color) fill-current ml-0.5 transition-transform duration-300 group-hover/media:scale-110" />
              </div>
            </div>
          </div>

          <div className="continue-learning-details flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
            <div>
              <span className="continue-learning-status inline-block px-4 py-1.5 text-status-badge font-bold text-(--text-color-green) bg-(--label-color-light-green) rounded-full mb-3">
                {status}
              </span>
              <div className="continue-learning-title-metrics-wrap">
                <h3 className="continue-learning-course-title">
                  {renderCourseName(courseName)}
                </h3>
                <p className="continue-learning-course-subtitle">{courseSubtitle}</p>

                <div className="continue-learning-metrics mt-auto">
                  <div className="continue-learning-progress-row flex items-center gap-3 mb-3">
                    <div className="continue-learning-progress-track flex-1 h-2.5 bg-(--color-border-color) rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--primary-color) rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-progress font-medium text-(--text-color-black) min-w-10 text-right">
                      {progressPercentage}%
                    </span>
                  </div>

                  <p className="continue-learning-lesson text-lesson-meta font-normal text-(--paragraphs)">
                    Lesson {currentLesson} of {totalLessons}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="continue-learning-footer flex items-center gap-(--button-gap)">
          <button
            type="button"
            onClick={onContinue}
            className="continue-learning-cta relative group overflow-hidden flex-1 h-(--cta-height) max-w-(--cta-width) px-6 bg-(--primary-color) hover:shadow-md text-white font-semibold text-cta rounded-(--border-radius-cta) transition-all duration-300 active:scale-[0.99] cursor-pointer flex items-center justify-center text-center"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-linear-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[350%] transition-transform duration-800 ease-in-out pointer-events-none" />
            <span className="relative z-10">Continue Lesson</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            aria-label={isBookmarked ? "Remove course bookmark" : "Bookmark course"}
            aria-pressed={isBookmarked}
            data-bookmarked={isBookmarked}
            className={`w-(--bookmark-width) h-(--bookmark-height) rounded-(--border-radius-cta) border border-(--color-border-color) flex items-center justify-center transition-all duration-200 cursor-pointer ${isBookmarked
                ? 'bg-(--label-color-light-green) border-(--text-color-green) text-(--text-color-green)'
                : 'bg-(--secondary-color) hover:bg-(--label-color-light-green) text-(--text-color-green)'
              }`}
          >
            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Continue_learning;






