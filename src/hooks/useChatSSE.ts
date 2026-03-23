// src/hooks/useChatSSE.ts
//
// React hook for real-time chat updates via Server-Sent Events.
// Falls back to polling if SSE is unavailable.

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SSEMessage {
  id: string;
  content: string;
  senderType: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  conversationType: 'direct' | 'suggestion';
}

interface UseChatSSEOptions {
  /** SSE endpoint URL (e.g., '/api/messages/stream') */
  streamUrl: string;
  /** Polling endpoint URL (fallback) */
  pollUrl: string;
  /** Polling interval in ms (default: 12000) */
  pollInterval?: number;
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Callback when a new message arrives */
  onNewMessage?: (message: SSEMessage) => void;
  /** Callback when typing indicator changes */
  onTyping?: (data: { conversationId: string; userId: string; userName: string }) => void;
  /** Callback when messages are read */
  onMessageRead?: (data: { conversationId: string; readByUserId: string }) => void;
}

interface UseChatSSEReturn {
  /** Whether SSE is currently connected */
  isConnected: boolean;
  /** Whether using fallback polling mode */
  isPolling: boolean;
  /** Manually trigger a poll/refresh */
  refresh: () => void;
}

export function useChatSSE({
  streamUrl,
  pollUrl,
  pollInterval = 12000,
  enabled = true,
  onNewMessage,
  onTyping,
  onMessageRead,
}: UseChatSSEOptions): UseChatSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef({ onNewMessage, onTyping, onMessageRead });

  // Keep callbacks ref current without causing re-renders
  useEffect(() => {
    callbacksRef.current = { onNewMessage, onTyping, onMessageRead };
  }, [onNewMessage, onTyping, onMessageRead]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsPolling(true);

    const poll = async () => {
      try {
        const res = await fetch(pollUrl);
        if (res.ok) {
          // The poll callback should handle the response
          // This is just to trigger re-fetches in the parent component
        }
      } catch {
        // Silent fail for polling
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, pollInterval);
  }, [pollUrl, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const connectSSE = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setIsConnected(true);
        stopPolling(); // SSE working, no need for polling
      });

      es.addEventListener('new_message', (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onNewMessage?.(data);
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('typing', (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onTyping?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('message_read', (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacksRef.current.onMessageRead?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('reconnect', () => {
        // Server asked us to reconnect
        es.close();
        setTimeout(connectSSE, 1000);
      });

      es.addEventListener('heartbeat', () => {
        // Keep-alive — no action needed
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        eventSourceRef.current = null;
        // Fall back to polling
        startPolling();
        // Try to reconnect SSE after 30 seconds
        setTimeout(connectSSE, 30000);
      };
    } catch {
      // EventSource not supported or URL error — fall back to polling
      startPolling();
    }
  }, [streamUrl, startPolling, stopPolling]);

  const refresh = useCallback(() => {
    // Manually trigger a poll regardless of SSE state
    fetch(pollUrl).catch(() => {});
  }, [pollUrl]);

  // Main effect
  useEffect(() => {
    if (!enabled) return;

    // Try SSE first
    connectSSE();

    // Visibility handling
    const handleVisibility = () => {
      if (document.hidden) {
        // Disconnect SSE and stop polling when tab hidden
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
          setIsConnected(false);
        }
        stopPolling();
      } else {
        // Reconnect when tab becomes visible
        connectSSE();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
      setIsConnected(false);
    };
  }, [enabled, connectSSE, stopPolling]);

  return { isConnected, isPolling, refresh };
}
