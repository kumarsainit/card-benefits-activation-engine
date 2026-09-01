import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Transaction } from '@/types';
import { OPPORTUNITIES_QUERY_KEY } from '../opportunities/use-opportunities';

export const TRANSACTIONS_QUERY_KEY = ['transactions'];

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: TRANSACTIONS_QUERY_KEY,
    queryFn: () => apiClient.getTransactions(),
  });
}

export function useTransaction(transactionId: string) {
  return useQuery<Transaction>({
    queryKey: [...TRANSACTIONS_QUERY_KEY, transactionId],
    queryFn: () => apiClient.getTransactionById(transactionId),
    enabled: !!transactionId,
  });
}

export function useSimulateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scenarioName, customAmount }: { scenarioName: string; customAmount?: number }) =>
      apiClient.simulateScenario(scenarioName, customAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
