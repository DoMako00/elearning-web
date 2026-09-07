import { useState, useMemo } from "react";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { SearchAndFilterToolbar } from "./components/SearchAndFilterToolbar";
import { FeaturedGroupCard } from "./components/FeaturedGroupCard";
import { TrendingTopicsWidget } from "./components/TrendingTopicsWidget";
import { DiscussionFeed } from "./components/DiscussionFeed";
import { MentorSpotlightCard } from "./components/MentorSpotlightCard";
import { CommunitySidebar } from "./components/CommunitySidebar";
import { CreateThreadModal } from "./components/CreateThreadModal";
import { DiscussionDetailModal } from "./components/DiscussionDetailModal";
import { AllMembersModal } from "./components/AllMembersModal";
import { useCommunitySocket } from "./hooks/useCommunitySocket";
import {
  INITIAL_FEATURED_GROUP,
  INITIAL_TRENDING_TOPICS,
  INITIAL_MENTOR,
  INITIAL_COMMUNITY_EVENTS,
  INITIAL_TOP_CONTRIBUTORS,
} from "./data/communityMockData";
import type {
  TopicCategory,
  TrendingTopic,
  DiscussionPost,
} from "./types/community";

export function Community() {
  const { toastMessage, showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>("all");
  const [selectedDropdownTopic, setSelectedDropdownTopic] = useState("All topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAllMembersModalOpen, setIsAllMembersModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Real-time WebSocket hook
  const {
    discussions,
    onlineMembers,
    onlineCount,
    isConnected,
    createPost,
    likePost,
    addReply,
  } = useCommunitySocket({
    roomName: "community_feed",
    autoConnect: true,
    enableSimulatedTraffic: true,
  });

  // Current active discussion thread (live synchronized with discussions list)
  const activeDiscussion = useMemo(() => {
    if (!selectedPostId) return null;
    return discussions.find((d) => d.id === selectedPostId) || null;
  }, [discussions, selectedPostId]);

  // Filtered discussions by category and search query
  const filteredDiscussions = useMemo(() => {
    return discussions.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchAuthor = item.author.name.toLowerCase().includes(q);
        const matchCategory = item.category.label.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchCategory) return false;
      }

      // 2. Dropdown Filter
      if (selectedDropdownTopic !== "All topics") {
        if (selectedDropdownTopic === "React & Next.js") {
          if (!["react", "nextjs"].includes(item.category.key.toLowerCase()))
            return false;
        } else if (selectedDropdownTopic === "UI/UX Design Systems") {
          if (item.category.key.toLowerCase() !== "design") return false;
        } else if (selectedDropdownTopic === "Data Science & AI") {
          if (item.category.key.toLowerCase() !== "datascience") return false;
        } else if (selectedDropdownTopic === "Backend & APIs") {
          if (item.category.key.toLowerCase() !== "backend") return false;
        }
      }

      // 3. Category Filter
      if (selectedCategory === "all") return true;
      if (selectedCategory === "discussions") return true;
      if (selectedCategory === "groups") {
        return item.category.key.toLowerCase().includes("react");
      }
      if (selectedCategory === "qa") {
        return item.title.includes("?");
      }
      if (selectedCategory === "resources") {
        return item.topicIcon === "cubes" || item.topicIcon === "code";
      }
      if (selectedCategory === "events") {
        return false; // Events are rendered in sidebar
      }

      return true;
    });
  }, [discussions, searchQuery, selectedDropdownTopic, selectedCategory]);

  // Actions
  const handleCreatePost = (post: {
    title: string;
    categoryKey: string;
    categoryLabel: string;
    topicIcon: DiscussionPost["topicIcon"];
  }) => {
    createPost({
      title: post.title,
      author: {
        id: "u-current",
        name: "Juliana Silva",
        avatarUrl: "https://i.pravatar.cc/112?img=47",
        role: "Student",
      },
      category: {
        key: post.categoryKey,
        label: post.categoryLabel,
        badgeColor: "emerald",
      },
      topicIcon: post.topicIcon,
    });
    showToast("Your discussion thread has been published!");
  };

  const handleTopicClick = (topic: TrendingTopic) => {
    setSearchQuery(topic.title);
    showToast(`Filtering discussions for: "${topic.title}"`);
  };

  const handleJoinGroup = (joined: boolean) => {
    showToast(
      joined
        ? "You joined React Developers Hub!"
        : "You left the study group"
    );
  };

  const handlePostClick = (post: DiscussionPost) => {
    setSelectedPostId(post.id);
  };

  const handleEventAction = (_eventId: string, action: "join" | "remind") => {
    showToast(
      action === "join"
        ? "You are registered for this event!"
        : "Reminder set! We will notify you before it begins."
    );
  };

  return (
    <div className="community-layout-root w-full h-full min-h-0 flex flex-col bg-[#f8faf9] overflow-y-auto lg:overflow-hidden">
      <ToastNotification message={toastMessage} />

      {/* Main Container - Scaled to fit exactly in viewport */}
      <div className="w-full max-w-430 h-full mx-auto px-3.5 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex flex-col justify-between gap-3 min-h-0">
        {/* Search & Category Filter Toolbar */}
        <SearchAndFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          selectedDropdownTopic={selectedDropdownTopic}
          onDropdownTopicSelect={setSelectedDropdownTopic}
          onCreateThreadClick={() => setIsCreateModalOpen(true)}
        />

        {/* 2-Column Master Layout: Left Main Feed + Right Sidebar */}
        <div className="community-columns-row flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-3.5 w-full pb-6 lg:pb-0">
          {/* Left Column (Feed, Featured Group, Trending Topics, Mentor Spotlight) */}
          <main className="community-main-feed flex-1 min-w-0 flex flex-col justify-between gap-3 h-full min-h-0 lg:overflow-y-auto xl:overflow-hidden">
            {/* Row 1: Featured Study Group (7 cols) + Trending Topics (5 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5 w-full flex-none xl:flex-1 min-h-0 items-stretch">
              <div className="xl:col-span-7 flex flex-col min-h-0 h-auto xl:h-full">
                <FeaturedGroupCard
                  group={INITIAL_FEATURED_GROUP}
                  onJoinToggle={handleJoinGroup}
                />
              </div>

              <div className="xl:col-span-5 flex flex-col min-h-0 h-auto xl:h-full">
                <TrendingTopicsWidget
                  topics={INITIAL_TRENDING_TOPICS}
                  onTopicClick={handleTopicClick}
                  onViewAllClick={() => setSelectedDropdownTopic("All topics")}
                />
              </div>
            </div>

            {/* Row 2: Recent Discussions Feed (8 cols) + Mentor Spotlight (4 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5 w-full flex-none xl:flex-1 min-h-0 items-stretch">
              <div className="xl:col-span-8 flex flex-col min-h-0 h-90 xl:h-full">
                <DiscussionFeed
                  discussions={filteredDiscussions}
                  onPostClick={handlePostClick}
                  onLikePost={likePost}
                />
              </div>

              <div className="xl:col-span-4 flex flex-col min-h-0 h-auto xl:h-full">
                <MentorSpotlightCard
                  mentor={INITIAL_MENTOR}
                  onViewProfile={() =>
                    showToast("Opening Alex Morgan's mentor profile...")
                  }
                />
              </div>
            </div>
          </main>

          {/* Right Sidebar Column (Members Online, Upcoming Events, Top Contributors) - stays fixed, never scrolls */}
          <div className="community-sidebar-panel">
            <CommunitySidebar
              onlineMembers={onlineMembers}
              onlineCount={onlineCount}
              events={INITIAL_COMMUNITY_EVENTS}
              contributors={INITIAL_TOP_CONTRIBUTORS}
              onViewAllMembers={() => setIsAllMembersModalOpen(true)}
              onViewAllEvents={() => showToast("Loading full community events calendar")}
              onViewLeaderboard={() => showToast("Viewing full contributor leaderboard")}
              onEventAction={handleEventAction}
            />
          </div>
        </div>
      </div>

      {/* Modal for creating a new discussion or group */}
      <CreateThreadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      {/* Modal for scrolling through all community members */}
      <AllMembersModal
        isOpen={isAllMembersModalOpen}
        onClose={() => setIsAllMembersModalOpen(false)}
      />

      {/* Modal for viewing and interacting with a discussion thread in real-time */}
      <DiscussionDetailModal
        post={activeDiscussion}
        isOpen={!!activeDiscussion}
        onClose={() => setSelectedPostId(null)}
        onLike={likePost}
        onAddReply={addReply}
        isConnected={isConnected}
      />
    </div>
  );
}

export default Community;
