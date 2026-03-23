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

interface UseAiChatOptions {
  locale: 'he' | 'en';
}

export function useAiChat({ locale }: UseAiChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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
      const res = await fetch('/api/ai-chat/history?limit=50');
      if (!res.ok) throw new Error('Failed to load history');

      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setConversationId(data.conversationId || null);
      }
      setHistoryLoaded(true);
    } catch (err) {
      console.error('[AiChat] History load error:', err);
      setError(locale === 'he' ? 'שגיאה בטעינת היסטוריית השיחה' : 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setError(null);
    setSearchResults([]);

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
  }, [conversationId, locale, isStreaming]);

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
  };
}
