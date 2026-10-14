import { requireApiClient, extractApiErrorMessage } from "../../../app/api/client";

export type StudentCommunityCategoryKey = "general" | "react" | "design" | "datascience" | "backend";

export interface StudentCommunityPostDto {
  id: string;
  title: string | null;
  categoryKey: StudentCommunityCategoryKey;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
  reactionCount: number;
  reacted: boolean;
  version: number;
}

export interface StudentCommunityCommentDto {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Envelope<T> { ok: true; correlationId: string; data: T }

async function read<T>(path: string, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const response = await client.getJson<Envelope<T>>(path, { signal });
  if (response.error) throw new Error(extractApiErrorMessage(response.error, "Community data could not be loaded."));
  if (!response.data) throw new Error("The Community API returned an incomplete response.");
  return response.data.data;
}

async function write<T>(method: "POST" | "PUT", path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const response = await client.writeJson<Envelope<T>>(method, path, body, { signal });
  if (response.error) throw new Error(extractApiErrorMessage(response.error, "Community changes could not be saved."));
  if (!response.data) throw new Error("The Community API returned an incomplete response.");
  return response.data.data;
}

export const studentCommunityApi = {
  listPosts: (signal?: AbortSignal) => read<StudentCommunityPostDto[]>("/v1/student/community/posts", signal),
  listComments: (postId: string, signal?: AbortSignal) => read<StudentCommunityCommentDto[]>(`/v1/student/community/posts/${encodeURIComponent(postId)}/comments`, signal),
  createPost: (input: { id: string; title: string; categoryKey: StudentCommunityCategoryKey; body: string }, signal?: AbortSignal) => write<StudentCommunityPostDto>("POST", "/v1/student/community/posts", input, signal),
  createComment: (postId: string, input: { id: string; body: string }, signal?: AbortSignal) => write<StudentCommunityCommentDto>("POST", `/v1/student/community/posts/${encodeURIComponent(postId)}/comments`, input, signal),
  setReaction: (postId: string, active: boolean, signal?: AbortSignal) => write<{ postId: string; active: boolean; reactionCount: number }>("PUT", `/v1/student/community/posts/${encodeURIComponent(postId)}/reaction`, { active }, signal),
};
