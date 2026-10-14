export interface WeeklyGoalCardProps {
  completedLessons?: number;
  targetLessons?: number | null;
  completedDays?: boolean[];
  goalSet?: boolean;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onGoalSet?: (lessons: number) => void;
}
