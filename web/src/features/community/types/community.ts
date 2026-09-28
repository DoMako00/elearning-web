// Community Module Type Definitions
// Strict TypeScript types for posts, events, members, and real-time socket events

export type TopicCategory =
  | "all"
  | "groups"
  | "discussions"
  | "qa"
  | "resources"
  | "events";

export interface CommunityMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  isOnline: boolean;
  statusText?: string;
  reputationPoints?: number;
  rank?: number;
}
export interface ALLCommunityMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  isOnline: boolean;
  statusText?: string;
  reputationPoints?: number;
  rank?: number;
}

export interface DiscussionReply {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
  };
  content: string;
  timestamp: number;
  timeAgo: string;
  upvotesCount?: number;
}

export interface DiscussionPost {
  id: string;
  title: string;
  content?: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
  };
  category: {
    key: string;
    label: string;
    badgeColor?: string; // e.g., emerald, amber, blue, purple
  };
  topicIcon: "js" | "palette" | "chart" | "cubes" | "atom" | "code" | "message";
  iconBgColor?: string;
  iconColor?: string;
  timeAgo: string;
  timestamp: number;
  repliesCount: number;
  viewsCount: number;
  upvotesCount?: number;
  isTrending?: boolean;
  isOptimistic?: boolean;
  replies?: DiscussionReply[];
}

export interface TrendingTopic {
  id: string;
  title: string;
  repliesCount: number;
  topicIcon: "atom" | "layout" | "chart" | "nextjs" | "brain" | "code";
  iconColor?: string;
  iconBgColor?: string;
  category: string;
}

export interface FeaturedStudyGroup {
  id: string;
  title: string;
  description: string;
  memberCount: number;
  activeCountText: string;
  tags: {
    level: string;
    tech: string;
    type: string;
    schedule: string;
  };
  avatars: string[];
  isJoined?: boolean;
}

export interface CommunityEvent {
  id: string;
  month: string;
  day: string;
  type: string;
  title: string;
  dateString: string;
  timeString: string;
  isReminded?: boolean;
  isJoined?: boolean;
  actionType: "join" | "remind";
}

export interface MentorSpotlight {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  experienceBadge: string;
  bioSummary: string;
  isVerified: boolean;
}

export interface TopContributor {
  id: string;
  rank: number;
  name: string;
  role?: string;
  avatarUrl: string;
  points: number;
}

// ----------------------------------------------------
// Real-time WebSocket Types
// ----------------------------------------------------

export type CommunitySocketEvent =
  | {
      type: "MEMBER_STATUS_CHANGED";
      payload: {
        memberId: string;
        isOnline: boolean;
        onlineCount: number;
        updatedMember?: CommunityMember;
      };
    }
  | {
      type: "NEW_DISCUSSION_POST";
      payload: {
        post: DiscussionPost;
      };
    }
  | {
      type: "NEW_REPLY";
      payload: {
        postId: string;
        reply: DiscussionReply;
        repliesCount: number;
      };
    }
  | {
      type: "METRICS_UPDATED";
      payload: {
        postId: string;
        repliesCount?: number;
        viewsCount?: number;
        upvotesCount?: number;
      };
    };

export interface CommunityFilterState {
  searchQuery: string;
  selectedCategory: TopicCategory;
  dropdownTopic: string;
}
