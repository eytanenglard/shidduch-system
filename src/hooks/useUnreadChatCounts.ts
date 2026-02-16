// src/hooks/useUnreadChatCounts.ts
// ==========================================
// NeshamaTech - Hook for unread chat message counts
// Polls /api/matchmaker/chat/unread periodically
// Used by SuggestionCard for badge + Dashboard for totals
// ==========================================

'use client';

import { useState, useEffect, useCallback } from 'react';

interface UnreadCounts {
  totalUnread: number;
  bySuggestion: Record<string, number>;
  isLoading: boolean;
}

export function useUnreadChatCounts(pollingInterval = 30000): UnreadCounts {
  const [totalUnread, setTotalUnread] = useState(0);
  const [bySuggestion, setBySuggestion] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnread = useCallback(async () => {
    try {
      const response = await fetch('/api/matchmaker/chat/unread');
      if (!response.ok) return;
      const data = await response.json();

      if (data.success) {
        setTotalUnread(data.totalUnread || 0);
        setBySuggestion(data.bySuggestion || {});
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchUnread, pollingInterval]);

  return { totalUnread, bySuggestion, isLoading };
}
