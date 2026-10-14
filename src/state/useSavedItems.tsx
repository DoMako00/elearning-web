import React, { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../app/providers/AuthProvider";
import { studentLearningApi } from "../features/student/api/studentLearningApi";

export type SavedItemType = "course" | "note" | "article" | "path" | "assignment";

export interface SavedItemRecord {
  id: string;
  type: SavedItemType;
  savedAt?: string;
}

interface SavedItemsContextType {
  savedIds: Record<string, SavedItemRecord>;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string, type?: SavedItemType) => void;
  getSavedCountByType: (type: SavedItemType) => number;
}

const SavedItemsContext = createContext<SavedItemsContextType | null>(null);
const savedCoursesKey = ["student", "learning", "saved-courses"] as const;

export const SavedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const savedCourses = useQuery({
    queryKey: savedCoursesKey,
    queryFn: ({ signal }) => studentLearningApi.listSavedCourses(signal),
    enabled: auth.status === "authenticated",
  });
  const mutation = useMutation<{ courseId: string; saved: boolean }, Error, { id: string; saved: boolean }>({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => saved ? studentLearningApi.saveCourse(id) : studentLearningApi.unsaveCourse(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: savedCoursesKey }); },
  });
  const savedIds = useMemo(() => Object.fromEntries((savedCourses.data ?? []).map((item) => [item.courseId, { id: item.courseId, type: "course" as const, savedAt: item.savedAt }])), [savedCourses.data]);
  const value = useMemo<SavedItemsContextType>(() => ({
    savedIds,
    isSaved: (id) => Boolean(savedIds[id]),
    toggleSaved: (id, type = "course") => { if (type === "course" && auth.status === "authenticated" && !mutation.isPending) void mutation.mutateAsync({ id, saved: !savedIds[id] }).catch(() => undefined); },
    getSavedCountByType: (type) => type === "course" ? (savedCourses.data?.length ?? 0) : 0,
  }), [auth.status, mutation, savedCourses.data, savedIds]);

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
};

export function useSavedItems(): SavedItemsContextType {
  const context = useContext(SavedItemsContext);
  if (!context) throw new Error("useSavedItems must be used within a SavedItemsProvider");
  return context;
}
