import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  MonitorPlay,
  NotebookPen,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { ToastNotification } from '../ToastNotification';
import type { UpcomingItem, UpcomingProps } from './upcoming.types';
import './index.css';

const DEFAULT_ITEMS: UpcomingItem[] = [
  {
    id: '1',
    title: 'Anatomy Quiz',
    time: 'Tomorrow, 10:00 AM',
    iconType: 'quiz',
    tag: 'Quiz',
  },
  {
    id: '2',
    title: 'Live Session',
    time: 'May 22, 4:00 PM',
    iconType: 'session',
    tag: 'Live',
  },
  {
    id: '3',
    title: 'Physiology Lab',
    time: 'May 24, 2:00 PM',
    iconType: 'lab',
    tag: 'Lab',
  },
  {
    id: '4',
    title: 'Assignment Due',
    time: 'May 26, 11:59 PM',
    iconType: 'assignment',
    tag: 'Due',
  },
  {
    id: '5',
    title: 'Mock Exam',
    time: 'May 28, 9:00 AM',
    iconType: 'exam',
    tag: 'Exam',
  },
  {
    id: '6',
    title: 'Anatomy Quiz',
    time: 'Tomorrow, 10:00 AM',
    iconType: 'quiz',
    tag: 'Quiz',
  },
  {
    id: '7',
    title: 'Live Session',
    time: 'May 22, 4:00 PM',
    iconType: 'session',
    tag: 'Live',
  },
  {
    id: '8',
    title: 'Physiology Lab',
    time: 'May 24, 2:00 PM',
    iconType: 'lab',
    tag: 'Lab',
  },
  {
    id: '9',
    title: 'Assignment Due',
    time: 'May 26, 11:59 PM',
    iconType: 'assignment',
    tag: 'Due',
  },
  
];

function renderItemIcon(type?: string) {
  switch (type) {
    case 'session':
      return <MonitorPlay className="upcoming-item-icon" aria-hidden="true" />;
    case 'lab':
      return <FlaskConical className="upcoming-item-icon" aria-hidden="true" />;
    case 'assignment':
      return <ClipboardCheck className="upcoming-item-icon" aria-hidden="true" />;
    case 'exam':
      return <GraduationCap className="upcoming-item-icon" aria-hidden="true" />;
    case 'quiz':
    default:
      return <NotebookPen className="upcoming-item-icon" aria-hidden="true" />;
  }
}

export function Upcoming({
  title = 'Upcoming',
  count,
  items = DEFAULT_ITEMS,
  onViewCalendar,
}: UpcomingProps) {
  const navigate = useNavigate();
  const displayCount = count ?? items.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(items.length > 2);
  const [selectedEvent, setSelectedEvent] = useState<UpcomingItem | null>(null);
  const { toastMessage, showToast } = useToast();

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 4);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, items]);

  const scroll = (direction: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 140);
    el.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleEventAction = (event: UpcomingItem) => {
    setSelectedEvent(null);
    if (event.iconType === 'quiz') {
      showToast(`Starting ${event.title}...`);
      navigate('/assignments');
    } else if (event.iconType === 'session') {
      showToast(`Joining Live Session with Dr. Ahmed Hassan...`);
      navigate('/calendar');
    } else if (event.iconType === 'assignment') {
      showToast(`Opening ${event.title}...`);
      navigate('/assignments');
    } else {
      showToast(`Opening details for ${event.title}`);
      navigate('/calendar');
    }
  };

  return (
    <section
      className="upcoming-card relative"
      aria-label={`${title}: ${displayCount} scheduled items`}
    >
      <ToastNotification message={toastMessage} />
      {/* ── Header ── */}

      <div className="upcoming-header">
        <h2 className="upcoming-title">{title}</h2>
        <div className="upcoming-header-actions">
          {items.length > 2 && (
            <div className="upcoming-nav-group" aria-label="Carousel navigation">
              <button
                type="button"
                className="upcoming-nav-btn"
                onClick={() => scroll('prev')}
                disabled={!canScrollPrev}
                aria-label="Previous upcoming items"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="upcoming-nav-btn"
                onClick={() => scroll('next')}
                disabled={!canScrollNext}
                aria-label="Next upcoming items"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <div
            className="upcoming-count-badge cursor-pointer"
            title={`${displayCount} scheduled events for this month`}
            onClick={() => navigate('/calendar')}
            aria-label={`${displayCount} upcoming items scheduled for this month`}
          >
            <Calendar className="upcoming-count-icon" aria-hidden="true" />
            <span className="upcoming-count-number">{displayCount}</span>
          </div>
        </div>
      </div>

      {/* ── Carousel Track (Vertical Items) ── */}
      <div className="upcoming-carousel-track" ref={trackRef}>
        {items.map((item) => (
          <article
            key={item.id}
            className="upcoming-item-card cursor-pointer hover:shadow-xs hover:border-emerald-200 transition-all"
            tabIndex={0}
            onClick={() => setSelectedEvent(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedEvent(item);
              }
            }}
          >
            <div className="upcoming-item-icon-box">
              {renderItemIcon(item.iconType)}
            </div>
            <div className="upcoming-item-content">
              <h3 className="upcoming-item-title" title={item.title}>
                {item.title}
              </h3>
              <p className="upcoming-item-time">{item.time}</p>
            </div>
          </article>
        ))}
      </div>

      {/* ── Footer CTA ── */}
      <div className="upcoming-footer">
        <button
          type="button"
          onClick={onViewCalendar ?? (() => {
            showToast('Opening your calendar');
            navigate('/calendar');
          })}
          className="upcoming-cta cursor-pointer"
        >
          View Calendar
        </button>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-label="Event Details Modal"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-(--color-brand,#20a862)">
                  {renderItemIcon(selectedEvent.iconType)}
                </div>
                <div>
                  <span className="inline-block rounded bg-emerald-100/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    {selectedEvent.tag || 'Academic Event'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedEvent.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="size-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Time & Schedule:</span>
                <span>{selectedEvent.time}</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Instructor:</span>
                  <span className="font-semibold text-slate-800">Dr. Ahmed Hassan, MD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-semibold text-slate-800">Interactive Clinical Session</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold text-slate-800">45 Minutes</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preparation Notes:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  Please review the upper limb dissection diagrams and the brachial plexus clinical case review beforehand. Questions will test clinical localization.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleEventAction(selectedEvent)}
                className="flex-1 rounded-xl bg-(--color-brand,#20a862) py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
              >
                {selectedEvent.iconType === 'quiz'
                  ? 'Start Quiz'
                  : selectedEvent.iconType === 'session'
                  ? 'Join Session'
                  : selectedEvent.iconType === 'assignment'
                  ? 'View Assignment'
                  : 'Open Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

