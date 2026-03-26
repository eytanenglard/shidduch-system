// src/components/suggestions/chat/AiChatMessages.tsx
// =============================================================================
// Scrollable message list with auto-scroll
// Supports text bubbles, profile cards, and action buttons
// =============================================================================

'use client';

import React, { useRef, useEffect } from 'react';
import AiChatBubble from './AiChatBubble';
import AiChatProfileCard from './AiChatProfileCard';
import AiChatActionButtons from './AiChatActionButtons';
import AiChatWelcome from './AiChatWelcome';
import type { ChatMessage, ChatAction, ChatActionButton } from './useAiChat';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isLoading: boolean;
  locale: 'he' | 'en';
  pendingActions?: ChatAction[];
  actionExecuting?: boolean;
  onAction?: (action: ChatAction) => void;
  quickReplies?: string[];
  onQuickReply?: (text: string) => void;
  onRateMessage?: (messageId: string, rating: 'up' | 'down') => void;
  // Smart assistant props
  isGeneralChat?: boolean;
  actionButtons?: ChatActionButton[];
  onChatAction?: (type: ChatActionButton['type']) => void;
  isLoadingDiscovery?: boolean;
}

export default function AiChatMessages({
  messages,
  isStreaming,
  streamingContent,
  isLoading,
  locale,
  pendingActions,
  actionExecuting,
  onAction,
  quickReplies,
  onQuickReply,
  onRateMessage,
  isGeneralChat = false,
  actionButtons,
  onChatAction,
  isLoadingDiscovery = false,
}: AiChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHebrew = locale === 'he';

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
    >
      {/* Welcome message if no history */}
      {messages.length === 0 && !isStreaming && (
        <AiChatWelcome
          locale={locale}
          isGeneralChat={isGeneralChat}
          isLoadingDiscovery={isLoadingDiscovery}
          onQuickPrompt={(text) => onQuickReply?.(text)}
        />
      )}

      {/* Messages */}
      {messages.map((msg) => {
        // Profile card message
        if (msg.metadata?.type === 'profile_card' && msg.metadata.candidateUserId) {
          return (
            <div key={msg.id}>
              {/* Show text content before the card if any */}
              {msg.content && (
                <div className="group mb-2">
                  <AiChatBubble
                    role="assistant"
                    content={msg.content}
                    createdAt={msg.createdAt}
                    messageId={msg.id}
                    userRating={msg.metadata?.userRating}
                    onRate={onRateMessage}
                  />
                </div>
              )}
              <AiChatProfileCard
                candidateUserId={msg.metadata.candidateUserId}
                locale={locale}
              />
            </div>
          );
        }

        // Regular text message (including action confirmations, no_more_candidates, etc.)
        return (
          <div key={msg.id} className="group">
            <AiChatBubble
              role={msg.role as 'user' | 'assistant' | 'matchmaker'}
              content={msg.content}
              createdAt={msg.createdAt}
              messageId={msg.id}
              userRating={msg.metadata?.userRating}
              onRate={msg.role === 'assistant' ? onRateMessage : undefined}
            />
          </div>
        );
      })}

      {/* Streaming message */}
      {isStreaming && streamingContent && (
        <div className="group">
          <AiChatBubble
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        </div>
      )}

      {/* Typing indicator */}
      {isStreaming && !streamingContent && (
        <div className="flex items-center gap-2 text-gray-400 pr-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs">
            {isHebrew ? 'חושב/ת...' : 'Thinking...'}
          </span>
        </div>
      )}

      {/* Smart assistant action buttons (interested/not_for_me/tell_me_more) */}
      {actionButtons && actionButtons.length > 0 && !isStreaming && onChatAction && (
        <AiChatActionButtons
          buttons={actionButtons}
          locale={locale}
          onAction={onChatAction}
          disabled={actionExecuting}
        />
      )}

      {/* Legacy action buttons (approve/decline for existing suggestions) */}
      {pendingActions && pendingActions.length > 0 && !isStreaming && (
        <div className="flex gap-2 justify-center py-2">
          {pendingActions.map((action) => (
            <button
              key={action.type}
              onClick={() => onAction?.(action)}
              disabled={actionExecuting}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-sm hover:shadow-md active:scale-95',
                action.variant === 'positive'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white',
              )}
            >
              {action.variant === 'positive' ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              {isHebrew ? action.label.he : action.label.en}
            </button>
          ))}
        </div>
      )}

      {/* Quick reply chips */}
      {quickReplies && quickReplies.length > 0 && !isStreaming && messages.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center py-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => onQuickReply?.(reply)}
              className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200 active:scale-95"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
