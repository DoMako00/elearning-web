
import React, { useState } from 'react';
import { MoreHorizontal, Bookmark, Play } from 'lucide-react';
import courseImage from '../../../Assets/image.png';
import './index.css';

interface Continue_learningProps {
  title?: string;
  courseName?: string;
  status?: string;
  currentLesson?: number;
  totalLessons?: number;
  progressPercentage?: number;
  imageSrc?: string;
  onContinue?: () => void;
}

const Continue_learning: React.FC<Continue_learningProps> = ({
  title = "Continue Learning",
  courseName = "Advanced UI/UX Design",
  status = "In Progress",
  currentLesson = 6,
  totalLessons = 12,
  progressPercentage = 60,
  imageSrc = courseImage,
  onContinue,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <section className="w-full flex justify-center p-6 font-sans">
      <div className="w-full max-w-(--card-max-width) bg-(--secondary-color) rounded-(--border-radius-card) border border-(--color-border-color) pt-(--card-padding-top) pb-(--card-padding-bottom) pl-(--card-padding-left) pr-(--card-padding-right) shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-section-title font-bold text-(--text-color-black) tracking-tight">
            {title}
          </h2>
          <button 
            type="button" 
            aria-label="More options"
            className="w-11 h-11 rounded-(--border-radius) border border-(--color-border-color) flex items-center justify-center text-(--paragraphs) hover:bg-(--label-color-light-green) hover:text-(--text-color-black) transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-(--media-details-gap) mb-(--main-footer-gap)">
          <div className="relative shrink-0 w-(--media-width) h-(--media-height) rounded-(--border-radius-media) overflow-hidden shadow-sm group/media cursor-pointer">
            <img 
              src={imageSrc} 
              alt={courseName} 
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/media:scale-108"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-18 h-18 rounded-full bg-white/30 scale-75 opacity-0 group-hover/media:opacity-100 group-hover/media:scale-125 transition-all duration-500 ease-out" />
              <div className="absolute w-14 h-14 rounded-full bg-(--primary-color)/80 opacity-0 group-hover/media:opacity-100 group-hover/media:scale-110 transition-all duration-300 ease-out flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white fill-white ml-0.5 transition-transform duration-300 group-hover/media:scale-110" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
            <div>
              <span className="inline-block px-4 py-1.5 text-status-badge font-semibold text-(--text-color-green) bg-(--label-color-light-green) rounded-full mb-3">
                {status}
              </span>
              <h3 className="text-course-title font-bold text-(--text-color-black) leading-[1.18] tracking-tight">
                {courseName === "Advanced UI/UX Design" ? (
                  <>
                    Advanced
                    <br />
                    UI/UX Design
                  </>
                ) : (
                  courseName.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < courseName.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))
                )}
              </h3>
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2.5 bg-(--color-border-color) rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-(--primary-color) rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-progress font-medium text-(--text-color-black) min-w-10 text-right">
                  {progressPercentage}%
                </span>
              </div>

              <p className="text-lesson-meta font-normal text-(--paragraphs)">
                Lesson {currentLesson} of {totalLessons}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-(--button-gap)">
          <button
            type="button"
            onClick={onContinue}
            className="relative group overflow-hidden flex-1 h-(--cta-height) max-w-(--cta-width) px-6 bg-(--primary-color) hover:shadow-md text-white font-semibold text-cta rounded-(--border-radius-cta) transition-all duration-300 active:scale-[0.99] cursor-pointer flex items-center justify-center text-center"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[350%] transition-transform duration-800 ease-in-out pointer-events-none" />
            <span className="relative z-10">Continue Lesson</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            aria-label="Bookmark course"
            className={`w-(--bookmark-width) h-(--bookmark-height) rounded-(--border-radius-cta) border border-(--color-border-color) flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isBookmarked 
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






