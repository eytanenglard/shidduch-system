// src/hooks/useSmartScroll.ts
//
// Shared hook for smart auto-scroll in chat views.
// Tracks whether user has scrolled up, auto-scrolls on new messages
// only when at bottom, and exposes a "scroll to bottom" action.

'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface UseSmartScrollOptions {
  /** Pixel threshold to consider "at bottom" (default: 50) */
  threshold?: number;
}

interface UseSmartScrollReturn {
  /** Attach to the scrollable container */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Attach to the container's onScroll */
  handleScroll: () => void;
  /** Whether user has scrolled up from bottom */
  isScrolledUp: boolean;
  /** Number of new messages received while scrolled up */
  newMessageCount: number;
  /** Scroll to the bottom of the container */
  scrollToBottom: (force?: boolean) => void;
  /** Call when message count changes to trigger auto-scroll logic */
  onMessagesChanged: (messageCount: number) => void;
  /** Reset new message count (e.g., when user clicks scroll-to-bottom) */
  resetNewMessageCount: () => void;
}

export function useSmartScroll({
  threshold = 50,
}: UseSmartScrollOptions = {}): UseSmartScrollReturn {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userScrolledUpRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    userScrolledUpRef.current = !atBottom;
    setIsScrolledUp(!atBottom);

    // Reset new message count when user scrolls to bottom
    if (atBottom) {
      setNewMessageCount(0);
    }
  }, [threshold]);

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollRef.current) return;
    if (force || !userScrolledUpRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
      userScrolledUpRef.current = false;
      setIsScrolledUp(false);
      setNewMessageCount(0);
    }
  }, []);

  const onMessagesChanged = useCallback(
    (messageCount: number) => {
      const prevCount = prevMessageCountRef.current;
      const isNewMessage = messageCount > prevCount;
      const isInitialLoad = prevCount === 0 && messageCount > 0;
      prevMessageCountRef.current = messageCount;

      if (isInitialLoad) {
        scrollToBottom(true);
      } else if (isNewMessage) {
        if (userScrolledUpRef.current) {
          setNewMessageCount((prev) => prev + (messageCount - prevCount));
        } else {
          scrollToBottom();
        }
      }
    },
    [scrollToBottom]
  );

  const resetNewMessageCount = useCallback(() => {
    setNewMessageCount(0);
  }, []);

  // Reset state when component remounts
  useEffect(() => {
    return () => {
      prevMessageCountRef.current = 0;
      userScrolledUpRef.current = false;
    };
  }, []);

  return {
    scrollRef,
    handleScroll,
    isScrolledUp,
    newMessageCount,
    scrollToBottom,
    onMessagesChanged,
    resetNewMessageCount,
  };
}
