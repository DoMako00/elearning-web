export interface UpcomingItem {
  id: string | number;
  title: string;
  time: string;
  iconType?: 'quiz' | 'session' | 'assignment' | 'lab' | 'exam' | string;
  tag?: string;
  href?: string;
}

export interface UpcomingProps {
  actionMessage?: string | null;
  onOpenItem?: (item: UpcomingItem) => void;
  title?: string;
  count?: number;
  items?: UpcomingItem[];
  onViewCalendar?: () => void;
  actionPath?: string;
  actionLabel?: string;
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
}

