import { useState, useEffect, useCallback, useRef } from "react";
import type {
  DiscussionPost,
  CommunityMember,
  CommunitySocketEvent,
  // ALLCommunityMember,
} from "../types/community";
import {
  INITIAL_DISCUSSIONS,
  INITIAL_ONLINE_MEMBERS,
  // ALL_COMMUNITY_MEMBERSs
} from "../data/communityMockData";

interface UseCommunitySocketOptions {
  roomName?: string;
  autoConnect?: boolean;
  enableSimulatedTraffic?: boolean;
}

interface UseCommunitySocketReturn {
  discussions: DiscussionPost[];
  onlineMembers: CommunityMember[];
  onlineCount: number;
  isConnected: boolean;
  createPost: (post: Omit<DiscussionPost, "id" | "timestamp" | "timeAgo" | "repliesCount" | "viewsCount" | "upvotesCount">) => void;
  likePost: (postId: string) => void;
  addReply: (postId: string, content: string) => void;
  incrementReplyCount: (postId: string) => void;
  broadcastMemberStatus: (memberId: string, isOnline: boolean) => void;
}

const NEW_POST_TEMPLATES: Array<
  Omit<
    DiscussionPost,
    | "id"
    | "timestamp"
    | "timeAgo"
    | "repliesCount"
    | "viewsCount"
    | "upvotesCount"
  >
> = [
  {
    title: "How are you handling server components caching in Next.js 15?",
    author: {
      id: "u-marcus",
      name: "Marcus Vance",
      avatarUrl:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Solutions Architect",
    },
    category: {
      key: "react",
      label: "React",
      badgeColor: "emerald",
    },
    topicIcon: "atom",
  },
  {
    title: "Tailwind CSS v4 container queries best practices for bento layouts",
    author: {
      id: "u-elena",
      name: "Elena Rostova",
      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Staff UI Engineer",
    },
    category: {
      key: "design",
      label: "Design",
      badgeColor: "purple",
    },
    topicIcon: "palette",
  },
  {
    title: "Clean architecture patterns for React Query and WebSockets",
    author: {
      id: "u-devon",
      name: "Devon Miles",
      avatarUrl:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80",
      role: "Senior Backend Developer",
    },
    category: {
      key: "backend",
      label: "Backend",
      badgeColor: "emerald",
    },
    topicIcon: "cubes",
  },
];

export function useCommunitySocket({
  roomName = "community_feed",
  autoConnect = true,
  enableSimulatedTraffic = true,
}: UseCommunitySocketOptions = {}): UseCommunitySocketReturn {
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(INITIAL_DISCUSSIONS);
  const [onlineMembers, setOnlineMembers] = useState<CommunityMember[]>(INITIAL_ONLINE_MEMBERS);
  const [onlineCount, setOnlineCount] = useState<number>(128);

  // const [allMembers, setAllMembers] = useState<ALLCommunityMember[]>(ALL_COMMUNITY_MEMBERSs);
  // const [allCount, setAllCount] = useState<number>(128);
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  
  // const [discussions, setDiscussions] = useState<DiscussionPost[]>(INITIAL_DISCUSSIONS);
  // const [onlineMembers, setOnlineMembers] = useState<CommunityMember[]>(INITIAL_ONLINE_MEMBERS);
  // const [onlineCount, setOnlineCount] = useState<number>(128);
  // const [isConnected, setIsConnected] = useState<boolean>(false);
  // const wsRef = useRef<WebSocket | null>(null);

  // Dispatch an incoming socket event to React state
  const handleSocketEvent = useCallback((event: CommunitySocketEvent) => {
    switch (event.type) {
      case "NEW_DISCUSSION_POST": {
        setDiscussions((prev) => {
          // Avoid duplicate prepend
          if (prev.some((p) => p.id === event.payload.post.id)) return prev;
          return [{ ...event.payload.post, isOptimistic: true }, ...prev];
        });
        break;
      }
      case "MEMBER_STATUS_CHANGED": {
        setOnlineCount(event.payload.onlineCount);
        if (event.payload.updatedMember) {
          const updated = event.payload.updatedMember;
          setOnlineMembers((prev) => {
            const exists = prev.some((m) => m.id === updated.id);
            if (exists) {
              return prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m));
            }
            return [updated, ...prev.slice(0, 4)];
          });
        }
        break;
      }
      case "NEW_REPLY": {
        setDiscussions((prev) =>
          prev.map((post) => {
            if (post.id !== event.payload.postId) return post;
            const updatedReplies = [...(post.replies || []), event.payload.reply];
            return {
              ...post,
              replies: updatedReplies,
              repliesCount: event.payload.repliesCount,
            };
          })
        );
        break;
      }
      case "METRICS_UPDATED": {
        setDiscussions((prev) =>
          prev.map((post) => {
            if (post.id !== event.payload.postId) return post;
            return {
              ...post,
              ...(event.payload.repliesCount !== undefined && {
                repliesCount: event.payload.repliesCount,
              }),
              ...(event.payload.viewsCount !== undefined && {
                viewsCount: event.payload.viewsCount,
              }),
              ...(event.payload.upvotesCount !== undefined && {
                upvotesCount: event.payload.upvotesCount,
              }),
            };
          })
        );
        break;
      }
    }
  }, []);

  // Connect to WebSocket server or provide resilient fallback simulator
  useEffect(() => {
    if (!autoConnect) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/community?room=${roomName}`;
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onmessage = (messageEvent) => {
          try {
            const data: CommunitySocketEvent = JSON.parse(messageEvent.data);
            handleSocketEvent(data);
          } catch {
            // Ignore non-json frames
          }
        };

        socket.onerror = () => {
          // Fallback gracefully without breaking UI
          setIsConnected(true);
        };

        socket.onclose = () => {
          setIsConnected(true); // Keep UI functional in mock mode
        };

        wsRef.current = socket;
      } catch {
        setIsConnected(true);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [autoConnect, roomName, handleSocketEvent]);

  // Periodic simulated live events (metrics increment, active presence shifts, new posts)
  useEffect(() => {
    if (!enableSimulatedTraffic) return;

    // 1. Periodic view count and upvote bumps
    const metricInterval = setInterval(() => {
      setDiscussions((prev) => {
        if (prev.length === 0) return prev;
        const randomIndex = Math.floor(Math.random() * Math.min(prev.length, 5));
        const target = prev[randomIndex];
        const nextViews = target.viewsCount + Math.floor(Math.random() * 3) + 1;
        const updated = [...prev];
        updated[randomIndex] = { ...target, viewsCount: nextViews };
        return updated;
      });
    }, 12000);

    // 2. Periodic online member fluctuation (128 +/- 3)
    const presenceInterval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next < 120 ? 124 : next > 140 ? 132 : next;
      });
    }, 8000);

    // 3. Occasional live new post simulation (every 45s)
    let templateIdx = 0;
    const postInterval = setInterval(() => {
      const template = NEW_POST_TEMPLATES[templateIdx % NEW_POST_TEMPLATES.length];
      templateIdx++;

      const newPost: DiscussionPost = {
        ...template,
        id: `live-${Date.now()}`,
        timeAgo: "Just now",
        timestamp: Date.now(),
        repliesCount: 0,
        viewsCount: 1,
        upvotesCount: 0,
        isOptimistic: true,
      };

      handleSocketEvent({
        type: "NEW_DISCUSSION_POST",
        payload: { post: newPost },
      });
    }, 45000);

    return () => {
      clearInterval(metricInterval);
      clearInterval(presenceInterval);
      clearInterval(postInterval);
    };
  }, [enableSimulatedTraffic, handleSocketEvent]);

  // Actions
  const createPost = useCallback(
    (
      postData: Omit<
        DiscussionPost,
        "id" | "timestamp" | "timeAgo" | "repliesCount" | "viewsCount" | "upvotesCount"
      >
    ) => {
      const newPost: DiscussionPost = {
        ...postData,
        id: `post-${Date.now()}`,
        timeAgo: "Just now",
        timestamp: Date.now(),
        repliesCount: 0,
        viewsCount: 1,
        upvotesCount: 0,
        isOptimistic: true,
      };

      // Send to WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: "CREATE_POST",
            room: roomName,
            payload: newPost,
          })
        );
      }

      // Optimistic update
      setDiscussions((prev) => [newPost, ...prev]);
    },
    [roomName]
  );

  const likePost = useCallback(
    (postId: string) => {
      setDiscussions((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, upvotesCount: (p.upvotesCount || 0) + 1 } : p
        )
      );

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: "LIKE_POST",
            room: roomName,
            payload: { postId },
          })
        );
      }
    },
    [roomName]
  );

  const addReply = useCallback(
    (postId: string, content: string) => {
      const newReply = {
        id: `rep-${Date.now()}`,
        author: {
          id: "u-current",
          name: "Juliana Silva",
          avatarUrl: "https://i.pravatar.cc/112?img=47",
          role: "Student",
        },
        content: content.trim(),
        timestamp: Date.now(),
        timeAgo: "Just now",
        upvotesCount: 0,
      };

      setDiscussions((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const updated = [...(p.replies || []), newReply];
          return {
            ...p,
            replies: updated,
            repliesCount: (p.repliesCount || 0) + 1,
          };
        })
      );

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: "NEW_REPLY",
            room: roomName,
            payload: {
              postId,
              reply: newReply,
            },
          })
        );
      }
    },
    [roomName]
  );

  const incrementReplyCount = useCallback(
    (postId: string) => {
      setDiscussions((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, repliesCount: p.repliesCount + 1 } : p
        )
      );
    },
    []
  );

  const broadcastMemberStatus = useCallback(
    (memberId: string, isOnline: boolean) => {
      setOnlineMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isOnline } : m))
      );
    },
    []
  );

  return {
    discussions,
    onlineMembers,
    onlineCount,
    isConnected,
    createPost,
    likePost,
    addReply,
    incrementReplyCount,
    broadcastMemberStatus,
  };
}
