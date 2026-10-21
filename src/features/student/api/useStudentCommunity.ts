import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentCommunityApi } from "./studentCommunityApi";

export const studentCommunityKeys = {
  rooms: ["student", "community", "rooms"] as const,
  posts: (roomId?: string | null) => ["student", "community", "posts", roomId === null ? "disabled" : roomId ?? "institution"] as const,
  comments: (postId: string) => ["student", "community", "comments", postId] as const,
};

export function useStudentCommunityRooms() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentCommunityKeys.rooms,
    queryFn: ({ signal }) => studentCommunityApi.listRooms(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentCommunityPosts(roomId?: string | null) {
  const auth = useAuth();
  return useQuery({
    queryKey: studentCommunityKeys.posts(roomId),
    queryFn: ({ signal }) => studentCommunityApi.listPosts(signal, roomId),
    enabled: auth.status === "authenticated" && roomId !== null,
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
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student", "community", "posts"] }),
      queryClient.invalidateQueries({ queryKey: studentCommunityKeys.rooms }),
    ]),
  });
}

export function useCreateStudentCommunityComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; body: string }) => studentCommunityApi.createComment(postId, input),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student", "community", "posts"] }),
      queryClient.invalidateQueries({ queryKey: studentCommunityKeys.comments(postId) }),
    ]),
  });
}

export function useSetStudentCommunityReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, active }: { postId: string; active: boolean }) => studentCommunityApi.setReaction(postId, active),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["student", "community", "posts"] }),
  });
}
