// src/hooks/useChatMessages.ts
//
// Shared hook for loading, sending, and managing chat messages.
// Supports optimistic updates, SSE real-time additions, and visibility-aware polling.

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export type MessageContentType = 'TEXT' | 'IMAGE' | 'VOICE';

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'matchmaker' | 'system';
  senderName: string;
  isRead: boolean;
  createdAt: string;
  isMine: boolean;
  /** Content type — defaults to TEXT */
  messageType?: MessageContentType;
  /** Media URL for IMAGE/VOICE messages */
  mediaUrl?: string | null;
  /** Reactions on this message */
  reactions?: MessageReaction[];
}

interface UseChatMessagesOptions {
  /** API endpoint to GET/POST/PATCH messages */
  endpoint: string;
  /** Whether to enable loading and polling */
  enabled?: boolean;
  /** Polling interval in ms (default: 12000) */
  pollInterval?: number;
  /** Locale for error messages */
  locale?: 'he' | 'en';
}

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<void>;
  addMessageFromSSE: (msg: ChatMessage) => void;
  reload: () => Promise<void>;
}

export function useChatMessages({
  endpoint,
  enabled = true,
  pollInterval = 12000,
  locale = 'he',
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const isHe = locale === 'he';

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // Initial load + mark as read
  useEffect(() => {
    if (!enabled) return;
    setIsLoading(true);
    setMessages([]);
    loadMessages();
    // Mark as read
    fetch(endpoint, { method: 'PATCH' }).catch(console.error);
  }, [enabled, endpoint, loadMessages]);

  // Visibility-aware polling
  useEffect(() => {
    if (!enabled) return;

    let interval: NodeJS.Timeout | null = null;
    const start = () => {
      interval = setInterval(loadMessages, pollInterval);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        loadMessages();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, loadMessages, pollInterval]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        content: content.trim(),
        senderId: '',
        senderType: 'user',
        senderName: '',
        isRead: false,
        createdAt: new Date().toISOString(),
        isMine: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setIsSending(true);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: optimisticMsg.content }),
        });

        if (!res.ok) throw new Error('Failed to send');
        const data = await res.json();

        if (data.success && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? data.message : m))
          );
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(isHe ? 'שגיאה בשליחת ההודעה' : 'Error sending message');
      } finally {
        setIsSending(false);
      }
    },
    [endpoint, isSending, isHe]
  );

  // Add a message received via SSE (deduplicated)
  const addMessageFromSSE = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    addMessageFromSSE,
    reload: loadMessages,
  };
}
