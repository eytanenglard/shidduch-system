// src/hooks/useTypingIndicator.ts
//
// Shared hook for chat typing indicators.
// Handles both displaying remote typing state and sending local typing notifications.

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTypingIndicatorOptions {
  /** Conversation ID to scope typing events */
  conversationId: string;
  /** Conversation type ('direct' | 'suggestion') */
  conversationType: 'direct' | 'suggestion';
  /** How long to show typing indicator after last event (ms, default: 4000) */
  displayDuration?: number;
  /** Debounce interval for sending typing notifications (ms, default: 3000) */
  sendDebounce?: number;
}

interface UseTypingIndicatorReturn {
  /** Name of user currently typing, or null */
  typingUser: string | null;
  /** Call this when remote typing event is received (from SSE) */
  onRemoteTyping: (data: { conversationId: string; userId: string; userName: string }) => void;
  /** Call this when local user types (triggers debounced notification) */
  notifyTyping: () => void;
}

export function useTypingIndicator({
  conversationId,
  conversationType,
  displayDuration = 4000,
  sendDebounce = 3000,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sendTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onRemoteTyping = useCallback(
    (data: { conversationId: string; userId: string; userName: string }) => {
      // For suggestion chats, SSE sends conversationId as "suggestion:{id}"
      const expectedId =
        conversationType === 'suggestion'
          ? `suggestion:${conversationId}`
          : conversationId;

      if (data.conversationId !== expectedId && data.conversationId !== conversationId) return;

      setTypingUser(data.userName);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setTypingUser(null), displayDuration);
    },
    [conversationId, conversationType, displayDuration]
  );

  const notifyTyping = useCallback(() => {
    if (sendTimerRef.current) return; // Already sent recently

    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        conversationType,
      }),
    }).catch(() => {});

    sendTimerRef.current = setTimeout(() => {
      sendTimerRef.current = null;
    }, sendDebounce);
  }, [conversationId, conversationType, sendDebounce]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (sendTimerRef.current) clearTimeout(sendTimerRef.current);
    };
  }, []);

  return { typingUser, onRemoteTyping, notifyTyping };
}
