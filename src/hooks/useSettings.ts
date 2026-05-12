import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSettings,
  updateSettings,
  type SettingsUpdate,
} from "../api/settings";

export const SETTINGS_QUERY_KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: getSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SettingsUpdate) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}
