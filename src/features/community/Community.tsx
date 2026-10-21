import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, GraduationCap, MessageCircle, MessagesSquare, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { SearchAndFilterToolbar } from "./components/SearchAndFilterToolbar";
import { DiscussionFeed } from "./components/DiscussionFeed";
import { CreateThreadModal } from "./components/CreateThreadModal";
import { DiscussionDetailModal } from "./components/DiscussionDetailModal";
import { useStudentProfile } from "../student/api/useStudentLearning";
import { useCreateStudentCommunityComment, useCreateStudentCommunityPost, useSetStudentCommunityReaction, useStudentCommunityComments, useStudentCommunityPosts, useStudentCommunityRooms } from "../student/api/useStudentCommunity";
import { mapCommunityPost } from "../student/api/studentCommunityMapper";
import type { StudentCommunityRoomDto, StudentCommunityCategoryKey } from "../student/api/studentCommunityApi";
import type { TopicCategory, DiscussionPost } from "./types/community";
import "./community.css";

const COMMUNITY_ASSETS = "/assets/community";

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
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
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
  const visibleRooms = rooms.filter((room) => {
    const query = roomSearchQuery.trim().toLowerCase();
    return !query || room.title.toLowerCase().includes(query)
      || (room.code ?? "").toLowerCase().includes(query)
      || (room.semesterTitle ?? "").toLowerCase().includes(query);
  });
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
    setSearchQuery("");
  };

  const openCreateModal = () => {
    setCreateError(null);
    setIsCreateModalOpen(true);
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

  const roomsError = roomsQuery.isError ? "Your course rooms could not be loaded." : null;
  const postsError = postsQuery.isError ? "Discussions in this room could not be loaded." : null;
  const hasDiscussionFilters = Boolean(searchQuery.trim()) || selectedCategory !== "all" || selectedDropdownTopic !== "All topics";

  return (
    <div className="community-workspace">
      <ToastNotification message={toastMessage} tone={toastTone} />
      <div className="community-workspace__intro">
        <p>Your courses. Your learning communities.</p>
      </div>

      <div className="community-workspace__grid">
        <aside className="community-room-rail" aria-label="Course rooms">
          <div className="community-room-rail__heading">
            <div>
              <h2>Your course rooms</h2>
              <p>A community for every course.</p>
            </div>
            <span className="community-room-rail__count" aria-label={rooms.length + " rooms"}>
              {roomsQuery.isPending || roomsQuery.isError ? "—" : rooms.length}
            </span>
          </div>

          <label className="community-room-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Find a course room</span>
            <input value={roomSearchQuery} onChange={(event) => setRoomSearchQuery(event.target.value)} placeholder="Find a course room..." />
          </label>

          <div className="community-room-list">
            {roomsQuery.isPending ? <p role="status" className="community-inline-state">Loading your course rooms…</p> : null}
            {roomsError ? (
              <div className="community-inline-state community-inline-state--error" role="alert">
                <span>{roomsError}</span>
                <button type="button" onClick={() => void roomsQuery.refetch()}>Try again</button>
              </div>
            ) : null}
            {roomsQuery.isSuccess && rooms.length === 0 ? <p className="community-inline-state">No course rooms are available for your current course access.</p> : null}
            {roomsQuery.isSuccess && rooms.length > 0 && visibleRooms.length === 0 ? <p className="community-inline-state">No rooms match “{roomSearchQuery}”.</p> : null}
            {visibleRooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <button key={room.id} type="button" onClick={() => handleRoomSelect(room.id)} aria-pressed={isSelected} className={"community-room-item" + (isSelected ? " is-selected" : "")}>
                  <span className="community-room-item__icon">
                    {room.kind === "course"
                      ? <img src={COMMUNITY_ASSETS + "/book-icon.svg"} alt="" />
                      : <Users aria-hidden="true" />}
                  </span>
                  <span className="community-room-item__copy">
                    <span className="community-room-item__title">{room.title}</span>
                    <span className="community-room-item__subtitle">{room.kind === "course" ? room.code ?? room.semesterTitle ?? "Course community" : "Institution community"}</span>
                  </span>
                  <ChevronRight className="community-room-item__chevron" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <img className="community-room-rail__decoration" src={COMMUNITY_ASSETS + "/rail-book-decoration.svg"} alt="" />
        </aside>

        <div className="community-workspace__main">
          <section className="community-room-hero" aria-labelledby="community-room-title">
            <div className="community-room-hero__copy">
              <span className="community-eyebrow">
                {selectedRoom?.kind === "course" ? <GraduationCap aria-hidden="true" /> : <Users aria-hidden="true" />}
                {selectedRoom?.kind === "course" ? "Course room" : "Learning community"}
              </span>
              <h1 id="community-room-title">
                {roomsQuery.isPending ? "Loading your rooms…" : selectedRoom?.title ?? "Your learning community"}
              </h1>
              <p className="community-room-hero__meta">
                {selectedRoom
                  ? [profile.data?.institution.name, selectedRoom.kind === "course" ? selectedRoom.semesterTitle : null].filter(Boolean).join(" · ") || roomDescription(selectedRoom)
                  : "Rooms appear here when they are available to your account."}
              </p>
              <p className="community-room-hero__description">A shared space for questions and course discussions.</p>
              <button type="button" onClick={openCreateModal} disabled={!selectedRoom} className="community-primary-button">
                <span className="community-primary-button__plus" aria-hidden="true">+</span>
                Start a discussion
              </button>
            </div>
            <img className="community-room-hero__art" src={COMMUNITY_ASSETS + "/room-header.png"} alt="" />
          </section>

          <div className="community-workspace__lower">
            <section className="community-discussions-panel" aria-label="Room discussions">
              <div className="community-discussions-panel__toolbar">
                <SearchAndFilterToolbar
                  heading="Discussions"
                  searchPlaceholder="Search this room..."
                  showCreateButton={false}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  selectedDropdownTopic={selectedDropdownTopic}
                  onDropdownTopicSelect={setSelectedDropdownTopic}
                />
              </div>
              <div className="community-discussions-panel__feed">
                <DiscussionFeed
                  discussions={filteredDiscussions}
                  onPostClick={handlePostClick}
                  onLikePost={handleLikePost}
                  isLoading={roomsQuery.isPending || postsQuery.isPending}
                  errorMessage={roomsError ?? postsError}
                  showHeading={false}
                  onStartDiscussion={openCreateModal}
                  emptyTitle={hasDiscussionFilters ? "No discussions match your filters" : "Start the conversation"}
                  emptyDescription={hasDiscussionFilters ? "Try a different search or topic to see more discussions." : "Ask a question or share something useful with your course community."}
                  showEmptyAction={!hasDiscussionFilters && Boolean(selectedRoom)}
                />
              </div>
            </section>

            <aside className="community-groups-panel" aria-labelledby="community-groups-title">
              <div className="community-groups-panel__heading">
                <span className="community-groups-panel__icon"><img src={COMMUNITY_ASSETS + "/chat-icon.svg"} alt="" /></span>
                <div>
                  <h2 id="community-groups-title">Course groups</h2>
                  <p>Keep course conversations going in Messages.</p>
                </div>
              </div>
              <img className="community-groups-panel__art" src={COMMUNITY_ASSETS + "/course-groups.png"} alt="" />
              <Link to="/messages" className="community-groups-panel__link">
                <span className="community-groups-panel__link-icon"><MessagesSquare aria-hidden="true" /></span>
                <span><strong>Group conversations</strong><small>In Messages</small></span>
                <ChevronRight aria-hidden="true" />
              </Link>
              <Link to="/messages" className="community-primary-button community-primary-button--wide">
                Open in Messages <ArrowRight aria-hidden="true" />
              </Link>
              <p className="community-groups-panel__hint"><MessageCircle aria-hidden="true" /> Continue course conversations with your classmates.</p>
            </aside>
          </div>
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
