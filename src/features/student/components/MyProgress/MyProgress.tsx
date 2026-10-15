import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MyProgressProps } from './my-progress.types';
import './index.css';

function buildChartPoints(values: number[]) {
  return values.map((value, index) => ({ index, value }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  unit?: string;
}

function CustomTooltip({ active, payload, unit = '%' }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const valueLabel = unit === '%' ? `${value}%` : `${value} ${unit}${value === 1 ? '' : 's'}`;
  return (
    <div className="my-progress-tooltip">
      {valueLabel}
    </div>
  );
}

export function MyProgress({
  completionPercentage,
  monthlyGrowth,
  growthLabel = 'this month',
  onViewProgress,
  chartData,
  chartUnit = '%',
  hasProgress = true,
  loading = false,
  error = false,
}: MyProgressProps) {
  const navigate = useNavigate();
  const chartValues = chartData ?? [];
  const points = buildChartPoints(chartValues);
  const chartMax = Math.max(1, ...chartValues);

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
        <h2 className="my-progress-title">My Progress</h2>
        <button
          type="button"
          aria-label="Progress unavailable"
          disabled
          className="my-progress-icon-btn hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw
            className="my-progress-icon-btn-icon transition-transform"
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="my-progress-body">
        <div className="my-progress-text-col">
          <p className="my-progress-label">Overall Completion</p>
          <p
            className="my-progress-percentage"
            aria-label={loading ? "Progress loading" : error || completionPercentage === undefined ? "Progress unavailable" : `${completionPercentage} percent`}
          >
            {loading || error || completionPercentage === undefined ? "—" : `${completionPercentage}%`}
          </p>
        </div>

        <div className="my-progress-chart-wrap">
          {loading ? <p role="status" className="my-progress-state">Loading progress…</p>
            : error ? <p role="alert" className="my-progress-state">Progress could not be loaded.</p>
            : chartValues.length ? <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
            >
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <YAxis domain={[0, chartMax]} hide width={0} />

              <Tooltip
                content={<CustomTooltip unit={chartUnit} />}
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

          {monthlyGrowth === undefined ? null : <div className="my-progress-badge" aria-label={`${monthlyGrowth}% growth ${growthLabel}`}>
            <TrendingUp className="my-progress-badge-icon" aria-hidden="true" />
            <span>{monthlyGrowth}% {growthLabel}</span>
          </div>}
        </div>
      </div>

      <div className="my-progress-footer">
        <button
          type="button"
          onClick={handleViewProgress}
          className="my-progress-cta cursor-pointer"
        >
          View Progress
        </button>
      </div>
    </section>
  );
}
