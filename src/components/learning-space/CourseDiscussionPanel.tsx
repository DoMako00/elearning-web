import { Heart, MessageSquareText, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCreateStudentCommunityPost, useSetStudentCommunityReaction, useStudentCommunityPosts, useStudentCommunityRooms } from "../../features/student/api/useStudentCommunity";

export function CourseDiscussionPanel({ courseId }: { courseId: string }) {
  const [draft, setDraft] = useState("");
  const roomsQuery = useStudentCommunityRooms();
  const courseRoom = roomsQuery.data?.find((room) => room.kind === "course" && room.courseId === courseId);
  const postsQuery = useStudentCommunityPosts(courseRoom?.id ?? null);
  const createPost = useCreateStudentCommunityPost();
  const setReaction = useSetStudentCommunityReaction();
  const posts = postsQuery.data ?? [];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || createPost.isPending) return;
    try {
      if (!courseRoom) return;
      await createPost.mutateAsync({ id: crypto.randomUUID(), title: "Community discussion", categoryKey: "general", body, roomId: courseRoom.id });
      setDraft("");
    } catch { /* A persisted API error is rendered below; no local post is created. */ }
  };

  return (
    <div className="learning-discussion">
      <header>
        <h2>Community discussion</h2>
        <p>Discussions in this space are shared with students who can access this course.</p>
      </header>
      {roomsQuery.isPending ? <p role="status" className="learning-resources__empty">Loading course room…</p> : null}
      {roomsQuery.isError ? <p role="alert" className="learning-resources__empty">Course room could not be loaded.</p> : null}
      {roomsQuery.isSuccess && !courseRoom ? <p role="alert" className="learning-resources__empty">This course room is not available for your account.</p> : null}
      <form className="learning-discussion__composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="discussion-draft">
          Write a discussion post
        </label>
        <textarea
          id="discussion-draft"
          rows={3}
          value={draft}
          placeholder="Share a question or observation…"
          onChange={(event) => setDraft(event.target.value)}
          maxLength={20000}
        />
        <button type="submit" disabled={!draft.trim() || createPost.isPending || !courseRoom}>
          {createPost.isPending ? "Posting…" : "Post"} <Send aria-hidden="true" />
        </button>
      </form>
      {postsQuery.isLoading && courseRoom ? <p role="status" className="learning-resources__empty">Loading course discussions…</p> : null}
      {postsQuery.isError ? <p role="alert" className="learning-resources__empty">{postsQuery.error instanceof Error ? postsQuery.error.message : "Community discussions could not be loaded."}</p> : null}
      {createPost.isError ? <p role="alert" className="learning-resources__empty">{createPost.error instanceof Error ? createPost.error.message : "Your post could not be saved."}</p> : null}
      {setReaction.isError ? <p role="alert" className="learning-resources__empty">{setReaction.error instanceof Error ? setReaction.error.message : "Your reaction could not be saved."}</p> : null}
      <ul className="learning-discussion__list">
        {posts.map((post) => (
          <li key={post.id}>
            <span aria-hidden="true" style={{ width: 34, height: 34, flex: "0 0 auto", borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--color-brand-soft)", color: "var(--color-brand-hover)", fontSize: 11, fontWeight: 700 }}>{post.authorName.trim().charAt(0).toUpperCase()}</span>
            <div>
              <div className="learning-discussion__meta">
                <strong>{post.authorName}</strong>
                <em>Community member</em>
                <time dateTime={post.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.createdAt))}</time>
              </div>
              {post.title ? <strong>{post.title}</strong> : null}
              <p>{post.body}</p>
              <div className="learning-discussion__actions">
                <span>
                  <MessageSquareText aria-hidden="true" /> {post.commentCount} replies
                </span>
                <button type="button" aria-pressed={post.reacted} disabled={setReaction.isPending} onClick={() => setReaction.mutate({ postId: post.id, active: !post.reacted })}>
                  <Heart aria-hidden="true" fill={post.reacted ? "currentColor" : "none"} /> {post.reactionCount}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {postsQuery.isSuccess && posts.length === 0 ? <p role="status" className="learning-resources__empty">No community discussions yet.</p> : null}
    </div>
  );
}
