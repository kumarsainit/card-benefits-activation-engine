import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { Card } from '@/types';

export const CARDS_QUERY_KEY = ['cards'];

export function useCards() {
  return useQuery<Card[]>({
    queryKey: CARDS_QUERY_KEY,
    queryFn: () => apiClient.getCards(),
  });
}

export function useCard(cardId: string) {
  return useQuery<Card>({
    queryKey: [...CARDS_QUERY_KEY, cardId],
    queryFn: () => apiClient.getCardById(cardId),
    enabled: !!cardId,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      cardNumberLast4: string;
      cardNetwork: string;
      cardTier: string;
      cardholderName: string;
      expiryMonth: number;
      expiryYear: number;
    }) => apiClient.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY });
    },
  });
}
