import { useState, useMemo } from "react";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { SearchAndFilterToolbar } from "./components/SearchAndFilterToolbar";
import { TrendingTopicsWidget } from "./components/TrendingTopicsWidget";
import { DiscussionFeed } from "./components/DiscussionFeed";
import { CreateThreadModal } from "./components/CreateThreadModal";
import { DiscussionDetailModal } from "./components/DiscussionDetailModal";
import { useStudentProfile } from "../student/api/useStudentLearning";
import { useCreateStudentCommunityComment, useCreateStudentCommunityPost, useSetStudentCommunityReaction, useStudentCommunityComments, useStudentCommunityPosts } from "../student/api/useStudentCommunity";
import { mapCommunityPost } from "../student/api/studentCommunityMapper";
import type { StudentCommunityCategoryKey } from "../student/api/studentCommunityApi";
import type { TopicCategory, DiscussionPost } from "./types/community";

export function Community() {
  const { toastMessage, showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>("all");
  const [selectedDropdownTopic, setSelectedDropdownTopic] = useState("All topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const profile = useStudentProfile();
  const postsQuery = useStudentCommunityPosts();
  const commentsQuery = useStudentCommunityComments(selectedPostId);
  const createPostMutation = useCreateStudentCommunityPost();
  const createCommentMutation = useCreateStudentCommunityComment(selectedPostId ?? "");
  const reactionMutation = useSetStudentCommunityReaction();
  const posts = postsQuery.data ?? [];
  const discussions = posts.map((post) => mapCommunityPost(post));

  // The active discussion is rehydrated from the persisted feed and comments query.
  const activeDiscussion = useMemo(() => {
    if (!selectedPostId) return null;
    const post = posts.find((discussion) => discussion.id === selectedPostId);
    return post ? mapCommunityPost(post, commentsQuery.data) : null;
  }, [posts, selectedPostId, commentsQuery.data]);

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
        const topicKeys: Record<string, string> = { "React & Next.js": "react", "UI/UX Design Systems": "design", "Data Science & AI": "datascience", "Backend & APIs": "backend" };
        if (topicKeys[selectedDropdownTopic] && item.category.key.toLowerCase() !== topicKeys[selectedDropdownTopic]) return false;
      }

      // 3. Category Filter
      if (selectedCategory === "all") return true;
      if (selectedCategory === "discussions") return true;
      if (selectedCategory === "groups") return false;
      if (selectedCategory === "qa") {
        return item.title.includes("?");
      }
      if (selectedCategory === "resources" || selectedCategory === "events") return false;

      return true;
    });
  }, [discussions, searchQuery, selectedDropdownTopic, selectedCategory]);

  // Actions
  const handleCreatePost = async (post: { title: string; body: string; categoryKey: string }) => {
    setCreateError(null);
    try {
      await createPostMutation.mutateAsync({ id: crypto.randomUUID(), title: post.title, body: post.body, categoryKey: post.categoryKey as StudentCommunityCategoryKey });
      showToast("Your discussion thread has been published.");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Discussion could not be published.");
      throw error;
    }
  };

  const handleTopicClick = (topic: { id: string }) => {
    setSelectedDropdownTopic(({ react: "React & Next.js", design: "UI/UX Design Systems", datascience: "Data Science & AI", backend: "Backend & APIs" } as Record<string, string>)[topic.id] ?? "All topics");
  };

  const handlePostClick = (post: DiscussionPost) => {
    setSelectedPostId(post.id);
  };

  const handleLikePost = (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (post) reactionMutation.mutate({ postId, active: !post.reacted });
  };

  const handleAddReply = async (_postId: string, body: string) => {
    try {
      await createCommentMutation.mutateAsync({ id: crypto.randomUUID(), body });
      showToast("Reply saved.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Reply could not be saved.");
    }
  };

  const topicCounts = posts.reduce<Record<string, number>>((counts, post) => {
    counts[post.categoryKey] = (counts[post.categoryKey] ?? 0) + 1;
    return counts;
  }, {});
  const topicLabels: Record<string, string> = { general: "General", react: "React & Next.js", design: "UI/UX Design", datascience: "Data Science & AI", backend: "Backend & APIs" };
  const topics = Object.entries(topicCounts).map(([id, count]) => ({ id, title: topicLabels[id] ?? id, repliesCount: count, topicIcon: "atom" as const, category: topicLabels[id] ?? id }));
  const commentCount = posts.reduce((sum, post) => sum + post.commentCount, 0);
  const reactionCount = posts.reduce((sum, post) => sum + post.reactionCount, 0);

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
          {/* Left Column (scope, persisted topics, and discussions) */}
          <main className="community-main-feed flex-1 min-w-0 flex flex-col justify-between gap-3 h-full min-h-0 lg:overflow-y-auto xl:overflow-hidden">
            {/* Row 1: Current academic community + persisted topic counts */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5 w-full flex-none xl:flex-1 min-h-0 items-stretch">
              <div className="xl:col-span-7 flex flex-col min-h-0 h-auto xl:h-full">
                <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between h-full">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Your community</p>
                    <h3 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">
                      {profile.data ? `${profile.data.institution.name} · ${profile.data.brand.name}` : "Academic community"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      Discussions are limited to Students in your Brand and Institution. Posts, replies, and reactions are saved to your account.
                    </p>
                  </div>
                  {profile.isError && <p role="alert" className="mt-3 text-xs text-rose-700">Your community scope could not be loaded.</p>}
                </section>
              </div>

              <div className="xl:col-span-5 flex flex-col min-h-0 h-auto xl:h-full">
                <TrendingTopicsWidget
                  topics={topics}
                  onTopicClick={handleTopicClick}
                  onViewAllClick={() => setSelectedDropdownTopic("All topics")}
                />
              </div>
            </div>

            {/* Row 2: Recent discussions + persisted activity totals */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5 w-full flex-none xl:flex-1 min-h-0 items-stretch">
              <div className="xl:col-span-8 flex flex-col min-h-0 h-90 xl:h-full">
                <DiscussionFeed
                  discussions={filteredDiscussions}
                  onPostClick={handlePostClick}
                  onLikePost={handleLikePost}
                  isLoading={postsQuery.isPending}
                  errorMessage={postsQuery.isError ? "Community discussions could not be loaded." : null}
                />
              </div>

              <div className="xl:col-span-4 flex flex-col min-h-0 h-auto xl:h-full">
                <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs h-full flex flex-col justify-between">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-900 tracking-tight">Community activity</h4>
                    <p className="mt-1 text-xs text-slate-500">Counts from the persisted discussion feed.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-4">
                    <div className="rounded-xl bg-slate-50 p-3 text-center"><strong className="block text-lg text-slate-900">{posts.length}</strong><span className="text-[10px] text-slate-500">discussions</span></div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center"><strong className="block text-lg text-slate-900">{commentCount}</strong><span className="text-[10px] text-slate-500">replies</span></div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center"><strong className="block text-lg text-slate-900">{reactionCount}</strong><span className="text-[10px] text-slate-500">likes</span></div>
                  </div>
                  <button type="button" onClick={() => setIsCreateModalOpen(true)} className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">Start a discussion</button>
                </section>
              </div>
            </div>
          </main>

          {/* Right Sidebar Column - exact persisted active-scope state only */}
          <div className="community-sidebar-panel">
            <section className="h-full rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col">
              <h4 className="text-[13.5px] font-bold text-slate-900">Discussion feed</h4>
              <p className="mt-1 text-xs text-slate-500">Brand and Institution scoped</p>
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current scope</span>
                <span className="mt-1 block text-sm font-bold text-slate-800">{profile.data ? `${profile.data.brand.name} · ${profile.data.institution.name}` : profile.isPending ? "Loading scope…" : "Scope unavailable"}</span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <p>{postsQuery.isPending ? "Loading saved discussions…" : postsQuery.isError ? "Feed unavailable. Retry by refreshing this page." : `${posts.length} saved discussion${posts.length === 1 ? "" : "s"}`}</p>
                <p>{commentCount} persisted repl{commentCount === 1 ? "y" : "ies"}</p>
                <p>{reactionCount} persisted like{reactionCount === 1 ? "" : "s"}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 text-[11px] text-slate-400">Posts are not live-synchronized; refresh to check for new activity.</div>
            </section>
          </div>
        </div>
      </div>

      {/* Modal for creating a new discussion or group */}
      <CreateThreadModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateError(null); }}
        onSubmit={handleCreatePost}
        isSubmitting={createPostMutation.isPending}
        errorMessage={createError}
      />

      {/* Modal for a persisted discussion and its comments */}
      <DiscussionDetailModal
        post={activeDiscussion}
        isOpen={!!activeDiscussion}
        onClose={() => setSelectedPostId(null)}
        onLike={handleLikePost}
        onAddReply={handleAddReply}
        isLoadingReplies={commentsQuery.isPending}
      />
    </div>
  );
}

export default Community;
