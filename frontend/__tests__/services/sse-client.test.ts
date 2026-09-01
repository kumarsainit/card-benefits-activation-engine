import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sseClient } from '@/services/sse-client';
import { Notification } from '@/types';

describe('SSEClient Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    sseClient.disconnect();
  });

  it('allows subscription and correctly invokes listeners when notification events are dispatched', () => {
    const listener = vi.fn();
    const unsubscribe = sseClient.subscribe(listener);

    const mockNotification: Notification = {
      id: 'notif-1',
      customerId: 'cust-1',
      title: 'Real-time Opportunity',
      message: 'New benefit opportunity detected',
      notificationType: 'BENEFIT_DETECTED',
      priority: 'HIGH',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // Trigger internal notification callback
    (sseClient as any).notifyListeners(mockNotification);

    expect(listener).toHaveBeenCalledWith(mockNotification);

    // Unsubscribe
    unsubscribe();
  });
});
