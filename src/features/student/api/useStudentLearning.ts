import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentLearningApi } from "./studentLearningApi";

export const studentLearningKeys = {
  profile: ["student", "profile"] as const,
  progress: ["student", "learning", "progress"] as const,
  preferences: ["student", "learning", "preferences"] as const,
  savedCourses: ["student", "learning", "saved-courses"] as const,
  lessonNote: (lessonId: string) => ["student", "learning", "lesson-note", lessonId] as const,
  learningPaths: ["student", "learning", "paths"] as const,
  learningPath: (learningPathId: string) => ["student", "learning", "paths", learningPathId] as const,
  achievementAwards: ["student", "learning", "achievement-awards"] as const,
  certificates: ["student", "learning", "certificates"] as const,
};

export function useStudentProfile() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.profile,
    queryFn: ({ signal }) => studentLearningApi.getProfile(signal),
    enabled: auth.status === "authenticated",
    // Many components read the profile; a failed profile must not be
    // re-requested every time one of them mounts. Explicit retries still work.
    retryOnMount: false,
  });
}

export function useStudentProgress() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.progress,
    queryFn: ({ signal }) => studentLearningApi.getProgress(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentLearningPreferences() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.preferences,
    queryFn: ({ signal }) => studentLearningApi.getPreferences(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useSetWeeklyLessonGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { weeklyLessonGoal: number | null; expectedVersion: number | null }) =>
      studentLearningApi.setWeeklyLessonGoal(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentLearningKeys.preferences }),
        queryClient.invalidateQueries({ queryKey: studentLearningKeys.progress }),
      ]);
    },
  });
}

export function useStudentLessonProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: "in_progress" | "completed" }) =>
      studentLearningApi.updateLessonProgress(lessonId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentLearningKeys.progress });
    },
  });
}

export function useStudentLessonNote(lessonId?: string) {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.lessonNote(lessonId ?? ""),
    queryFn: ({ signal }) => studentLearningApi.getLessonNote(lessonId!, signal),
    enabled: auth.status === "authenticated" && Boolean(lessonId),
  });
}

export function useSaveStudentLessonNote(lessonId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; expectedVersion: number | null }) => {
      if (!lessonId) throw new Error("Choose a lesson before saving a note.");
      return studentLearningApi.saveLessonNote({ lessonId, ...input });
    },
    onSuccess: async (note) => {
      await queryClient.setQueryData(studentLearningKeys.lessonNote(note.lessonId), note);
    },
  });
}

export function useStudentSavedCourses() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.savedCourses,
    queryFn: ({ signal }) => studentLearningApi.listSavedCourses(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentLearningPaths() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.learningPaths,
    queryFn: ({ signal }) => studentLearningApi.listLearningPaths(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentLearningPath(learningPathId?: string) {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.learningPath(learningPathId ?? ""),
    queryFn: ({ signal }) => studentLearningApi.getLearningPath(learningPathId!, signal),
    enabled: auth.status === "authenticated" && Boolean(learningPathId),
  });
}

export function useStudentAchievementAwards() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.achievementAwards,
    queryFn: ({ signal }) => studentLearningApi.listAchievementAwards(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentCertificates() {
  const auth = useAuth();
  return useQuery({
    queryKey: studentLearningKeys.certificates,
    queryFn: ({ signal }) => studentLearningApi.listCertificates(signal),
    enabled: auth.status === "authenticated",
  });
}

export function useToggleStudentSavedCourse() {
  const queryClient = useQueryClient();
  return useMutation<{ courseId: string; saved: boolean }, Error, { courseId: string; saved: boolean }>({
    mutationFn: ({ courseId, saved }: { courseId: string; saved: boolean }) =>
      saved ? studentLearningApi.saveCourse(courseId) : studentLearningApi.unsaveCourse(courseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: studentLearningKeys.savedCourses });
    },
  });
}
