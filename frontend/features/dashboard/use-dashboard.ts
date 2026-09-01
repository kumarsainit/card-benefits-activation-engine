import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { BenefitOpportunity, Card, Transaction, Claim } from '@/types';

export interface DashboardData {
  cards: Card[];
  opportunities: BenefitOpportunity[];
  transactions: Transaction[];
  claims: Claim[];
  metrics: {
    totalPotentialProtectionValue: number;
    activeOpportunitiesCount: number;
    enrolledCardsCount: number;
    claimsInProgressCount: number;
  };
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [cards, opportunities, transactions, claims] = await Promise.all([
        apiClient.getCards().catch(() => [] as Card[]),
        apiClient.getOpportunities().catch(() => [] as BenefitOpportunity[]),
        apiClient.getTransactions().catch(() => [] as Transaction[]),
        apiClient.getClaims().catch(() => [] as Claim[]),
      ]);

      const activeOpps = opportunities.filter((o) => o.status === 'DETECTED' || o.status === 'VIEWED');

      const totalPotentialValue = activeOpps.reduce((sum, opp) => {
        const val = typeof opp.potentialClaimAmount === 'number' ? opp.potentialClaimAmount : parseFloat(opp.potentialClaimAmount || '0');
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      const claimsInProgress = claims.filter(
        (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW' || c.status === 'ADDITIONAL_INFORMATION_REQUIRED'
      ).length;

      return {
        cards,
        opportunities,
        transactions,
        claims,
        metrics: {
          totalPotentialProtectionValue: totalPotentialValue,
          activeOpportunitiesCount: activeOpps.length,
          enrolledCardsCount: cards.length,
          claimsInProgressCount: claimsInProgress,
        },
      };
    },
  });
}
