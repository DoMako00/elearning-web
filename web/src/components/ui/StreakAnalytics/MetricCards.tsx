/**
 * MetricCards - Streak metrics summary bar
 * Matches GreenLearn design system
 */

import { Flame, Trophy, CalendarDays, Award } from 'lucide-react';
import type { StreakResult } from '../../shared/utils/streakEngine';
import './MetricCards.css';

interface MetricCardsProps {
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    freezePassesRemaining: number;
    streakPreservedByFreeze: boolean;
    isActiveToday: boolean;
  };
}

export function MetricCards({ streak }: MetricCardsProps) {
  return (
    <div className="streak-metric-cards" role="region" aria-label="Streak metrics">
      <div className="streak-metric-card streak-metric-card--streak">
        <div className="streak-metric-icon streak-metric-icon--fire">
          <svg className="streak-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2.1 1.6 2.5 3.5 1.5 4.5" />
            <path d="M14.5 9.5A2.5 2.5 0 0 1 11 12c0-1.38.5-2 1-3 2.291-2.867 5-3.817 6-4 1.215.177 2.5.6 3.5 2 1.072 1.072 1.5 2.4 1.5 3.5" />
          </svg>
        </div>
        <div className="metric-content">
          <p className="metric-value">{streak.currentStreak}</p>
          <p className="metric-label">Current Streak</p>
          <p className="metric-subtext">{isActiveToday ? 'Active today' : 'Keep it up!'}</p>
        </div>
      </div>

      <div className="streak-metric-card streak-metric-card--longest">
        <div className="streak-metric-icon streak-metric-icon--trophy">
          <svg className="streak-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M18 9a2.5 2.5 0 0 0-5 0" />
            <path d="M6 9a2.5 2.5 0 0 1 5 0" />
            <path d="M12 4v7" />
            <path d="M10 14v-2" />
            <path d="M14 14v-2" />
          </svg>
        </div>
        <div className="metric-content">
          <p className="metric-value">{streak.longestStreak}</p>
          <p className="metric-label">Longest Streak</p>
          <p className="metric-subtext">Best record</p>
        </div>
      </div>

      <div className="streak-metric-card streak-metric-card--total">
        <div className="streak-metric-icon streak-metric-icon--calendar">
          <svg className="streak-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="metric-content">
          <p className="metric-value">{formatNumber(streak.totalActiveDays)}</p>
          <p className="metric-label">Total Active Days</p>
          <p className="metric-subtext">All-time learning days</p>
        </div>
      </div>

      <div className="streak-metric-card streak-metric-card--freeze">
        <div className="streak-metric-icon streak-metric-icon--freeze">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a10 10 0 1 1-10 10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div className="metric-content">
          <p className="metric-value">{streak.freezePassesRemaining}</p>
          <p className="metric-label">Freeze Passes</p>
          <p className="metric-subtext">{streak.streakPreservedByFreeze ? 'Used today!' : 'Available'}</p>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}