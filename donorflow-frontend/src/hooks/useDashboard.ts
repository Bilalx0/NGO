import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { DashboardStats } from '@/types/api';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}