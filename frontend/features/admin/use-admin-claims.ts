import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Claim, ClaimStatus } from '@/types';
import { CLAIMS_QUERY_KEY } from '../claims/use-claims';

export const ADMIN_CLAIMS_QUERY_KEY = ['admin-claims'];

export function useAdminClaims(status?: ClaimStatus) {
  return useQuery<Claim[]>({
    queryKey: status ? [...ADMIN_CLAIMS_QUERY_KEY, status] : ADMIN_CLAIMS_QUERY_KEY,
    queryFn: () => apiClient.getAdminClaims(status),
  });
}

export function useAdminClaim(id: string) {
  const queryClient = useQueryClient();

  return useQuery<Claim>({
    queryKey: [...ADMIN_CLAIMS_QUERY_KEY, id],
    queryFn: async () => {
      // First check if already in admin claims list cache
      const cachedClaims = queryClient.getQueryData<Claim[]>(ADMIN_CLAIMS_QUERY_KEY);
      const found = cachedClaims?.find((c) => c.id === id);
      if (found) return found;

      // Fallback: Fetch all admin claims and find
      const allClaims = await apiClient.getAdminClaims();
      const match = allClaims.find((c) => c.id === id);
      if (match) return match;

      return apiClient.getClaimById(id);
    },
    enabled: !!id,
  });
}

export function useReviewClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimId,
      data,
    }: {
      claimId: string;
      data: {
        status: ClaimStatus;
        approvedAmount?: number;
        adjudicationNotes?: string;
      };
    }) => apiClient.reviewClaim(claimId, data),
    onSuccess: (reviewedClaim) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CLAIMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CLAIMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.setQueryData([...ADMIN_CLAIMS_QUERY_KEY, reviewedClaim.id], reviewedClaim);
    },
  });
}
