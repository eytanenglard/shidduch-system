// src/components/suggestions/chat/AiChatMessages.tsx
// =============================================================================
// Scrollable message list with auto-scroll
// =============================================================================

'use client';

import React, { useRef, useEffect } from 'react';
import AiChatBubble from './AiChatBubble';
import type { ChatMessage } from './useAiChat';
import { Loader2 } from 'lucide-react';

interface AiChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isLoading: boolean;
  locale: 'he' | 'en';
}

export default function AiChatMessages({
  messages,
  isStreaming,
  streamingContent,
  isLoading,
  locale,
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
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            {isHebrew ? 'שלום! אני העוזר החכם שלך' : 'Hi! I\'m your smart assistant'}
          </h3>
          <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
            {isHebrew
              ? 'ספר/י לי מה חשוב לך בבן/בת זוג, ואני אעזור לדייק את ההצעות שלך'
              : 'Tell me what matters to you in a partner, and I\'ll help refine your suggestions'}
          </p>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {(isHebrew
              ? [
                  'מה אני מחפש/ת?',
                  'למה דחיתי הצעות?',
                  'חפש לי התאמות',
                ]
              : [
                  'What am I looking for?',
                  'Why did I decline suggestions?',
                  'Find me matches',
                ]
            ).map((prompt) => (
              <button
                key={prompt}
                className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200"
                onClick={() => {
                  // Dispatch custom event for the input to pick up
                  window.dispatchEvent(new CustomEvent('ai-chat-quick-prompt', { detail: prompt }));
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <div key={msg.id} className="group">
          <AiChatBubble
            role={msg.role}
            content={msg.content}
            createdAt={msg.createdAt}
          />
        </div>
      ))}

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
    </div>
  );
}
