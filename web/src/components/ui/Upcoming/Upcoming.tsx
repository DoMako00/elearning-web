import { Calendar, MonitorPlay, NotebookPen } from 'lucide-react';
import type { UpcomingItem, UpcomingProps } from './upcoming.types';
import './index.css';

const DEFAULT_ITEMS: UpcomingItem[] = [
  {
    id: '1',
    title: 'Anatomy Quiz',
    time: 'Tomorrow, 10:00 AM',
    iconType: 'quiz',
  },
  {
    id: '2',
    title: 'Live Session',
    time: 'May 22, 4:00 PM',
    iconType: 'session',
  },
];

function renderItemIcon(type?: string) {
  switch (type) {
    case 'session':
      return <MonitorPlay className="upcoming-item-icon" aria-hidden="true" />;
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

  return (
    <section
      className="upcoming-card"
      aria-label={`${title}: ${displayCount} scheduled items`}
    >
      {/* ── Header ── */}
      <div className="upcoming-header">
        <h2 className="upcoming-title">{title}</h2>
        <div className="upcoming-count-badge" aria-label={`${displayCount} upcoming items`}>
          <Calendar className="upcoming-count-icon" aria-hidden="true" />
          <span className="upcoming-count-number">{displayCount}</span>
        </div>
      </div>

      {/* ── Body List ── */}
      <div className="upcoming-body">
        {items.map((item) => (
          <div key={item.id} className="upcoming-item">
            <div className="upcoming-item-icon-box">
              {renderItemIcon(item.iconType)}
            </div>
            <div className="upcoming-item-content">
              <h3 className="upcoming-item-title">{item.title}</h3>
              <p className="upcoming-item-time">{item.time}</p>
            </div>
          </div>
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
