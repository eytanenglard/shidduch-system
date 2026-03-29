// src/components/suggestions/chat/AiChatBubble.tsx
// =============================================================================
// Single chat message bubble component
// =============================================================================

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, UserCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * Parse inline markdown formatting (bold, italic) into React elements.
 */
function parseInlineMarkdown(text: string, keyPrefix: string = ''): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={`${keyPrefix}b${match.index}`} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`${keyPrefix}i${match.index}`}>{match[3]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Parse markdown text into React elements.
 * Supports: **bold**, *italic*, bullet lists (- / •), numbered lists (1.), and blockquote-style quotes ("...").
 */
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Bullet list item (- or • at start)
    if (/^[-•]\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const curr = lines[i].trimStart();
        if (!/^[-•]\s+/.test(curr)) break;
        const content = curr.replace(/^[-•]\s+/, '');
        listItems.push(
          <li key={`li${i}`} className="mr-3">{parseInlineMarkdown(content, `li${i}`)}</li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul${i}`} className="list-disc list-inside my-1 space-y-0.5">{listItems}</ul>
      );
      continue;
    }

    // Numbered list item (1. 2. etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const curr = lines[i].trimStart();
        if (!/^\d+\.\s+/.test(curr)) break;
        const content = curr.replace(/^\d+\.\s+/, '');
        listItems.push(
          <li key={`oli${i}`} className="mr-3">{parseInlineMarkdown(content, `oli${i}`)}</li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol${i}`} className="list-decimal list-inside my-1 space-y-0.5">{listItems}</ol>
      );
      continue;
    }

    // Regular line — parse inline markdown
    if (i > 0) elements.push('\n');
    elements.push(...parseInlineMarkdown(line, `ln${i}`));
    i++;
  }

  return elements;
}

const EMOJI_REACTIONS = ['❤️', '😊', '🤔', '👏'] as const;

interface AiChatBubbleProps {
  role: 'user' | 'assistant' | 'matchmaker';
  content: string;
  createdAt?: string;
  isStreaming?: boolean;
  messageId?: string;
  userRating?: 'up' | 'down';
  userReaction?: string;
  onRate?: (messageId: string, rating: 'up' | 'down') => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export default function AiChatBubble({
  role,
  content,
  createdAt,
  isStreaming,
  messageId,
  userRating,
  userReaction,
  onRate,
  onReact,
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
              ? 'bg-teal-600 text-white'
              : 'bg-violet-600 text-white'
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : isMatchmaker ? <UserCheck className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-100 text-violet-900 rounded-tr-md'
            : isMatchmaker
              ? 'bg-teal-50 border border-teal-200 text-gray-800 rounded-tl-md shadow-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm',
          isStreaming && 'animate-pulse motion-reduce:animate-none'
        )}
      >
        {/* Text rendering with basic markdown support */}
        <div className="whitespace-pre-wrap break-words">
          {useMemo(() => parseMarkdown(content), [content])}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse motion-reduce:animate-none mr-0.5 align-middle rounded-sm" />
          )}
        </div>

        {/* Timestamp and rating on hover */}
        {createdAt && (
          <div className="flex items-center gap-2 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                {/* Emoji quick reactions */}
                <div className="flex items-center gap-0.5 mr-1 border-r border-gray-200 pr-1">
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => { e.stopPropagation(); onReact?.(messageId, emoji); }}
                      className={cn(
                        'text-[11px] w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center transition-all',
                        userReaction === emoji ? 'bg-violet-100 scale-110' : 'opacity-60 hover:opacity-100',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active reaction badge */}
        {userReaction && (
          <div className="absolute -bottom-2 end-2 bg-white border border-gray-200 rounded-full px-1 py-0.5 shadow-sm text-xs">
            {userReaction}
          </div>
        )}
      </div>
    </div>
  );
}
