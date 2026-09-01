const fs = require('fs');
const path = 'C:\\Users\\shehab\\OneDrive\\Desktop\\E-learning stage\\elearning-web\\web\\src\\components\\ui\\StreakAnalytics\\ActivityHeatmap.tsx';

const content = `/**
 * ActivityHeatmap - GitHub-style contribution matrix for learning activity
 * Matches GreenLearn design system
 */

import { useMemo } from 'react';
import type { ActivityHeatmapCell } from '../../shared/utils/streakEngine';
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ACTIVITY_COLORS: Record<number, string> = {
  0: 'var(--heatmap-0, #eef2ef)',
  1: 'var(--heatmap-1, #c6f6d5)',
  2: 'var(--heatmap-2, #9ae6b4)',
  3: 'var(--heatmap-3, #68d391'),
  4: 'var(--heatmap-4, #38a169)',
};

export function ActivityHeatmap({ cells, months = 12, onCellClick }: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="activity-heatmap" role="region" aria-label="Activity heatmap">
      <div className="activity-heatmap-legend" aria-hidden="true">
        <span className="activity-heatmap-legend-label">Less</span>
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            className="activity-heatmap-legend-cell"
            style={{ backgroundColor: \`var(--heatmap-\${level}, #\${['c6f6d5', '9ae6b4', '68d391', '38a169'][level - 1]})\` }}
            title={\`\${level === 1 ? 'Low' : level === 2 ? 'Medium' : level === 3 ? 'High' : 'Very high'} activity\`}
          />
        ))}
        <span className="activity-heatmap-legend-label">More</span>
      </div>

      <div className="activity-heatmap-months">
        {Array.from({ length: 12 }, (_, i) => i).slice(-12).map(month => {
          const monthCells = cells.filter(cell => {
            if (!cell.dateStr) return false;
            const date = new Date(cell.dateStr + 'T00:00:00');
            return date.getMonth() === month;
          });

          return (
            <div key={month} className="activity-heatmap-month">
              <div className="activity-heatmap-month-header">
                <span className="activity-heatmap-month-name">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]}</span>
              </div>
              <div className="activity-heatmap-weekdays-mini" aria-hidden="true">
                {['M','T','W','T','F','S','S'].map((d,i)=><span key={i}>{d}</span>)}
              </div>
              <div className="activity-heatmap-week-cells">
                {Array.from({length: 42}, (_, i) => (
                  <div 
                    key={i} 
                    className="activity-heatmap-cell activity-heatmap-cell--other-month"
                    style={{ backgroundColor: 'var(--heatmap-0, #eef2ef)' }}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

interface ActivityHeatmapProps {
  cells: ActivityHeatmapCell[];
  months?: number;
  onCellClick?: (dateStr: string, minutes: number) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ACTIVITY_COLORS: Record<number, string> = {
  0: 'var(--heatmap-0, #eef2ef)',
  1: 'var(--heatmap-1, #c6f6d5)',
  2: 'var(--heatmap-2, #9ae6b4)',
  3: 'var(--heatmap-3, #68d391'),
  4: 'var(--heatmap-4, #38a169)',
};

export { ActivityHeatmap };