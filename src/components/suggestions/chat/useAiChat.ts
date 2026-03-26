// src/components/suggestions/chat/useAiChat.ts
// =============================================================================
// Custom hook for AI Chat state management
// Supports both suggestion-specific chat and smart assistant with phases
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
    // Smart assistant types
    type?: 'text' | 'profile_card' | 'action_buttons' | 'action_confirmation' | 'no_more_candidates' | 'no_candidates_found' | 'decline_feedback';
    candidateUserId?: string;
    action?: string;
    suggestionId?: string;
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

export interface ChatActionButton {
  type: 'interested' | 'not_for_me' | 'tell_me_more';
  label: { he: string; en: string };
}

export type ChatPhase = 'discovery' | 'searching' | 'presenting' | 'discussing';

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

  // Smart assistant state
  const [phase, setPhase] = useState<ChatPhase>('discovery');
  const [currentCandidateUserId, setCurrentCandidateUserId] = useState<string | null>(null);
  const [actionButtons, setActionButtons] = useState<ChatActionButton[]>([]);
  const [potentialMatchId, setPotentialMatchId] = useState<string | null>(null);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneralChat = !suggestionId;

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

        // For general chat with no history — generate discovery greeting
        if (loadedMessages.length === 0 && isGeneralChat && !proactiveMessage) {
          setIsLoadingDiscovery(true);
          try {
            const greetingRes = await fetch(`/api/ai-chat/discovery-greeting?locale=${locale}`);
            if (greetingRes.ok) {
              const greetingData = await greetingRes.json();
              if (greetingData.greeting) {
                loadedMessages.push({
                  id: 'discovery-0',
                  role: 'assistant',
                  content: greetingData.greeting,
                  createdAt: new Date().toISOString(),
                  metadata: { type: 'text' },
                });
              }
            }
          } catch {
            // Fallback to static greeting
          } finally {
            setIsLoadingDiscovery(false);
          }
        }

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

        // Restore phase from conversation data
        if (data.phase) setPhase(data.phase as ChatPhase);
        if (data.currentCandidateUserId) {
          setCurrentCandidateUserId(data.currentCandidateUserId);
          // If we have a candidate, show action buttons
          if (data.phase === 'presenting') {
            setActionButtons([
              { type: 'interested', label: { he: 'מעוניין/ת', en: 'Interested' } },
              { type: 'not_for_me', label: { he: 'לא מתאים', en: 'Not for me' } },
              { type: 'tell_me_more', label: { he: 'ספר/י לי עוד', en: 'Tell me more' } },
            ]);
          }
        }
      }
      setHistoryLoaded(true);
    } catch (err) {
      console.error('[AiChat] History load error:', err);
      setError(locale === 'he' ? 'שגיאה בטעינת היסטוריית השיחה' : 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [locale, suggestionId, proactiveMessage, isGeneralChat]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setError(null);
    setSearchResults([]);
    setQuickReplies([]);
    setActionButtons([]);

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
        buffer = lines.pop() || '';

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
              // Smart assistant phase updates
              if (data.phase) {
                setPhase(data.phase as ChatPhase);
              }
              if (data.candidateUserId) {
                setCurrentCandidateUserId(data.candidateUserId);
              }
              if (data.actionButtons && data.actionButtons.length > 0) {
                setActionButtons(data.actionButtons);
                // If we got a profile card, add it as a message
                if (data.candidateUserId) {
                  const profileMsg: ChatMessage = {
                    id: `profile-${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    createdAt: new Date().toISOString(),
                    metadata: { type: 'profile_card', candidateUserId: data.candidateUserId },
                  };
                  // Will be added after the text message below
                  setTimeout(() => {
                    setMessages((prev) => [...prev, profileMsg]);
                  }, 100);
                }
              }
              if (data.potentialMatchId) {
                setPotentialMatchId(data.potentialMatchId);
              }
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (parseErr) {
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

  // Execute suggestion-specific actions (approve/decline existing suggestions)
  const executeAction = useCallback(async (action: ChatAction) => {
    if (!suggestionId || actionExecuting) return;
    setActionExecuting(true);
    setPendingActions([]);

    try {
      const res = await fetch('/api/ai-chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'suggestion_status',
          suggestionId,
          status: action.status,
          conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const confirmMsg: ChatMessage = {
        id: `action-${Date.now()}`,
        role: 'assistant',
        content: action.type === 'approve'
          ? (locale === 'he' ? 'אישרת את ההצעה! השדכנית תעודכן.' : 'You approved the suggestion! The matchmaker will be notified.')
          : (locale === 'he' ? 'דחית את ההצעה. נמשיך למצוא לך התאמות טובות יותר.' : 'You declined the suggestion. We\'ll keep finding better matches for you.'),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMsg]);

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

  // Execute smart assistant actions (interested/not_for_me/tell_me_more/trigger_search)
  const executeChatAction = useCallback(async (
    actionType: 'interested' | 'not_for_me' | 'tell_me_more' | 'trigger_search',
    feedback?: string,
  ) => {
    if (actionExecuting || !conversationId) return;
    setActionExecuting(true);
    setActionButtons([]);

    try {
      const body: Record<string, unknown> = {
        actionType,
        conversationId,
      };

      if (actionType === 'interested' && currentCandidateUserId && potentialMatchId) {
        body.candidateUserId = currentCandidateUserId;
        body.potentialMatchId = potentialMatchId;
      } else if (actionType === 'not_for_me' && currentCandidateUserId) {
        body.candidateUserId = currentCandidateUserId;
        if (feedback) body.feedback = feedback;
      }

      const res = await fetch('/api/ai-chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Update phase
      if (data.phase) {
        setPhase(data.phase as ChatPhase);
      }

      // Handle response based on action type
      if (actionType === 'interested') {
        setCurrentCandidateUserId(null);
        setPotentialMatchId(null);
        const msg: ChatMessage = {
          id: `action-${Date.now()}`,
          role: 'assistant',
          content: locale === 'he'
            ? 'מצוין! יצרתי את ההצעה. השדכנית שלך תעודכן ותוכל ללוות את התהליך. 🎉'
            : 'Excellent! The suggestion has been created. Your matchmaker will be notified. 🎉',
          createdAt: new Date().toISOString(),
          metadata: { type: 'action_confirmation', action: 'interested', suggestionId: data.suggestionId },
        };
        setMessages((prev) => [...prev, msg]);

        // Refresh suggestions list
        window.dispatchEvent(new CustomEvent('suggestion-status-changed', {
          detail: { suggestionId: data.suggestionId, status: 'PENDING_FIRST_PARTY' },
        }));
      } else if (actionType === 'not_for_me') {
        if (data.candidateUserId) {
          // Next candidate available
          setCurrentCandidateUserId(data.candidateUserId);
          setPotentialMatchId(data.potentialMatchId || null);
          if (data.actionButtons) setActionButtons(data.actionButtons);

          // Add profile card message
          const profileMsg: ChatMessage = {
            id: `profile-${Date.now()}`,
            role: 'assistant',
            content: locale === 'he' ? 'הנה מישהו/י אחר/ת שיכול/ה להתאים:' : 'Here\'s someone else who might be a match:',
            createdAt: new Date().toISOString(),
          };
          const cardMsg: ChatMessage = {
            id: `card-${Date.now()}`,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
            metadata: { type: 'profile_card', candidateUserId: data.candidateUserId },
          };
          setMessages((prev) => [...prev, profileMsg, cardMsg]);
        } else {
          // No more candidates
          setCurrentCandidateUserId(null);
          setPotentialMatchId(null);
          const msg: ChatMessage = {
            id: `no-more-${Date.now()}`,
            role: 'assistant',
            content: locale === 'he'
              ? 'כרגע אין לי עוד התאמות חדשות להציע. בואו נמשיך לדבר כדי שאוכל למצוא לך התאמות טובות יותר בהמשך. 💬'
              : "I don't have more matches to suggest right now. Let's keep chatting so I can find better matches for you. 💬",
            createdAt: new Date().toISOString(),
            metadata: { type: 'no_more_candidates' },
          };
          setMessages((prev) => [...prev, msg]);
        }
      } else if (actionType === 'tell_me_more') {
        // Phase changed to discussing, user can now chat about the candidate
      } else if (actionType === 'trigger_search') {
        if (data.candidateUserId) {
          setCurrentCandidateUserId(data.candidateUserId);
          setPotentialMatchId(data.potentialMatchId || null);
          if (data.actionButtons) setActionButtons(data.actionButtons);

          const introMsg: ChatMessage = {
            id: `search-intro-${Date.now()}`,
            role: 'assistant',
            content: locale === 'he' ? 'מצאתי מישהו/י שיכול/ה להתאים לך:' : 'I found someone who might be a match:',
            createdAt: new Date().toISOString(),
          };
          const cardMsg: ChatMessage = {
            id: `card-${Date.now()}`,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
            metadata: { type: 'profile_card', candidateUserId: data.candidateUserId },
          };
          setMessages((prev) => [...prev, introMsg, cardMsg]);
        } else {
          const msg: ChatMessage = {
            id: `no-found-${Date.now()}`,
            role: 'assistant',
            content: locale === 'he'
              ? 'חיפשתי במאגר ולא מצאתי כרגע התאמות חדשות. ככל שנמשיך לדייק את מה שחשוב לך, יעלו התאמות חדשות. 🔍'
              : "I searched the database but couldn't find new matches right now. As we keep refining what matters to you, new matches will come up. 🔍",
            createdAt: new Date().toISOString(),
            metadata: { type: 'no_candidates_found' },
          };
          setMessages((prev) => [...prev, msg]);
        }
      }
    } catch (err) {
      console.error('[AiChat] Chat action error:', err);
      setError(locale === 'he' ? 'שגיאה בביצוע הפעולה' : 'Failed to execute action');
    } finally {
      setActionExecuting(false);
    }
  }, [conversationId, currentCandidateUserId, potentialMatchId, locale, actionExecuting]);

  const rateMessage = useCallback(async (messageId: string, rating: 'up' | 'down') => {
    try {
      const res = await fetch('/api/ai-chat/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
      if (!res.ok) return;

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
    // Smart assistant
    phase,
    currentCandidateUserId,
    actionButtons,
    executeChatAction,
    isGeneralChat,
    isLoadingDiscovery,
  };
}
