export interface MyProgressProps {
  completionPercentage?: number;
  monthlyGrowth?: number;
  growthLabel?: string;
  onViewProgress?: () => void;
  chartData?: number[];
  
}
