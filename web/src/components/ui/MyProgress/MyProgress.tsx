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
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="my-progress-tooltip">
      {payload[0].value}%
    </div>
  );
}

export function MyProgress({
  completionPercentage,
  monthlyGrowth,
  growthLabel = 'this month',
  onViewProgress,
  chartData,
}: MyProgressProps) {
  const navigate = useNavigate();
  const points = buildChartPoints(chartData ?? []);

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
      aria-label={`My Progress: ${completionPercentage === undefined ? "unavailable" : `${completionPercentage}% overall completion`}`}
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
            aria-label={completionPercentage === undefined ? "Progress unavailable" : `${completionPercentage} percent`}
          >
            {completionPercentage === undefined ? "—" : `${completionPercentage}%`}
          </p>
        </div>

        <div className="my-progress-chart-wrap">
          {chartData?.length ? <ResponsiveContainer width="100%" height="100%">
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

              <YAxis domain={[0, 100]} hide width={0} />

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
          </ResponsiveContainer> : <p role="status">Progress data is unavailable.</p>}

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
