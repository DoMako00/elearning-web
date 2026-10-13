export interface WeeklyGoalCardProps {
  completedHours?: number;
  targetHours?: number;
  completedDays?: boolean[];
  /** When false, shows the "Set your goal" first-time prompt instead of progress. Defaults to false if no completedHours given and no explicit target set. */
  goalSet?: boolean;
  onGoalSet?: (hours: number) => void;
}
