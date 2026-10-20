export interface WeeklyGoalCardProps {
  completedLessons?: number;
  targetLessons?: number | null;
  completedDays?: boolean[];
  goalSet?: boolean;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  /** The saved goal could not be read; never shown as "no goal set". */
  loadError?: string | null;
  onRetry?: () => void;
  onGoalSet?: (lessons: number) => void;
}
