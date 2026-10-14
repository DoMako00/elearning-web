import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { studentSettingsApi } from "./studentSettingsApi";
import { studentLearningApi } from "./studentLearningApi";

const keys = {
  devices: ["student", "settings", "devices"] as const,
  currentSession: ["student", "settings", "current-session"] as const,
  commercial: ["student", "settings", "commercial"] as const,
  preferences: ["student", "settings", "preferences"] as const,
};

export function useStudentSettingsDevices() {
  const auth = useAuth();
  const devices = useQuery({ queryKey: keys.devices, queryFn: ({ signal }) => studentSettingsApi.listDevices(signal), enabled: auth.status === "authenticated" });
  const session = useQuery({ queryKey: keys.currentSession, queryFn: ({ signal }) => studentSettingsApi.currentSession(signal), enabled: auth.status === "authenticated" });
  return { devices, session };
}

export function useRevokeOtherStudentSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => studentSettingsApi.revokeOtherSessions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.devices }),
        queryClient.invalidateQueries({ queryKey: keys.currentSession }),
      ]);
    },
  });
}

export function useStudentCommercialSettings() {
  const auth = useAuth();
  return useQuery({ queryKey: keys.commercial, queryFn: ({ signal }) => studentSettingsApi.commercial(signal), enabled: auth.status === "authenticated" });
}

export function useStudentLearningPreferences() {
  const auth = useAuth();
  return useQuery({ queryKey: keys.preferences, queryFn: ({ signal }) => studentLearningApi.getPreferences(signal), enabled: auth.status === "authenticated" });
}
