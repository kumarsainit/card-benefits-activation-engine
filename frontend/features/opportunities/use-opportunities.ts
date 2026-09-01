import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { BenefitOpportunity, OpportunityStatus } from '@/types';

export const OPPORTUNITIES_QUERY_KEY = ['opportunities'];

export function useOpportunities(status?: OpportunityStatus) {
  return useQuery<BenefitOpportunity[]>({
    queryKey: status ? [...OPPORTUNITIES_QUERY_KEY, status] : OPPORTUNITIES_QUERY_KEY,
    queryFn: () => apiClient.getOpportunities(status),
  });
}

export function useOpportunity(id: string) {
  return useQuery<BenefitOpportunity>({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, id],
    queryFn: () => apiClient.getOpportunityById(id),
    enabled: !!id,
  });
}

export function useDismissOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.dismissOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
