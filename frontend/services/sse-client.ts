import { Notification } from '@/types';
import { apiClient } from './api-client';

export type SSEListener = (notification: Notification) => void;

export class SSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Set<SSEListener> = new Set();
  private reconnectTimeout: any = null;
  private reconnectDelay = 3000;
  private isConnecting = false;

  public connect(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    const token = apiClient.getToken();
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      '/api/v1';
    const streamUrl = `${baseUrl}/notifications/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
      };

      this.eventSource.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.notifyListeners(notification);
        } catch (e) {
          console.error('[SSE] Failed to parse event notification data', e);
        }
      });

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        this.disconnect();
        this.scheduleReconnect();
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  public subscribe(listener: SSEListener): () => void {
    this.listeners.add(listener);
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      this.connect();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private notifyListeners(notification: Notification): void {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (e) {
        console.error('[SSE] Error in notification listener', e);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.listeners.size === 0) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.reconnectDelay);
  }
}

export const sseClient = new SSEClient();
