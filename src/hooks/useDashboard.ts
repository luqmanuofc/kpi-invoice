import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getDashboardMetrics } from "../api/dashboard";

export function useDashboardMetrics(month: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "metrics", month] as const,
    queryFn: () => getDashboardMetrics(month!),
    enabled: !!month,
    placeholderData: keepPreviousData,
  });
}
