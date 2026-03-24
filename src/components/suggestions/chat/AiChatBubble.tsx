// src/components/suggestions/chat/AiChatBubble.tsx
// =============================================================================
// Single chat message bubble component
// =============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, UserCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AiChatBubbleProps {
  role: 'user' | 'assistant' | 'matchmaker';
  content: string;
  createdAt?: string;
  isStreaming?: boolean;
  messageId?: string;
  userRating?: 'up' | 'down';
  onRate?: (messageId: string, rating: 'up' | 'down') => void;
}

export default function AiChatBubble({
  role,
  content,
  createdAt,
  isStreaming,
  messageId,
  userRating,
  onRate,
}: AiChatBubbleProps) {
  const isUser = role === 'user';
  const isMatchmaker = role === 'matchmaker';

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[90%]',
        isUser ? 'mr-0 ml-auto flex-row-reverse' : 'ml-0 mr-auto'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1',
          isUser
            ? 'bg-violet-100 text-violet-600'
            : isMatchmaker
              ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
              : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : isMatchmaker ? <UserCheck className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-100 text-violet-900 rounded-tr-md'
            : isMatchmaker
              ? 'bg-teal-50 border border-teal-200 text-gray-800 rounded-tl-md shadow-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm',
          isStreaming && 'animate-pulse'
        )}
      >
        {/* Simple text rendering - supports line breaks */}
        <div className="whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse mr-0.5 align-middle rounded-sm" />
          )}
        </div>

        {/* Timestamp and rating on hover */}
        {createdAt && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-gray-400">
              {new Date(createdAt).toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {/* Rating buttons for assistant messages */}
            {!isUser && !isStreaming && messageId && onRate && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onRate(messageId, 'up'); }}
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    userRating === 'up'
                      ? 'text-emerald-500'
                      : 'text-gray-300 hover:text-emerald-500',
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRate(messageId, 'down'); }}
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    userRating === 'down'
                      ? 'text-rose-500'
                      : 'text-gray-300 hover:text-rose-500',
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
