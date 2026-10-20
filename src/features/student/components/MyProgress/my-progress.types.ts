export interface MyProgressProps {
  completionPercentage?: number;
  monthlyGrowth?: number;
  growthLabel?: string;
  onViewProgress?: () => void;
  chartData?: Array<{ date: string; completedLessons: number }>;
  weeklyCompletedLessons?: number;
  hasProgress?: boolean;
  loading?: boolean;
  error?: boolean;
}
