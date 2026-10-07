export type EventType = "quiz" | "live_session" | "assignment" | "office_hours" | "study_block";

export type CalendarViewMode = "week" | "month";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:00" (24h format)
  endTime: string; // e.g. "10:30"
  displayTime: string; // e.g. "9:00 - 10:30 AM"
  description?: string;
  courseTitle?: string;
  locationOrUrl?: string;
  status?: "upcoming" | "in-progress" | "completed";
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  type: EventType;
  hasAction?: boolean;
  actionLabel?: string;
  linkUrl?: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  dateLabel: string;
  type: "assignment" | "goal" | "quiz";
  completed?: boolean;
}

export interface StudyGoalProgress {
  weeklyPercentage: number;
  completedHours: number;
  targetHours: number;
  streakDays: {
    day: "S" | "M" | "T" | "W" | "T" | "F" | "S";
    completed: boolean;
    isCurrent?: boolean;
  }[];
}
