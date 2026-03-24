// src/components/suggestions/chat/useAiChat.ts
// =============================================================================
// Custom hook for AI Chat state management
// =============================================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: {
    matchSearchResults?: string[];
    toolUsed?: string;
    userRating?: 'up' | 'down';
  };
}

interface SearchResult {
  id: string;
  ageRange: string;
  generalArea: string;
  religiousLevel: string;
  educationLevel: string;
  careerField: string;
  personalityTraits: string[];
  matchScore: number;
  matchReason: string;
}

export interface ChatAction {
  type: 'approve' | 'decline';
  label: { he: string; en: string };
  status: string;
  variant: 'positive' | 'negative';
}

interface UseAiChatOptions {
  locale: 'he' | 'en';
  suggestionId?: string; // When set, chat is contextual to a specific suggestion
  initialOpen?: boolean;
  proactiveMessage?: string; // Initial bot message to display
}

export function useAiChat({ locale, suggestionId, initialOpen, proactiveMessage }: UseAiChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen || false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [pendingActions, setPendingActions] = useState<ChatAction[]>([]);
  const [actionExecuting, setActionExecuting] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history on first open
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      void loadHistory();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ limit: '50' });
      if (suggestionId) params.set('suggestionId', suggestionId);
      const res = await fetch(`/api/ai-chat/history?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load history');

      const data = await res.json();
      if (data.success) {
        const loadedMessages = data.messages || [];
        // If no history and we have a proactive message, add it
        if (loadedMessages.length === 0 && proactiveMessage) {
          loadedMessages.push({
            id: 'proactive-0',
            role: 'assistant',
            content: proactiveMessage,
            createdAt: new Date().toISOString(),
          });
        }
        setMessages(loadedMessages);
        setConversationId(data.conversationId || null);
      }
      setHistoryLoaded(true);
    } catch (err) {
      console.error('[AiChat] History load error:', err);
      setError(locale === 'he' ? 'שגיאה בטעינת היסטוריית השיחה' : 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [locale, suggestionId, proactiveMessage]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setError(null);
    setSearchResults([]);
    setQuickReplies([]);

    // Add user message optimistically
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
          suggestionId,
          locale,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              accumulated += data.content;
              setStreamingContent(accumulated);
            } else if (data.type === 'done') {
              if (data.conversationId) {
                setConversationId(data.conversationId);
              }
              if (data.searchResults) {
                setSearchResults(data.searchResults);
              }
              if (data.escalated) {
                setEscalated(true);
              }
              if (data.actions && data.actions.length > 0) {
                setPendingActions(data.actions);
              }
              if (data.quickReplies && data.quickReplies.length > 0) {
                setQuickReplies(data.quickReplies);
              }
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            // Skip malformed SSE events
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      // Move streaming content to messages
      if (accumulated) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: accumulated,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('[AiChat] Send error:', err);
      const errorMessage = (err as Error).message;

      if (errorMessage.includes('Rate limit')) {
        setError(locale === 'he' ? 'הגעת למגבלת ההודעות. נסה שוב מאוחר יותר' : 'Rate limit reached. Try again later');
      } else {
        setError(locale === 'he' ? 'שגיאה בשליחת ההודעה. נסה שוב' : 'Failed to send message. Please try again');
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  }, [conversationId, locale, isStreaming, suggestionId]);

  const executeAction = useCallback(async (action: ChatAction) => {
    if (!suggestionId || actionExecuting) return;
    setActionExecuting(true);
    setPendingActions([]);

    try {
      const res = await fetch('/api/ai-chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId,
          status: action.status,
          conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Add the confirmation message from the API (it was saved server-side)
      const confirmMsg: ChatMessage = {
        id: `action-${Date.now()}`,
        role: 'assistant',
        content: action.type === 'approve'
          ? (locale === 'he' ? 'אישרת את ההצעה! השדכנית תעודכן.' : 'You approved the suggestion! The matchmaker will be notified.')
          : (locale === 'he' ? 'דחית את ההצעה. נמשיך למצוא לך התאמות טובות יותר.' : 'You declined the suggestion. We\'ll keep finding better matches for you.'),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMsg]);

      // Dispatch event so suggestion list can refresh
      window.dispatchEvent(new CustomEvent('suggestion-status-changed', {
        detail: { suggestionId, status: action.status },
      }));
    } catch (err) {
      console.error('[AiChat] Action error:', err);
      setError(locale === 'he' ? 'שגיאה בביצוע הפעולה' : 'Failed to execute action');
    } finally {
      setActionExecuting(false);
    }
  }, [suggestionId, conversationId, locale, actionExecuting]);

  const rateMessage = useCallback(async (messageId: string, rating: 'up' | 'down') => {
    try {
      const res = await fetch('/api/ai-chat/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
      if (!res.ok) return;

      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, metadata: { ...m.metadata, userRating: rating } } : m,
        ),
      );
    } catch (err) {
      console.error('[AiChat] Rate error:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    isOpen,
    setIsOpen,
    sendMessage,
    conversationId,
    searchResults,
    escalated,
    suggestionId,
    pendingActions,
    actionExecuting,
    executeAction,
    quickReplies,
    rateMessage,
  };
}
