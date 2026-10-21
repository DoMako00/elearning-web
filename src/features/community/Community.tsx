import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, MessagesSquare, Users } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { SearchAndFilterToolbar } from "./components/SearchAndFilterToolbar";
import { TrendingTopicsWidget } from "./components/TrendingTopicsWidget";
import { DiscussionFeed } from "./components/DiscussionFeed";
import { CreateThreadModal } from "./components/CreateThreadModal";
import { DiscussionDetailModal } from "./components/DiscussionDetailModal";
import { useStudentProfile } from "../student/api/useStudentLearning";
import { useCreateStudentCommunityComment, useCreateStudentCommunityPost, useSetStudentCommunityReaction, useStudentCommunityComments, useStudentCommunityPosts, useStudentCommunityRooms } from "../student/api/useStudentCommunity";
import { mapCommunityPost } from "../student/api/studentCommunityMapper";
import type { StudentCommunityRoomDto, StudentCommunityCategoryKey } from "../student/api/studentCommunityApi";
import type { TopicCategory, DiscussionPost } from "./types/community";

function roomDescription(room: StudentCommunityRoomDto) {
  return room.kind === "course"
    ? [room.code, room.semesterTitle].filter(Boolean).join(" · ") || "Your course discussion space"
    : "Your institution-wide discussion space";
}

export function Community() {
  const { toastMessage, toastTone, showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>("all");
  const [selectedDropdownTopic, setSelectedDropdownTopic] = useState("All topics");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const profile = useStudentProfile();
  const roomsQuery = useStudentCommunityRooms();
  const rooms = roomsQuery.data ?? [];
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)
    ?? rooms.find((room) => room.kind === "course")
    ?? rooms[0]
    ?? null;
  const courseRooms = rooms.filter((room) => room.kind === "course");
  const postsQuery = useStudentCommunityPosts(selectedRoom?.id ?? null);
  const posts = postsQuery.data ?? [];
  const discussions = posts.map((post) => mapCommunityPost(post));
  const commentsQuery = useStudentCommunityComments(selectedPostId);
  const createPostMutation = useCreateStudentCommunityPost();
  const createCommentMutation = useCreateStudentCommunityComment(selectedPostId ?? "");
  const reactionMutation = useSetStudentCommunityReaction();

  const activeDiscussion = useMemo(() => {
    if (!selectedPostId) return null;
    const post = posts.find((discussion) => discussion.id === selectedPostId);
    return post ? mapCommunityPost(post, commentsQuery.data) : null;
  }, [posts, selectedPostId, commentsQuery.data]);

  const filteredDiscussions = useMemo(() => discussions.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (query && !item.title.toLowerCase().includes(query)
      && !item.author.name.toLowerCase().includes(query)
      && !item.category.label.toLowerCase().includes(query)
      && !(item.content ?? "").toLowerCase().includes(query)) return false;

    if (selectedDropdownTopic !== "All topics") {
      const topicKeys: Record<string, string> = { "React & Next.js": "react", "UI/UX Design Systems": "design", "Data Science & AI": "datascience", "Backend & APIs": "backend" };
      if (topicKeys[selectedDropdownTopic] && item.category.key.toLowerCase() !== topicKeys[selectedDropdownTopic]) return false;
    }
    if (selectedCategory === "all" || selectedCategory === "discussions") return true;
    if (selectedCategory === "qa") return item.title.includes("?");
    return false;
  }), [discussions, searchQuery, selectedDropdownTopic, selectedCategory]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedPostId(null);
    setSelectedCategory("all");
    setSelectedDropdownTopic("All topics");
  };

  const handleCreatePost = async (post: { title: string; body: string; categoryKey: string }) => {
    setCreateError(null);
    if (!selectedRoom) {
      const message = "No discussion room is available for your account.";
      setCreateError(message);
      throw new Error(message);
    }
    try {
      await createPostMutation.mutateAsync({ id: crypto.randomUUID(), title: post.title, body: post.body, categoryKey: post.categoryKey as StudentCommunityCategoryKey, roomId: selectedRoom.id });
      showToast("Your discussion has been published in this room.");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Discussion could not be published.");
      throw error;
    }
  };

  const handleTopicClick = (topic: { id: string }) => {
    setSelectedDropdownTopic(({ react: "React & Next.js", design: "UI/UX Design Systems", datascience: "Data Science & AI", backend: "Backend & APIs" } as Record<string, string>)[topic.id] ?? "All topics");
  };
  const handlePostClick = (post: DiscussionPost) => setSelectedPostId(post.id);
  const handleLikePost = (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (post) reactionMutation.mutate({ postId, active: !post.reacted });
  };
  const handleAddReply = async (_postId: string, body: string) => {
    try {
      await createCommentMutation.mutateAsync({ id: crypto.randomUUID(), body });
      showToast("Reply saved.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Reply could not be saved.", "error");
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
  const roomsError = roomsQuery.isError ? "Your discussion rooms could not be loaded." : null;

  return (
    <div className="community-layout-root w-full h-full min-h-0 flex flex-col bg-[#f8faf9] overflow-y-auto lg:overflow-hidden">
      <ToastNotification message={toastMessage} tone={toastTone} />

      <div className="w-full max-w-430 h-full mx-auto px-3.5 sm:px-4 lg:px-6 py-2.5 sm:py-3 flex flex-col justify-start gap-3 min-h-0">
        <SearchAndFilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          selectedDropdownTopic={selectedDropdownTopic}
          onDropdownTopicSelect={setSelectedDropdownTopic}
          onCreateThreadClick={() => { setCreateError(null); setIsCreateModalOpen(true); }}
        />

        <div className="community-columns-row flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-3.5 w-full pb-6 lg:pb-0">
          <main className="community-main-feed flex-1 min-w-0 flex flex-col gap-3 h-full min-h-0 lg:overflow-y-auto xl:overflow-hidden">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5 w-full flex-none xl:flex-1 min-h-0 items-stretch">
              <section className="xl:col-span-7 min-h-64 xl:min-h-0 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[radial-gradient(ellipse_at_90%_10%,rgba(52,211,153,.32),transparent_42%),linear-gradient(135deg,#064e3b,#047857_58%,#059669)] p-5 sm:p-6 text-white shadow-sm flex flex-col justify-between relative">
                <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute right-12 top-5 size-40 rounded-full border border-white/10" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-50">
                      {selectedRoom?.kind === "course" ? <GraduationCap className="size-3.5" aria-hidden="true" /> : <Users className="size-3.5" aria-hidden="true" />}
                      {selectedRoom?.kind === "course" ? "Course room" : "Your community"}
                    </span>
                    <h2 className="mt-4 max-w-xl text-2xl sm:text-3xl font-bold tracking-tight">
                      {roomsQuery.isPending ? "Loading your rooms…" : selectedRoom?.title ?? "Your learning community"}
                    </h2>
                    <p className="mt-2 text-sm text-emerald-50/85">
                      {selectedRoom ? roomDescription(selectedRoom) : roomsQuery.isPending ? "Finding the rooms connected to your courses." : "Rooms appear here when they are available to your account."}
                    </p>
                  </div>
                  <span className="hidden sm:grid size-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10"><BookOpen className="size-6" aria-hidden="true" /></span>
                </div>
                <div className="relative mt-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/75">{profile.data ? `${profile.data.institution.name} · ${profile.data.brand.name}` : "Learning space"}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold"><MessagesSquare className="size-4 text-emerald-200" aria-hidden="true" />{selectedRoom?.discussionCount ?? "—"} discussions in this room</p>
                  </div>
                  <button type="button" onClick={() => { setCreateError(null); setIsCreateModalOpen(true); }} disabled={!selectedRoom} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
                    Start a discussion <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </section>

              <div className="xl:col-span-5 min-h-56 xl:min-h-0">
                <TrendingTopicsWidget topics={topics} isLoading={roomsQuery.isPending || postsQuery.isPending} errorMessage={roomsError ?? (postsQuery.isError ? "Topics could not be loaded." : null)} onTopicClick={handleTopicClick} onViewAllClick={() => setSelectedDropdownTopic("All topics")} />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-3.5 w-full flex-none xl:flex-1 min-h-0 items-stretch">
              <div className="xl:col-span-8 flex flex-col min-h-0 h-90 xl:h-full">
                <DiscussionFeed
                  discussions={filteredDiscussions}
                  onPostClick={handlePostClick}
                  onLikePost={handleLikePost}
                  isLoading={roomsQuery.isPending || postsQuery.isPending}
                  errorMessage={roomsError ?? (postsQuery.isError ? "Discussions in this room could not be loaded." : null)}
                />
              </div>

              <div className="xl:col-span-4 flex flex-col min-h-0 h-auto xl:h-full">
                <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs h-full min-h-60 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Your rooms</h3>
                      <p className="mt-1 text-xs text-slate-500">Course spaces available to your account.</p>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{roomsQuery.isPending || roomsQuery.isError ? "—" : courseRooms.length}</span>
                  </div>
                  <div className="mt-3 flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
                    {roomsQuery.isPending ? <p role="status" className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Loading your rooms…</p> : null}
                    {roomsError ? <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{roomsError}</p> : null}
                    {roomsQuery.isSuccess && rooms.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">No community rooms are available for your current course access.</p> : null}
                    {rooms.map((room) => {
                      const isSelected = selectedRoom?.id === room.id;
                      return (
                        <button key={room.id} type="button" onClick={() => handleRoomSelect(room.id)} aria-pressed={isSelected} className={`w-full rounded-xl border p-3 text-left transition-colors ${isSelected ? "border-emerald-200 bg-emerald-50/70" : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"}`}>
                          <span className="flex items-start gap-2.5">
                            <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500"}`}>{room.kind === "course" ? <BookOpen className="size-4" aria-hidden="true" /> : <Users className="size-4" aria-hidden="true" />}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold text-slate-800">{room.title}</span>
                              <span className="mt-1 block truncate text-[10px] text-slate-500">{room.kind === "course" ? room.code ?? room.semesterTitle ?? "Course room" : "Institution community"}</span>
                            </span>
                            <span className="shrink-0 pt-0.5 text-[10px] font-semibold text-slate-400">{room.discussionCount}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                    <div className="rounded-xl bg-slate-50 px-2 py-2"><strong className="block text-base text-slate-900">{postsQuery.isPending || postsQuery.isError ? "—" : posts.length}</strong><span className="text-[10px] text-slate-500">threads</span></div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2"><strong className="block text-base text-slate-900">{postsQuery.isPending || postsQuery.isError ? "—" : commentCount}</strong><span className="text-[10px] text-slate-500">replies</span></div>
                    <div className="rounded-xl bg-slate-50 px-2 py-2"><strong className="block text-base text-slate-900">{postsQuery.isPending || postsQuery.isError ? "—" : reactionCount}</strong><span className="text-[10px] text-slate-500">likes</span></div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>

      <CreateThreadModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateError(null); }}
        onSubmit={handleCreatePost}
        isSubmitting={createPostMutation.isPending}
        errorMessage={createError}
      />

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
