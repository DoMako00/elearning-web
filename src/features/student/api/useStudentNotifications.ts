import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentNotificationsApi } from "./studentNotificationsApi";
import { useAuth } from "../../../app/providers/AuthProvider";

export const studentNotificationsKey = ["student", "notifications"] as const;

export function useStudentNotifications() {
  const auth = useAuth();
  return useQuery({ queryKey: studentNotificationsKey, queryFn: ({ signal }) => studentNotificationsApi.list(signal), enabled: auth.status === "authenticated" });
}

export function useMarkStudentNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string | null) => notificationId
      ? studentNotificationsApi.markRead(notificationId)
      : studentNotificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentNotificationsKey }),
  });
}
