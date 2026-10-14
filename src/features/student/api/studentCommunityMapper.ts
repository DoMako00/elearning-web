import type { DiscussionPost, DiscussionReply } from "../../community/types/community";
import type { StudentCommunityCategoryKey, StudentCommunityCommentDto, StudentCommunityPostDto } from "./studentCommunityApi";

const labels: Record<StudentCommunityCategoryKey, string> = {
  general: "General",
  react: "React & Next.js",
  design: "UI/UX Design",
  datascience: "Data Science & AI",
  backend: "Backend & APIs",
};

const icons: Record<StudentCommunityCategoryKey, DiscussionPost["topicIcon"]> = {
  general: "message",
  react: "code",
  design: "palette",
  datascience: "chart",
  backend: "cubes",
};

const colors: Record<StudentCommunityCategoryKey, string> = {
  general: "emerald",
  react: "indigo",
  design: "purple",
  datascience: "blue",
  backend: "amber",
};

export function formatCommunityTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(value).toLocaleDateString();
}

export function mapCommunityComment(comment: StudentCommunityCommentDto): DiscussionReply {
  return {
    id: comment.id,
    author: { id: comment.authorId, name: comment.authorName },
    content: comment.body,
    timestamp: new Date(comment.createdAt).getTime(),
    timeAgo: formatCommunityTime(comment.createdAt),
  };
}

export function mapCommunityPost(post: StudentCommunityPostDto, replies?: StudentCommunityCommentDto[]): DiscussionPost {
  const category = labels[post.categoryKey];
  return {
    id: post.id,
    title: post.title ?? "Discussion",
    content: post.body,
    author: { id: post.authorId, name: post.authorName },
    category: { key: post.categoryKey, label: category, badgeColor: colors[post.categoryKey] },
    topicIcon: icons[post.categoryKey],
    timeAgo: formatCommunityTime(post.createdAt),
    timestamp: new Date(post.createdAt).getTime(),
    repliesCount: post.commentCount,
    upvotesCount: post.reactionCount,
    replies: replies?.map(mapCommunityComment),
  };
}
