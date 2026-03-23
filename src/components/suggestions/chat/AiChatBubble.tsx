// src/components/suggestions/chat/AiChatBubble.tsx
// =============================================================================
// Single chat message bubble component
// =============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface AiChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isStreaming?: boolean;
}

export default function AiChatBubble({
  role,
  content,
  createdAt,
  isStreaming,
}: AiChatBubbleProps) {
  const isUser = role === 'user';

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
            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-100 text-violet-900 rounded-tr-md'
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

        {/* Timestamp on hover */}
        {createdAt && (
          <div className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(createdAt).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
