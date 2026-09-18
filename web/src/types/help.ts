export type TicketStatus = "Open" | "In review" | "Resolved";

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g., "#GL-4821"
  title: string;
  status: TicketStatus;
  createdAt: string; // e.g., "2 hours ago"
  category: string;
  description?: string;
  iconType: "video" | "credit-card" | "smartphone" | "file-text";
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  articleCount: number;
  iconName: string;
  colorTheme?: string;
}

export interface HelpArticle {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  iconName: string;
  readTime: string; // e.g., "3 min read"
  lastUpdated: string;
  views?: string;
  isPopular?: boolean;
  content: {
    overview: string;
    steps?: {
      stepNumber: number;
      title: string;
      description: string;
    }[];
    callout?: {
      type: "tip" | "warning" | "note";
      text: string;
    };
    relatedArticleIds?: string[];
  };
}

export interface HelpResourceLink {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  url: string;
}

export interface LiveChatAgent {
  name: string;
  avatar: string;
  status: "available" | "busy" | "offline";
  hours: string; // e.g. "Available daily 9:00 AM - 9:00 PM (GMT+3)"
}
