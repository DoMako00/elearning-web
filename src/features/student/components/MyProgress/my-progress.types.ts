export interface MyProgressProps {
  completionPercentage?: number;
  monthlyGrowth?: number;
  growthLabel?: string;
  onViewProgress?: () => void;
  chartData?: number[];
  chartUnit?: string;
  hasProgress?: boolean;
  loading?: boolean;
  error?: boolean;
}
