import { Heart, MessageSquareText, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DISCUSSION_POSTS, type DiscussionPost } from "./learningSpaceData";

export function CourseDiscussionPanel() {
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<DiscussionPost[]>(DISCUSSION_POSTS);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setPosts((current) => [
      {
        id: `post-${Date.now()}`,
        author: "Juliana",
        role: "Student",
        avatar: "https://i.pravatar.cc/72?img=47",
        time: "Just now",
        body,
        replies: 0,
        likes: 0,
      },
      ...current,
    ]);
    setDraft("");
  };

  return (
    <div className="learning-discussion">
      <header>
        <h2>Course discussion</h2>
        <p>Ask questions and share insights on Human Anatomy I with your instructor and classmates.</p>
      </header>
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
        />
        <button type="submit">
          Post <Send aria-hidden="true" />
        </button>
      </form>
      <ul className="learning-discussion__list">
        {posts.map((post) => (
          <li key={post.id}>
            <img src={post.avatar} alt="" />
            <div>
              <div className="learning-discussion__meta">
                <strong>{post.author}</strong>
                <em>{post.role}</em>
                <time>{post.time}</time>
              </div>
              <p>{post.body}</p>
              <div className="learning-discussion__actions">
                <span>
                  <MessageSquareText aria-hidden="true" /> {post.replies} replies
                </span>
                <span>
                  <Heart aria-hidden="true" /> {post.likes}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
