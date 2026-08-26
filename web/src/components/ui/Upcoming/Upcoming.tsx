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
  const displayCount = count ?? items.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(items.length > 2);

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

  return (
    <section
      className="upcoming-card"
      aria-label={`${title}: ${displayCount} scheduled items`}
    >
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
          <div className="upcoming-count-badge" aria-label={`${displayCount} upcoming items`}>
            <Calendar className="upcoming-count-icon" aria-hidden="true" />
            <span className="upcoming-count-number">{displayCount}</span>
          </div>
        </div>
      </div>

      {/* ── Carousel Track (Vertical Items) ── */}
      <div className="upcoming-carousel-track" ref={trackRef}>
        {items.map((item) => (
          <article key={item.id} className="upcoming-item-card" tabIndex={0}>
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
          onClick={onViewCalendar}
          className="upcoming-cta"
        >
          View Calendar
        </button>
      </div>
    </section>
  );
}

