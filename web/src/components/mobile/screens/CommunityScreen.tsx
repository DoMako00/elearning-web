// TODO: wire live socket sync, see useCommunitySocket.ts
import React, { useState, useMemo } from "react";
import {
  Users,
  MessageSquare,
  Plus,
  ChevronRight,
  Eye,
  Check,
  GraduationCap,
  Atom,
  Layout,
  BarChart3,
  Cpu,
  Send,
} from "lucide-react";
import { TopAppBar } from "../TopAppBar";
import { useScreenStack } from "../ScreenStack";
import { HeroBand } from "../shared/HeroBand";
import { MobileSearchBar } from "../shared/MobileSearchBar";
import { CategoryChipsRow } from "../shared/CategoryChipsRow";
import { SectionHeader } from "../shared/SectionHeader";
import { TrendingRow } from "../shared/TrendingRow";
import { MobileToast } from "../shared/MobileToast";
import { ChatConversationScreen } from "./ChatConversationScreen";
import {
  INITIAL_FEATURED_GROUP,
  INITIAL_TRENDING_TOPICS,
  INITIAL_DISCUSSIONS,
  INITIAL_MENTOR,
} from "../../../features/community/data/communityMockData";
import type {
  DiscussionPost,
  FeaturedStudyGroup,
  MentorSpotlight,
} from "../../../features/community/types/community";

// Category chips config
const COMMUNITY_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "groups", label: "Study Groups" },
  { key: "discussions", label: "Discussions" },
  { key: "qa", label: "Q&A" },
  { key: "resources", label: "Resources" },
  { key: "events", label: "Events" },
];

export const CommunityScreen: React.FC = () => {
  const { push } = useScreenStack();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [featuredGroup, setFeaturedGroup] = useState<FeaturedStudyGroup>(INITIAL_FEATURED_GROUP);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(INITIAL_DISCUSSIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filtered discussions by search query or category
  const filteredDiscussions = useMemo(() => {
    return discussions.filter((disc) => {
      const matchSearch =
        !searchQuery.trim() ||
        disc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disc.author.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        activeCategory === "all" ||
        (activeCategory === "qa" && disc.title.includes("?")) ||
        (activeCategory === "discussions" && !disc.title.includes("?")) ||
        activeCategory === "groups";

      return matchSearch && matchCategory;
    });
  }, [discussions, searchQuery, activeCategory]);

  // Navigate to Create Thread
  const handleOpenCreateThread = () => {
    push({
      id: "community-thread-new",
      title: "New Discussion",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Community",
      component: (
        <CreateThreadSubScreen
          onCreated={(newDisc) => {
            setDiscussions((prev) => [newDisc, ...prev]);
            showToast("Discussion posted");
            // Push directly to discussion detail
            push({
              id: `community-disc-${newDisc.id}`,
              title: "Discussion",
              tabRoot: "settings",
              variant: "detail",
              backLabel: "Community",
              component: (
                <DiscussionDetailSubScreen
                  post={newDisc}
                  onAddReply={(replyText) => {
                    setDiscussions((prev) =>
                      prev.map((d) =>
                        d.id === newDisc.id
                          ? {
                              ...d,
                              repliesCount: d.repliesCount + 1,
                              replies: [
                                ...(d.replies || []),
                                {
                                  id: `rep-${Date.now()}`,
                                  author: {
                                    id: "u_juliana",
                                    name: "Juliana Ahmed",
                                    avatarUrl: "https://i.pravatar.cc/160?img=47",
                                    role: "Student",
                                  },
                                  content: replyText,
                                  timestamp: Date.now(),
                                  timeAgo: "Just now",
                                  upvotesCount: 0,
                                },
                              ],
                            }
                          : d
                      )
                    );
                    showToast("Reply posted");
                  }}
                />
              ),
            });
          }}
        />
      ),
    });
  };

  // Navigate to Discussion Detail
  const handleOpenDiscussionDetail = (post: DiscussionPost) => {
    push({
      id: `community-disc-${post.id}`,
      title: "Discussion",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Community",
      component: (
        <DiscussionDetailSubScreen
          post={post}
          onAddReply={(replyText) => {
            setDiscussions((prev) =>
              prev.map((d) =>
                d.id === post.id
                  ? {
                      ...d,
                      repliesCount: d.repliesCount + 1,
                      replies: [
                        ...(d.replies || []),
                        {
                          id: `rep-${Date.now()}`,
                          author: {
                            id: "u_juliana",
                            name: "Juliana Ahmed",
                            avatarUrl: "https://i.pravatar.cc/160?img=47",
                            role: "Student",
                          },
                          content: replyText,
                          timestamp: Date.now(),
                          timeAgo: "Just now",
                          upvotesCount: 0,
                        },
                      ],
                    }
                  : d
              )
            );
            showToast("Reply posted");
          }}
        />
      ),
    });
  };

  // Navigate to Study Group Detail
  const handleOpenGroupDetail = (group: FeaturedStudyGroup) => {
    push({
      id: `community-group-${group.id}`,
      title: group.title,
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Community",
      component: (
        <StudyGroupDetailSubScreen
          group={group}
          onToggleJoin={() => {
            const next = !group.isJoined;
            setFeaturedGroup((prev) => ({ ...prev, isJoined: next }));
            showToast(next ? `Joined ${group.title}` : `Left ${group.title}`);
          }}
        />
      ),
    });
  };

  // Navigate to Mentor Profile
  const handleOpenMentorProfile = (mentor: MentorSpotlight) => {
    push({
      id: `community-mentor-${mentor.id}`,
      title: mentor.name,
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Community",
      component: (
        <MentorProfileSubScreen
          mentor={mentor}
          onMessageMentor={() => {
            // Push to chat with this mentor (reusing ChatConversationScreen)
            push({
              id: "chat-mentor-alex",
              title: mentor.name,
              tabRoot: "settings",
              variant: "detail",
              backLabel: mentor.name,
              component: (
                <ChatConversationScreen
                  conversationId="mentor-alex"
                  initialName={mentor.name}
                  initialRole={mentor.role}
                  initialAvatar={mentor.avatarUrl}
                  initialInitials="AM"
                  backLabel={mentor.name}
                />
              ),
            });
          }}
        />
      ),
    });
  };

  // Toggle join on featured group
  const handleToggleJoinFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !featuredGroup.isJoined;
    setFeaturedGroup((prev) => ({ ...prev, isJoined: next }));
    showToast(next ? `Joined ${featuredGroup.title}` : `Left ${featuredGroup.title}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <MobileToast message={toastMessage} />

      {/* 1. TopAppBar variant="main" */}
      <TopAppBar variant="main" />

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. HeroBand */}
        <HeroBand
          eyebrow="Student Network"
          heading="Community"
          subtitle="Learn together. Share ideas. Grow further."
          illustration={
            <div className="relative w-32 h-24 sm:w-36 sm:h-28 flex items-center justify-end">
              <div className="w-16 h-16 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center shadow-xs">
                <Users className="w-8 h-8" />
              </div>
            </div>
          }
        />

        <div className="px-4 pb-20 space-y-5 max-w-lg mx-auto">
          {/* 3. MobileSearchBar */}
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search discussions, topics, or members..."
          />

          {/* 4. CategoryChipsRow + Create Thread action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
              <CategoryChipsRow
                categories={COMMUNITY_CATEGORIES}
                activeKey={activeCategory}
                onChange={setActiveCategory}
              />
            </div>
            <button
              type="button"
              onClick={handleOpenCreateThread}
              aria-label="Create new thread"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>

          {/* 5. Featured Group Card */}
          <div
            onClick={() => handleOpenGroupDetail(featuredGroup)}
            className="p-4 bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl text-white shadow-sm border border-emerald-700/60 space-y-3 cursor-pointer select-none hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[9.5px] font-extrabold uppercase tracking-wide">
                  Featured
                </span>
                <span className="text-[11px] text-emerald-200/80 font-medium">
                  {featuredGroup.memberCount} members
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {featuredGroup.title}
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1 line-clamp-2 leading-relaxed">
                {featuredGroup.description}
              </p>
            </div>

            {/* Feature tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-emerald-200">
              <span className="px-2 py-0.5 rounded-md bg-white/10">
                {featuredGroup.tags.tech}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10">
                {featuredGroup.tags.type}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10">
                {featuredGroup.tags.schedule}
              </span>
            </div>

            {/* Avatars + Join Button */}
            <div className="pt-2 border-t border-emerald-700/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {featuredGroup.avatars.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="Active member"
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-emerald-900 object-cover"
                    />
                  ))}
                </div>
                <span className="text-[10.5px] text-emerald-200/80 font-medium">
                  {featuredGroup.activeCountText}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleJoinFeatured}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  featuredGroup.isJoined
                    ? "bg-emerald-600/60 text-emerald-100 border border-emerald-500/60"
                    : "bg-white text-emerald-900 hover:bg-emerald-50 shadow-xs"
                }`}
              >
                {featuredGroup.isJoined ? "Joined ✓" : "Join group"}
              </button>
            </div>
          </div>

          {/* 6. Trending Topics */}
          <div className="space-y-2.5">
            <SectionHeader title="Trending topics" />
            <div className="space-y-2">
              {INITIAL_TRENDING_TOPICS.slice(0, 4).map((topic, idx) => {
                const topicIcons = [Atom, Layout, BarChart3, Cpu];
                const TopicIconComp = topicIcons[idx % topicIcons.length];

                return (
                  <TrendingRow
                    key={topic.id}
                    icon={<TopicIconComp className="w-4.5 h-4.5" />}
                    iconBgColor="bg-emerald-50"
                    iconColor="text-emerald-600"
                    title={topic.title}
                    subtitle={`Category: ${topic.category}`}
                    trailingSlot={
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{topic.repliesCount}</span>
                      </div>
                    }
                    onClick={() => {
                      setSearchQuery(topic.title);
                      showToast(`Filtered by ${topic.title}`);
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* 7. Recent Discussions */}
          <div className="space-y-2.5">
            <SectionHeader
              title="Recent discussions"
              actionLabel="Create"
              onAction={handleOpenCreateThread}
            />
            <div className="space-y-2.5">
              {filteredDiscussions.map((disc) => {
                // Colored badge matching prompt rules:
                // React=green, Design=purple, Data Science=blue, Backend=green
                const badgeColorClass =
                  disc.category.label === "Design"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : disc.category.label === "Data Science"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";

                return (
                  <div
                    key={disc.id}
                    onClick={() => handleOpenDiscussionDetail(disc)}
                    className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-emerald-200 transition-all cursor-pointer select-none space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={disc.author.avatarUrl}
                          alt={disc.author.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                            {disc.author.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {disc.timeAgo}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${badgeColorClass}`}
                      >
                        {disc.category.label}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {disc.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{disc.repliesCount} replies</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{disc.viewsCount} views</span>
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. Mentor Spotlight Card */}
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={INITIAL_MENTOR.avatarUrl}
                  alt={INITIAL_MENTOR.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/80 shadow-2xs"
                />
                {INITIAL_MENTOR.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-1 ring-white">
                    <Check className="w-2.5 h-2.5 stroke-3" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Mentor Spotlight
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {INITIAL_MENTOR.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {INITIAL_MENTOR.role}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {INITIAL_MENTOR.bioSummary}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenMentorProfile(INITIAL_MENTOR)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors shrink-0 cursor-pointer"
            >
              View profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-SCREENS FOR COMMUNITY
// ==========================================

// Sub-screen 1: Create Thread
export const CreateThreadSubScreen: React.FC<{
  onCreated: (disc: DiscussionPost) => void;
}> = ({ onCreated }) => {
  const { pop } = useScreenStack();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryKey, setCategoryKey] = useState("react");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const catLabels: Record<string, string> = {
      react: "React",
      design: "Design",
      datascience: "Data Science",
      backend: "Backend",
    };

    const newPost: DiscussionPost = {
      id: `disc-${Date.now()}`,
      title: title.trim(),
      content: body.trim(),
      author: {
        id: "u_juliana",
        name: "Juliana Ahmed",
        avatarUrl: "https://i.pravatar.cc/160?img=47",
        role: "Student",
      },
      category: {
        key: categoryKey,
        label: catLabels[categoryKey] || "General",
        badgeColor: "emerald",
      },
      topicIcon: "atom",
      timeAgo: "Just now",
      timestamp: Date.now(),
      repliesCount: 0,
      viewsCount: 1,
      upvotesCount: 0,
      replies: [],
    };

    onCreated(newPost);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Create Thread"
        backLabel="Community"
        onBack={pop}
      />

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20"
      >
        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3.5 shadow-2xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500"
            >
              <option value="react">React</option>
              <option value="design">Design</option>
              <option value="datascience">Data Science</option>
              <option value="backend">Backend</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="What would you like to discuss or ask?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Content
            </label>
            <textarea
              required
              rows={5}
              placeholder="Share context, code ideas, or questions for peers..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-500 leading-relaxed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !body.trim()}
          className={`w-full py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer ${
            !title.trim() || !body.trim()
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          Post Discussion
        </button>
      </form>
    </div>
  );
};

// Sub-screen 2: Discussion Detail + Reply composer
export const DiscussionDetailSubScreen: React.FC<{
  post: DiscussionPost;
  onAddReply: (text: string) => void;
}> = ({ post, onAddReply }) => {
  const { pop } = useScreenStack();
  const [replyText, setReplyText] = useState("");

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(replyText.trim());
    setReplyText("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title="Discussion"
        backLabel="Community"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-24">
        {/* Main Post Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {post.author.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {post.author.role} · {post.timeAgo}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              {post.category.label}
            </span>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {post.title}
          </h2>

          <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-2.5">
            {post.content}
          </p>
        </div>

        {/* Replies Section */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Replies ({post.replies?.length || 0})
          </h3>

          <div className="space-y-2">
            {post.replies && post.replies.length > 0 ? (
              post.replies.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={rep.author.avatarUrl}
                      alt={rep.author.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      {rep.author.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rep.timeAgo || "Recently"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-8">
                    {rep.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center text-xs text-slate-400">
                No replies yet. Be the first to join the conversation!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply composer bar */}
      <form
        onSubmit={handleSendReply}
        className="shrink-0 p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shadow-md max-w-lg mx-auto w-full"
      >
        <input
          type="text"
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="flex-1 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!replyText.trim()}
          aria-label="Post reply"
          className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
            replyText.trim()
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// Sub-screen 3: Study Group Detail
export const StudyGroupDetailSubScreen: React.FC<{
  group: FeaturedStudyGroup;
  onToggleJoin: () => void;
}> = ({ group, onToggleJoin }) => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title={group.title}
        backLabel="Community"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Study Group
            </span>
            <span className="text-xs text-slate-400">{group.memberCount} members</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {group.title}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            {group.description}
          </p>

          <button
            type="button"
            onClick={onToggleJoin}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              group.isJoined
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
            }`}
          >
            {group.isJoined ? "Leave Study Group" : "Join Study Group"}
          </button>
        </div>

        {/* Group Member Stack */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Members ({group.memberCount})
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              {group.avatars.map((av, i) => (
                <img
                  key={i}
                  src={av}
                  alt="Member"
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {group.activeCountText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-screen 4: Mentor Profile
export const MentorProfileSubScreen: React.FC<{
  mentor: MentorSpotlight;
  onMessageMentor: () => void;
}> = ({ mentor, onMessageMentor }) => {
  const { pop } = useScreenStack();

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar
        variant="detail"
        title={mentor.name}
        backLabel="Community"
        onBack={pop}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-2xs text-center">
          <div className="relative w-20 h-20 mx-auto">
            <img
              src={mentor.avatarUrl}
              alt={mentor.name}
              className="w-full h-full rounded-full object-cover border-2 border-emerald-500 shadow-xs"
            />
            {mentor.isVerified && (
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white">
                <Check className="w-3 h-3 stroke-3" />
              </span>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {mentor.name}
            </h2>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">
              {mentor.role}
            </p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              {mentor.bioSummary}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 font-medium">
            🏅 {mentor.experienceBadge}
          </div>

          <button
            type="button"
            onClick={onMessageMentor}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message {mentor.name.split(" ")[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
