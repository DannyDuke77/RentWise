// hooks/queries/useChangeLogQueries.ts
import { useQuery } from '@tanstack/react-query';
import apiService from '@/app/services/apiService';
import { queryKeys } from '../queryKeys';

export function useChangeLogs(
    page: number,
    pageSize: number,
    unitId?: string,
    fieldName?: string,
    search?: string
) {
    return useQuery({
        queryKey: ['change-logs', page, pageSize, unitId, fieldName, search],
        queryFn: async () => {
            let url = `/api/units/${unitId}/change-logs/?page=${page}&page_size=${pageSize}&search=${search}&field_name=${fieldName}`;
                        
            const data = await apiService.get(url);
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useUnitChangeLogs(unitId: string, page: number, pageSize: number) {
    return useQuery({
        queryKey: ['unit-change-logs', unitId, page, pageSize],
        queryFn: async () => {
            const data = await apiService.get(
                `/api/change-logs/unit/${unitId}/?page=${page}&page_size=${pageSize}`
            );
            return data;
        },
        enabled: !!unitId,
        staleTime: 5 * 60 * 1000,
    });
}
