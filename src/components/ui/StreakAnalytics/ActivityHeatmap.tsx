/**
 * ActivityHeatmap - GitHub-style contribution matrix for learning activity
 * Matches GreenLearn design system
 */

import type { ActivityHeatmapCell } from '../../../shared/utils/streakEngine';
import './ActivityHeatmap.css';

interface ActivityHeatmapProps {
  cells: ActivityHeatmapCell[];
  months?: number;
  onCellClick?: (dateStr: string, minutes: number) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function ActivityHeatmap({ cells, onCellClick }: ActivityHeatmapProps) {
  return (
    <div className="activity-heatmap" role="region" aria-label="Activity heatmap">
      <div className="activity-heatmap-legend" aria-hidden="true">
        <span className="activity-heatmap-legend-label">Less</span>
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            className="activity-heatmap-legend-cell"
            style={{ backgroundColor: `var(--heatmap-${level}, #${['c6f6d5', '9ae6b4', '68d391', '38a169'][level - 1]})` }}
            title={`${level === 1 ? 'Low' : level === 2 ? 'Medium' : level === 3 ? 'High' : 'Very high'} activity`}
          />
        ))}
        <span className="activity-heatmap-legend-label">More</span>
      </div>

      <div className="activity-heatmap-months">
        {Array.from({ length: 12 }, (_, i) => i).map(month => {
          const monthCells = cells.filter(cell => {
            if (!cell.dateStr) return false;
            const date = new Date(cell.dateStr + 'T00:00:00');
            return date.getMonth() === month;
          });

          return (
            <div key={month} className="activity-heatmap-month">
              <div className="activity-heatmap-month-header">
                <span className="activity-heatmap-month-name">{MONTHS[month]}</span>
              </div>
              <div className="activity-heatmap-weekdays-mini" aria-hidden="true">
                {['M','T','W','T','F','S','S'].map((d,i)=><span key={i}>{d}</span>)}
              </div>
              <div className="activity-heatmap-week-cells">
                {monthCells.length > 0 ? (
                  monthCells.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`activity-heatmap-cell ${cell.isCurrentMonth ? '' : 'activity-heatmap-cell--other-month'}`}
                      style={{ backgroundColor: `var(--heatmap-${cell.activityLevel || 0}, #eef2ef)` }}
                      onClick={() => onCellClick?.(cell.dateStr, cell.minutes)}
                      title={`${cell.dateStr}: ${cell.minutes} mins`}
                    />
                  ))
                ) : (
                  Array.from({ length: 35 }, (_, i) => (
                    <div 
                      key={i} 
                      className="activity-heatmap-cell activity-heatmap-cell--other-month"
                      style={{ backgroundColor: 'var(--heatmap-0, #eef2ef)' }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}