import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { useBusiness } from "@/app/providers/BusinessProvider";
import { DashboardData, DashboardTrends } from "@/app/src/types/Types";




export function useDashboard() {
  const { activeBusinessId } = useBusiness();

  return useQuery<DashboardData>({
    queryKey: ["dashboard", activeBusinessId],
    queryFn: () =>
      apiService.get(`/api/businesses/${activeBusinessId}/dashboard/`),
    enabled: !!activeBusinessId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useDashboardTrends(period: string = "30d") {
  const { activeBusinessId } = useBusiness();

  return useQuery<DashboardTrends>({
    queryKey: ["dashboard", "trends", activeBusinessId, period],
    queryFn: () =>
      apiService.get(
        `/api/businesses/${activeBusinessId}/dashboard/trends/?period=${period}`
      ),
    enabled: !!activeBusinessId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}