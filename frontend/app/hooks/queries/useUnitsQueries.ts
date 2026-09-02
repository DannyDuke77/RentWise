import { useQuery } from "@tanstack/react-query";
import apiService from "@/app/services/apiService";
import { queryKeys } from "../queryKeys";

export function useUnit(unitId: string) {
    return useQuery({
        queryKey: queryKeys.unit(unitId),
        queryFn: async () => {
            const data = await apiService.get(`/api/units/${unitId}/`);
            return data;
        },
    });
}