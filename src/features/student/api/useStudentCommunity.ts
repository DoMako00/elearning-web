import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentCommunityApi } from "./studentCommunityApi";

export const studentCommunityKeys = {
  posts: ["student", "community", "posts"] as const,
  comments: (postId: string) => ["student", "community", "comments", postId] as const,
};

export function useStudentCommunityPosts() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentCommunityKeys.posts,
    queryFn: ({ signal }) => studentCommunityApi.listPosts(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentCommunityComments(postId: string | null) {
  const auth = useAuth();
  return useQuery({
    queryKey: studentCommunityKeys.comments(postId ?? ""),
    queryFn: ({ signal }) => studentCommunityApi.listComments(postId!, signal),
    enabled: auth.status === "authenticated" && Boolean(postId),
  });
}

export function useCreateStudentCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof studentCommunityApi.createPost>[0]) => studentCommunityApi.createPost(input),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: studentCommunityKeys.posts }),
  });
}

export function useCreateStudentCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; body: string }) => studentCommunityApi.createComment(postId, input),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: studentCommunityKeys.posts }),
      queryClient.invalidateQueries({ queryKey: studentCommunityKeys.comments(postId) }),
    ]),
  });
}

export function useSetStudentCommunityReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, active }: { postId: string; active: boolean }) => studentCommunityApi.setReaction(postId, active),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: studentCommunityKeys.posts }),
  });
}
