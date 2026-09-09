import { useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { ToastNotification } from '../ToastNotification';
import type { MyProgressProps } from './my-progress.types';
import './index.css';

const DEFAULT_CHART_DATA = [10, 18, 14, 22, 19, 28, 24, 30, 27, 30, 32, 40, 70, 78, 60, 32, 55, 56, 60, 50, 63, 65, 67, 72, 70, 80];

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
  completionPercentage = 68,
  monthlyGrowth = 12,
  growthLabel = 'this month',
  onViewProgress,
  chartData = DEFAULT_CHART_DATA,
}: MyProgressProps) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toastMessage, showToast } = useToast();
  const points = buildChartPoints(chartData);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Progress calculation is up to date");
    }, 1500);
  };

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
      aria-label={`My Progress: ${completionPercentage}% overall completion`}
    >
      <ToastNotification message={toastMessage} />

      <div className="my-progress-header">
        <h2 className="my-progress-title">My Progress</h2>
        <button
          type="button"
          aria-label="Refresh progress"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="my-progress-icon-btn hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`my-progress-icon-btn-icon transition-transform ${
              isRefreshing ? "animate-spin text-(--color-brand,#20a862)" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="my-progress-body">
        <div className="my-progress-text-col">
          <p className="my-progress-label">Overall Completion</p>
          <p
            className="my-progress-percentage"
            aria-label={`${completionPercentage} percent`}
          >
            {completionPercentage}%
          </p>
        </div>

        <div className="my-progress-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>

          <div className="my-progress-badge" aria-label={`${monthlyGrowth}% growth ${growthLabel}`}>
            <TrendingUp
              className="my-progress-badge-icon"
              aria-hidden="true"
            />
            <span>{monthlyGrowth}% {growthLabel}</span>
          </div>
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
