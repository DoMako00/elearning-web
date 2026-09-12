import type {
  CommunityMember,
  ALLCommunityMember,
  DiscussionPost,
  TrendingTopic,
  FeaturedStudyGroup,
  CommunityEvent,
  MentorSpotlight,
  TopContributor,
} from "../types/community";

export const INITIAL_FEATURED_GROUP: FeaturedStudyGroup = {
  id: "react-devs-hub",
  title: "React Developers Hub",
  description:
    "A collaborative space for React developers to learn, share projects, and solve real-world problems together.",
  memberCount: 12,
  activeCountText: "+8 active this week",
  tags: {
    level: "All levels",
    tech: "React",
    type: "Projects",
    schedule: "Daily discussions",
  },
  avatars: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
  ],
  isJoined: false,
};

export const INITIAL_TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: "trend-1",
    title: "State Management in React",
    repliesCount: 24,
    topicIcon: "atom",
    category: "React",
  },
  {
    id: "trend-2",
    title: "CSS Grid vs Flexbox",
    repliesCount: 18,
    topicIcon: "layout",
    category: "Design",
  },
  {
    id: "trend-3",
    title: "Data Visualization with D3.js",
    repliesCount: 15,
    topicIcon: "chart",
    category: "Data Science",
  },
  {
    id: "trend-4",
    title: "Next.js 14 Features",
    repliesCount: 12,
    topicIcon: "nextjs",
    category: "React",
  },
  {
    id: "trend-5",
    title: "Machine Learning Basics",
    repliesCount: 10,
    topicIcon: "brain",
    category: "AI / Data",
  },
];

export const INITIAL_DISCUSSIONS: DiscussionPost[] = [
  {
    id: "disc-1",
    title: "How do you handle state management in large React apps?",
    content:
      "When scaling modern React applications, choosing between Zustand, Redux Toolkit, and TanStack Query often sparks debate. What architectural boundaries do you establish between server state and purely client-side UI state?",
    author: {
      id: "u-alex",
      name: "Alex Morgan",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Lead Product Designer",
    },
    category: {
      key: "react",
      label: "React",
      badgeColor: "emerald",
    },
    topicIcon: "js",
    timeAgo: "2h ago",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    repliesCount: 24,
    viewsCount: 156,
    upvotesCount: 42,
    replies: [
      {
        id: "rep-1",
        author: {
          id: "u-sarah",
          name: "Sarah Chen",
          avatarUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
          role: "Frontend Developer",
        },
        content:
          "We treat TanStack Query as the single source of truth for all remote server state, and keep Zustand only for transient global UI state (modals, active filters). It completely removed Redux boilerplate for us.",
        timestamp: Date.now() - 90 * 60 * 1000,
        timeAgo: "1h ago",
        upvotesCount: 12,
      },
      {
        id: "rep-2",
        author: {
          id: "u-james",
          name: "James Wilson",
          avatarUrl:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80",
          role: "Full Stack Developer",
        },
        content:
          "Agreed. Also using React Context sparingly for things that rarely update (theme, active tenant, auth session) prevents needless re-renders.",
        timestamp: Date.now() - 45 * 60 * 1000,
        timeAgo: "45m ago",
        upvotesCount: 8,
      },
    ],
  },
  {
    id: "disc-2",
    title: "Best practices for designing accessible interfaces",
    content:
      "Accessibility (a11y) shouldn't be an afterthought. What are your core checklists when auditing color contrast, keyboard navigation (focus visible), and screen reader ARIA landmarks?",
    author: {
      id: "u-maria",
      name: "Maria Garcia",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
      role: "UI/UX Designer",
    },
    category: {
      key: "design",
      label: "Design",
      badgeColor: "purple",
    },
    topicIcon: "palette",
    timeAgo: "3h ago",
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    repliesCount: 18,
    viewsCount: 98,
    upvotesCount: 31,
    replies: [
      {
        id: "rep-3",
        author: {
          id: "u-alex",
          name: "Alex Morgan",
          avatarUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
          role: "Lead Product Designer",
        },
        content:
          "Always test with VoiceOver or NVDA. Ensure interactive elements use native <button> instead of <div onClick> to guarantee keyboard accessibility out of the box.",
        timestamp: Date.now() - 120 * 60 * 1000,
        timeAgo: "2h ago",
        upvotesCount: 14,
      },
    ],
  },
  {
    id: "disc-3",
    title: "How to choose the right chart for your data?",
    content:
      "When visualizing analytics dashboards, what principles do you follow to decide between Bar charts, Area lines, and Radial rings without overwhelming the student?",
    author: {
      id: "u-rohan",
      name: "Rohan Kumar",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Data Scientist",
    },
    category: {
      key: "datascience",
      label: "Data Science",
      badgeColor: "blue",
    },
    topicIcon: "chart",
    timeAgo: "5h ago",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    repliesCount: 16,
    viewsCount: 87,
    upvotesCount: 27,
    replies: [
      {
        id: "rep-4",
        author: {
          id: "u-priya",
          name: "Priya Patel",
          avatarUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
          role: "Frontend Developer",
        },
        content:
          "Area charts are great for continuous trends over time (like weekly study pace). Use Radial rings only for part-to-whole goals with a defined 100% ceiling.",
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
        timeAgo: "3h ago",
        upvotesCount: 9,
      },
    ],
  },
  {
    id: "disc-4",
    title: "Node.js performance optimization tips",
    content:
      "Profiling event loop lag, leveraging clustering, and optimizing garbage collection in production microservices. Let's share practical benchmarking wins.",
    author: {
      id: "u-james",
      name: "James Wilson",
      avatarUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Full Stack Developer",
    },
    category: {
      key: "backend",
      label: "Backend",
      badgeColor: "emerald",
    },
    topicIcon: "cubes",
    timeAgo: "6h ago",
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    repliesCount: 12,
    viewsCount: 64,
    upvotesCount: 19,
    replies: [],
  },
  {
    id: "disc-5",
    title: "Understanding useEffect cleanup in React",
    content:
      "Why is the cleanup function critical for preventing memory leaks when managing WebSockets, subscriptions, and DOM event listeners in modern React?",
    author: {
      id: "u-priya",
      name: "Priya Patel",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Frontend Developer",
    },
    category: {
      key: "react",
      label: "React",
      badgeColor: "emerald",
    },
    topicIcon: "atom",
    timeAgo: "7h ago",
    timestamp: Date.now() - 7 * 60 * 60 * 1000,
    repliesCount: 9,
    viewsCount: 53,
    upvotesCount: 15,
    replies: [],
  },
];

export const INITIAL_MENTOR: MentorSpotlight = {
  id: "mentor-alex",
  name: "Alex Morgan",
  role: "Lead Product Designer",
  avatarUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&h=180&q=80",
  experienceBadge: "10+ years designing digital products",
  bioSummary: "Specializes in user-centered design and design systems.",
  isVerified: true,
};

export const INITIAL_ONLINE_MEMBERS: CommunityMember[] = [
  {
    id: "u-alex",
    name: "Alex Morgan",
    role: "Lead Product Designer",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "u-sarah",
    name: "Sarah Chen",
    role: "Frontend Developer",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "u-rohan",
    name: "Rohan Kumar",
    role: "Data Scientist",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "u-maria",
    name: "Maria Garcia",
    role: "UI/UX Designer",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "u-james",
    name: "James Wilson",
    role: "Full Stack Developer",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
    
];
export const ALL_COMMUNITY_MEMBERS: MentorSpotlight = {
  id: "mentor-alex",
  name: "Alex Morgan",
  role: "Lead Product Designer",
  avatarUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&h=180&q=80",
  experienceBadge: "10+ years designing digital products",
  bioSummary: "Specializes in user-centered design and design systems.",
  isVerified: true,
};

export const ALL_COMMUNITY_MEMBERSs: ALLCommunityMember[] = [
  {
    id: "all-u-alex",
    name: "Alex Morgan",
    role: "Lead Product Designer",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-sarah",
    name: "Sarah Chen",
    role: "Frontend Developer",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-rohan",
    name: "Rohan Kumar",
    role: "Data Scientist",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-maria",
    name: "Maria Garcia",
    role: "UI/UX Designer",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-james",
    name: "James Wilson",
    role: "Full Stack Developer",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-priya",
    name: "Priya Patel",
    role: "Frontend Developer",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: false,
  },
  {
    id: "all-u-luca",
    name: "Luca Romano",
    role: "Backend Engineer",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: false,
  },
  {
    id: "all-u-aisha",
    name: "Aisha Ndiaye",
    role: "Machine Learning Engineer",
    avatarUrl:
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-tom",
    name: "Tom Nguyen",
    role: "DevOps Engineer",
    avatarUrl:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: false,
  },
  {
    id: "all-u-emily",
    name: "Emily Zhao",
    role: "Product Manager",
    avatarUrl:
      "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-carlos",
    name: "Carlos Mendez",
    role: "Mobile Developer",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: false,
  },
  {
    id: "all-u-nina",
    name: "Nina Petrov",
    role: "QA Engineer",
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-david",
    name: "David Kim",
    role: "Security Engineer",
    avatarUrl:
      "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: false,
  },
  {
    id: "all-u-fatima",
    name: "Fatima Al-Hassan",
    role: "Cloud Architect",
    avatarUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: true,
  },
  {
    id: "all-u-oliver",
    name: "Oliver Baxter",
    role: "Tech Lead",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&h=100&q=80",
    isOnline: false,
  },
];

export const INITIAL_COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    id: "event-1",
    month: "MAY",
    day: "22",
    type: "Live Session",
    title: "Building Scalable APIs",
    dateString: "May 22",
    timeString: "4:00 PM",
    actionType: "join",
    isJoined: false,
  },
  {
    id: "event-2",
    month: "MAY",
    day: "24",
    type: "Study Group",
    title: "React Performance Deep Dive",
    dateString: "May 24",
    timeString: "7:00 PM",
    actionType: "join",
    isJoined: false,
  },
  {
    id: "event-3",
    month: "MAY",
    day: "26",
    type: "Community AMA",
    title: "Ask Me Anything: UX Design",
    dateString: "May 26",
    timeString: "5:00 PM",
    actionType: "remind",
    isReminded: false,
  },
];

export const INITIAL_TOP_CONTRIBUTORS: TopContributor[] = [
  {
    id: "cont-1",
    rank: 1,
    name: "Alex Morgan",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    points: 1250,
  },
  {
    id: "cont-2",
    rank: 2,
    name: "Sarah Chen",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
    points: 980,
  },
  {
    id: "cont-3",
    rank: 3,
    name: "Rohan Kumar",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
    points: 870,
  },
  {
    id: "cont-4",
    rank: 4,
    name: "Maria Garcia",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    points: 750,
  },
  {
    id: "cont-5",
    rank: 5,
    name: "James Wilson",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80",
    points: 640,
  },
  {
    id: "cont-6",
    rank: 6,
    name: "James Wilson",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80",
    points: 540,
  },
];
