export interface UpcomingItem {
  id: string | number;
  title: string;
  time: string;
  iconType?: 'quiz' | 'session' | 'assignment' | string;
}

export interface UpcomingProps {
  title?: string;
  count?: number;
  items?: UpcomingItem[];
  onViewCalendar?: () => void;
}
