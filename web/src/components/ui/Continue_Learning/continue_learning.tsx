import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Bookmark, Play, CheckCircle2, RefreshCw, ExternalLink, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { ToastNotification } from '../ToastNotification';
import { XPRewardModal } from '../XPRewards';
import type { XPRewardData } from '../XPRewards';
import courseImage from '../../../Assets/dashboard/human-anatomy.webp';
import physioImage from '../../../Assets/dashboard/medical-physiology.webp';
import histologyImage from '../../../Assets/dashboard/histology-basics.webp';
import './index.css';

interface CourseOption {
  id: string;
  name: string;
  subtitle: string;
  currentLesson: number;
  totalLessons: number;
  progressPercentage: number;
  imageSrc: string;
  route: string;
}

const AVAILABLE_COURSES: CourseOption[] = [
  {
    id: 'anatomy',
    name: 'Human Anatomy I',
    subtitle: 'Structure & Organization',
    currentLesson: 6,
    totalLessons: 14,
    progressPercentage: 60,
    imageSrc: courseImage,
    route: '/my-courses/human-anatomy-i/lessons/human-anatomy-i-lesson-1',
  },
  {
    id: 'physio',
    name: 'Medical Physiology',
    subtitle: 'Body Functions & Regulation',
    currentLesson: 4,
    totalLessons: 10,
    progressPercentage: 40,
    imageSrc: physioImage,
    route: '/my-courses',
  },
  {
    id: 'histology',
    name: 'Histology Basics',
    subtitle: 'Tissues of the Human Body',
    currentLesson: 2,
    totalLessons: 6,
    progressPercentage: 33,
    imageSrc: histologyImage,
    route: '/explore',
  },
];

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
  status = "In Progress",
  onContinue,
}) => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<CourseOption>(AVAILABLE_COURSES[0]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [rewardData, setRewardData] = useState<XPRewardData | null>(null);
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toastMessage, showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      showToast(`Resuming ${selectedCourse.name} — Lesson ${selectedCourse.currentLesson}`);
      navigate(selectedCourse.route);
    }
  };

  const toggleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    if (nextState) {
      showToast(`Saved "${selectedCourse.name}" to Profile > Saved`);
    } else {
      showToast(`Removed "${selectedCourse.name}" from Profile > Saved`);
    }
  };

  const handleMarkCompleted = () => {
    setIsMenuOpen(false);
    // Dispatch XP reward immediately
    setRewardData({
      earnedXP: 150,
      reason: 'lesson_complete',
      previousLevel: 8,
      newLevel: 8,
      leveledUp: false,
      totalXP: 2600,
    });
    setIsRewardOpen(true);
    showToast(`+150 XP awarded for completing Lesson ${selectedCourse.currentLesson}!`);
  };

  const handleSwitchCourse = (course: CourseOption) => {
    setSelectedCourse(course);
    setIsSwitchModalOpen(false);
    showToast(`Pinned "${course.name}" to your Home banner`);
  };

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
      {/* Render toast & reward modal via portal so they don't affect grid layout */}
      {createPortal(<ToastNotification message={toastMessage} />, document.body)}

      {rewardData && createPortal(
        <XPRewardModal
          isOpen={isRewardOpen}
          onClose={() => setIsRewardOpen(false)}
          rewardData={rewardData}
        />,
        document.body
      )}

      <div className="continue-learning-card w-full bg-(--secondary-color) rounded-(--border-radius-card) border border-(--color-border-color) pt-(--card-padding-top) pb-(--card-padding-bottom) pl-(--card-padding-left) pr-(--card-padding-right) shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="continue-learning-header flex items-center justify-between mb-6">
          <h2 className="continue-learning-title text-section-title font-bold text-(--text-color-black) tracking-tight">
            {title}
          </h2>

          {/* Three-Dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More options"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="continue-learning-options w-11 h-11 rounded-(--border-radius) border border-(--color-border-color) flex items-center justify-center text-(--paragraphs) hover:bg-(--label-color-light-green) hover:text-(--text-color-black) transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-12 z-30 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs font-medium text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSwitchModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  role="menuitem"
                >
                  <RefreshCw className="size-4 text-emerald-600" />
                  <span>Switch Active Course / Swap</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  role="menuitem"
                >
                  <CheckCircle2 className="size-4 text-(--color-brand,#20a862)" />
                  <span>Mark as Completed (+150 XP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/my-courses/human-anatomy-i");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  role="menuitem"
                >
                  <ExternalLink className="size-4 text-slate-500" />
                  <span>View Course Details</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="continue-learning-main flex items-center gap-(--media-details-gap) mb-(--main-footer-gap)">
          <div className="continue-learning-media relative shrink-0 w-(--media-width) h-(--media-height) rounded-(--border-radius-media) overflow-hidden shadow-sm group/media cursor-pointer" onClick={handleContinue}>
            <img
              src={selectedCourse.imageSrc}
              alt={selectedCourse.name}
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
                  {renderCourseName(selectedCourse.name)}
                </h3>
                <p className="continue-learning-course-subtitle">{selectedCourse.subtitle}</p>

                <div className="continue-learning-metrics mt-auto">
                  <div className="continue-learning-progress-row flex items-center gap-3 mb-3">
                    <div className="continue-learning-progress-track flex-1 h-2.5 bg-(--color-border-color) rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--primary-color) rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${selectedCourse.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-progress font-medium text-(--text-color-black) min-w-10 text-right">
                      {selectedCourse.progressPercentage}%
                    </span>
                  </div>

                  <p className="continue-learning-lesson text-lesson-meta font-normal text-(--paragraphs)">
                    Lesson {selectedCourse.currentLesson} of {selectedCourse.totalLessons}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="continue-learning-footer flex items-center gap-(--button-gap)">
          <button
            type="button"
            onClick={handleContinue}
            className="continue-learning-cta relative group overflow-hidden flex-1 h-(--cta-height) max-w-(--cta-width) px-6 bg-(--primary-color) hover:shadow-md text-white font-semibold text-cta rounded-(--border-radius-cta) transition-all duration-300 active:scale-[0.99] cursor-pointer flex items-center justify-center text-center"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-linear-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[350%] transition-transform duration-800 ease-in-out pointer-events-none" />
            <span className="relative z-10">Continue Lesson</span>
          </button>

          <button
            type="button"
            onClick={toggleBookmark}
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

      {/* Switch Active Course Mini Modal — portaled to avoid layout disruption */}
      {isSwitchModalOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsSwitchModalOpen(false)}
          role="dialog"
          aria-label="Switch Active Course"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pin Course to Home Banner</h3>
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Select one of your enrolled medical courses to feature in the main Continue Learning card:
            </p>

            <div className="space-y-2.5">
              {AVAILABLE_COURSES.map((course) => {
                const isCurrent = course.id === selectedCourse.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => handleSwitchCourse(course)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={course.imageSrc}
                        alt=""
                        className="size-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{course.name}</h4>
                        <p className="text-xs text-slate-500">
                          Lesson {course.currentLesson} of {course.totalLessons} • {course.progressPercentage}% done
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="flex size-6 items-center justify-center rounded-full bg-(--color-brand,#20a862) text-white">
                        <Check className="size-3.5 stroke-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Continue_learning;






