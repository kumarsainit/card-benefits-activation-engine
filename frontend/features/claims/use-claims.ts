import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Claim, ClaimStatus, ClaimEvidence } from '@/types';
import { OPPORTUNITIES_QUERY_KEY } from '../opportunities/use-opportunities';

export const CLAIMS_QUERY_KEY = ['claims'];

export function useClaims(status?: ClaimStatus) {
  return useQuery<Claim[]>({
    queryKey: status ? [...CLAIMS_QUERY_KEY, status] : CLAIMS_QUERY_KEY,
    queryFn: () => apiClient.getClaims(status),
  });
}

export function useClaim(id: string) {
  return useQuery<Claim>({
    queryKey: [...CLAIMS_QUERY_KEY, id],
    queryFn: () => apiClient.getClaimById(id),
    enabled: !!id,
  });
}

export function useSubmitClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: {
      data: {
        opportunityId?: string;
        transactionId: string;
        cardBenefitId: string;
        requestedAmount: number;
        incidentDate: string;
        submissionNotes?: string;
        initialEvidence?: any[];
      };
      idempotencyKey?: string;
    }) => apiClient.submitClaim(data, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLAIMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAddEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      claimId,
      evidence,
    }: {
      claimId: string;
      evidence: {
        evidenceType: string;
        fileName: string;
        fileUrl?: string;
        fileSize?: number;
        mimeType?: string;
      };
    }) => apiClient.addEvidence(claimId, evidence),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CLAIMS_QUERY_KEY, variables.claimId] });
      queryClient.invalidateQueries({ queryKey: CLAIMS_QUERY_KEY });
    },
  });
}
