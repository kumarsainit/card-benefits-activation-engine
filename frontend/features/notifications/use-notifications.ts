import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api-client';
import { sseClient } from '@/services/sse-client';
import { Notification } from '@/types';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => apiClient.getNotifications(),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.markNotificationAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY);

      if (previous) {
        queryClient.setQueryData<Notification[]>(
          NOTIFICATIONS_QUERY_KEY,
          previous.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = sseClient.subscribe((notification: Notification) => {
      // 1. Optimistically update notifications cache
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (old = []) => {
        // Prevent duplicate events
        if (old.some((n) => n.id === notification.id)) return old;
        return [notification, ...old];
      });

      // 2. Invalidate relevant queries so the UI updates seamlessly
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // 3. Surface toast with deep link CTA
      toast(notification.title, {
        description: notification.message,
        action: notification.deepLink
          ? {
              label: 'View',
              onClick: () => router.push(notification.deepLink!),
            }
          : undefined,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, queryClient, router]);
}
