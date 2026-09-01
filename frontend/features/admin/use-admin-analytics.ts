import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { AdminAnalytics } from '@/types';

export const ADMIN_ANALYTICS_QUERY_KEY = ['admin-analytics'];

export function useAdminAnalytics() {
  return useQuery<AdminAnalytics>({
    queryKey: ADMIN_ANALYTICS_QUERY_KEY,
    queryFn: () => apiClient.getAdminAnalytics(),
  });
}
