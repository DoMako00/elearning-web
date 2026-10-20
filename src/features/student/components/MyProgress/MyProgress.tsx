import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, CalendarDays, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MyProgressProps } from './my-progress.types';
import './index.css';

function buildChartPoints(days: NonNullable<MyProgressProps['chartData']>) {
  return days.map((day) => ({
    day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${day.date}T12:00:00`)),
    value: day.completedLessons,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="my-progress-tooltip">
      {label ? <span>{label}</span> : null}
      <strong>{value} {value === 1 ? 'lesson' : 'lessons'}</strong>
    </div>
  );
}

export function MyProgress({
  completionPercentage,
  monthlyGrowth,
  growthLabel = 'this month',
  onViewProgress,
  chartData,
  weeklyCompletedLessons,
  hasProgress = true,
  loading = false,
  error = false,
}: MyProgressProps) {
  const navigate = useNavigate();
  const points = buildChartPoints(chartData ?? []);
  const chartMax = Math.max(1, ...(chartData ?? []).map((day) => day.completedLessons));

  const handleViewProgress = () => {
    if (onViewProgress) {
      onViewProgress();
    } else {
      navigate('/profile?tab=activity');
    }
  };

  return (
    <section
      className="my-progress-card relative"
      aria-label={`My Progress: ${loading ? "loading" : error || completionPercentage === undefined ? "unavailable" : `${completionPercentage}% overall completion`}`}
    >
      <div className="my-progress-header">
        <div className="my-progress-heading">
          <span className="my-progress-heading-icon" aria-hidden="true">
            <TrendingUp />
          </span>
          <div>
            <h2 className="my-progress-title">My Progress</h2>
            <p className="my-progress-kicker">LEARNING OVERVIEW</p>
          </div>
        </div>
        <span className="my-progress-period">
          <CalendarDays aria-hidden="true" />
          <span>THIS WEEK</span>
        </span>
      </div>

      <div className="my-progress-body">
        <div className="my-progress-summary">
          <div className="my-progress-text-col">
            <p className="my-progress-label">Overall completion</p>
            <p
              className="my-progress-percentage"
              aria-label={loading ? "Progress loading" : error || completionPercentage === undefined ? "Progress unavailable" : `${completionPercentage} percent`}
            >
              {loading || error || completionPercentage === undefined ? "—" : `${completionPercentage}%`}
            </p>
          </div>
          {!loading && !error && weeklyCompletedLessons !== undefined ? (
            <div className="my-progress-week-total" aria-label={`${weeklyCompletedLessons} lessons completed this week`}>
              <span>THIS WEEK</span>
              <strong>{weeklyCompletedLessons}<small>{weeklyCompletedLessons === 1 ? 'lesson' : 'lessons'}</small></strong>
            </div>
          ) : null}
        </div>

        <div className="my-progress-chart-heading">
          <span>Daily activity</span>
          {monthlyGrowth === undefined ? null : <span className="my-progress-badge" aria-label={`${monthlyGrowth}% growth ${growthLabel}`}>
            <TrendingUp className="my-progress-badge-icon" aria-hidden="true" />
            {monthlyGrowth}% {growthLabel}
          </span>}
        </div>

        <div className="my-progress-chart-wrap" aria-label="Completed lessons by day this week">
          {loading ? <p role="status" className="my-progress-state">Loading progress…</p>
            : error ? <p role="alert" className="my-progress-state">Progress could not be loaded.</p>
            : points.length ? <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 4, right: 6, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-quiet)', fontSize: 9, fontWeight: 600 }}
                tickMargin={4}
                interval={0}
                height={19}
              />
              <YAxis domain={[0, chartMax]} hide width={0} allowDecimals={false} />

              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary-color)"
                strokeWidth={2.5}
                fill="url(#progressGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: 'var(--primary-color)',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer> : <p role="status" className="my-progress-state">Progress data is unavailable.</p>}

          {!loading && !error && !hasProgress ? <p className="my-progress-empty-note" role="status">No progress yet</p> : null}
        </div>
      </div>

      <div className="my-progress-footer">
        <button
          type="button"
          onClick={handleViewProgress}
          className="my-progress-cta cursor-pointer"
        >
          View Progress
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
