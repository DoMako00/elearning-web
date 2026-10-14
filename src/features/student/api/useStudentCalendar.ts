import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentCalendarApi } from "./studentCalendarApi";

export const studentCalendarKeys = {
  all: ["student", "calendar"] as const,
  range: (from: string, to: string) => ["student", "calendar", from, to] as const,
};

export function useStudentCalendar(from: string, to: string) {
  const auth = useAuth();
  return useQuery({
    queryKey: studentCalendarKeys.range(from, to),
    queryFn: ({ signal }) => studentCalendarApi.list(from, to, signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentCalendarMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: studentCalendarKeys.all });
  const create = useMutation({ mutationFn: (input: Parameters<typeof studentCalendarApi.create>[0]) => studentCalendarApi.create(input), onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ id, ...input }: Parameters<typeof studentCalendarApi.update>[1] & { id: string }) => studentCalendarApi.update(id, input), onSuccess: refresh });
  return { create, update };
}
