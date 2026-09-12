/**
 * StreakAnalytics - Complete Streak Analytics Dashboard
 * Combines heatmap, metrics, and milestones into a cohesive dashboard
 */

import { ActivityHeatmap } from './ActivityHeatmap';
import { MetricCards } from './MetricCards';
import { MilestoneBadges } from './MilestoneBadges';
import type { StreakAnalyticsData } from '../../../shared/utils/streakEngine';
import './StreakAnalytics.css';

interface StreakAnalyticsProps {
  data: StreakAnalyticsData;
}

export function StreakAnalytics({ data }: StreakAnalyticsProps) {
  return (
    <section className="streak-analytics" aria-labelledby="streak-analytics-title">
      <header className="streak-analytics-header">
        <h1 id="streak-analytics-title" className="streak-analytics-title">Streak Analytics</h1>
        <p className="streak-analytics-subtitle">Track your learning consistency and achievements</p>
      </header>

      {/* Metric Cards */}
      <section className="streak-analytics-section" aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="streak-analytics-section-title">Your Streak</h2>
        <MetricCards streak={data.streak} />
      </section>

      {/* Activity Heatmap */}
      <section className="streak-analytics-section" aria-labelledby="heatmap-title">
        <h2 id="heatmap-title" className="streak-analytics-section-title">Activity Heatmap</h2>
        <ActivityHeatmap cells={data.heatmap} months={12} />
      </section>

      {/* Milestones */}
      <section className="streak-analytics-section" aria-labelledby="milestones-title">
        <h2 id="milestones-title" className="streak-analytics-section-title">Milestones & Badges</h2>
        <MilestoneBadges milestones={data.milestones} />
      </section>

      {/* Weekly Activity Summary */}
      <section className="streak-analytics-section" aria-labelledby="weekly-title">
        <h2 id="weekly-title" className="streak-analytics-section-title">Weekly Activity</h2>
        <WeeklyActivityChart weeklyActivity={data.weeklyActivity} />
      </section>

      {/* Monthly Stats */}
      <section className="streak-analytics-section" aria-labelledby="monthly-title">
        <h2 id="monthly-title" className="streak-analytics-section-title">This Month</h2>
        <MonthlyStatsCard stats={data.monthlyStats} />
      </section>
    </section>
  );
}

// Weekly Activity Chart Component
function WeeklyActivityChart({ weeklyActivity }: { weeklyActivity: { day: string; minutes: number }[] }) {
  const maxMinutes = Math.max(...weeklyActivity.map(w => w.minutes), 1);

  return (
    <div className="weekly-activity-chart" role="img" aria-label="Weekly activity chart">
      <div className="weekly-activity-bars" role="graphics-document" aria-roledescription="bar chart">
        {weeklyActivity.map((week, index) => (
          <div key={index} className="weekly-activity-bar-wrapper">
            <div className="weekly-activity-bar-container">
              <div
                className="weekly-activity-bar"
                style={{ height: `${(week.minutes / maxMinutes) * 100}%` }}
                role="img"
                aria-label={`${week.day}: ${week.minutes} minutes`}
              />
            </div>
            <span className="weekly-activity-day">{week.day}</span>
          </div>
        ))}
      </div>
      <div className="weekly-activity-legend">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

// Monthly Stats Card
function MonthlyStatsCard({ stats }: { stats: { activeDays: number; totalMinutes: number; averageMinutesPerActiveDay: number } }) {
  return (
    <div className="monthly-stats-grid" role="region" aria-label="Monthly statistics">
      <div className="monthly-stat-card">
        <div className="monthly-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <p className="monthly-stat-value">{stats.activeDays}</p>
          <p className="monthly-stat-label">Active Days</p>
        </div>
      </div>

      <div className="monthly-stat-card">
        <div className="monthly-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <p className="monthly-stat-value">{formatMinutes(stats.totalMinutes)}</p>
          <p className="monthly-stat-label">Total Minutes</p>
        </div>
      </div>

      <div className="monthly-stat-card">
        <div className="monthly-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <p className="monthly-stat-value">{stats.averageMinutesPerActiveDay} min</p>
          <p className="monthly-stat-label">Avg/Active Day</p>
        </div>
      </div>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}