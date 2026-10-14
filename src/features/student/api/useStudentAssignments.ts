import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentAssignmentsApi } from "./studentAssignmentsApi";

export const studentAssignmentsKey = ["student", "assignments"] as const;

export function useStudentAssignments() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentAssignmentsKey,
    queryFn: ({ signal }) => studentAssignmentsApi.list(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useSubmitStudentAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, responseText, expectedVersion, attachmentIds }: { assignmentId: string; responseText: string; expectedVersion: number | null; attachmentIds: string[] }) =>
      studentAssignmentsApi.submit(assignmentId, { submissionId: crypto.randomUUID(), responseText, expectedVersion, attachmentIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentAssignmentsKey });
    },
  });
}
