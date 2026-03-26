// src/components/messages/ChatBubble.tsx
//
// Shared chat message bubble with WhatsApp-style features:
// - Sender name, timestamp, SVG read receipts
// - WhatsApp-style tail (hidden when grouped)
// - System message variant
// - Optimistic (temp) message dimming
// - Reactions (picker + bar)
// - Image/voice message rendering
// - Emoji-only message enlargement
// - URL detection and linking
// - Accessibility attributes
// - Message grouping support

'use client';

import React, { useState, useMemo } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { ChatMessage, MessageReaction } from '@/hooks/useChatMessages';
import ReactionPicker from './ReactionPicker';

// ==========================================
// SVG Read Receipts
// ==========================================

function SingleCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 11"
      width="16"
      height="11"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11.07 0.73l-7.07 7.07-2.77-2.77a1 1 0 0 0-1.41 1.41l3.47 3.47a1 1 0 0 0 1.42 0l7.78-7.78a1 1 0 0 0-1.42-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function DoubleCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 11"
      width="20"
      height="11"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15.07 0.73l-7.07 7.07-0.73-0.73a1 1 0 0 0-1.42 1.42l1.44 1.44a1 1 0 0 0 1.42 0l7.78-7.78a1 1 0 0 0-1.42-1.42z"
        fill="currentColor"
      />
      <path
        d="M11.07 0.73l-7.07 7.07-2.77-2.77a1 1 0 0 0-1.41 1.41l3.47 3.47a1 1 0 0 0 1.42 0l7.78-7.78a1 1 0 0 0-1.42-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

// ==========================================
// Helpers
// ==========================================

const URL_REGEX =
  /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

/** Check if content is 1-3 emoji only (no other text) */
function isEmojiOnly(text: string): boolean {
  // Strip zero-width joiners, variation selectors, etc. for counting
  const emojiRegex =
    /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,3}$/u;
  return emojiRegex.test(text.trim());
}

/** Render text with clickable URLs */
function renderLinkedText(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const matches = [...text.matchAll(URL_REGEX)];
  if (matches.length === 0) return text;

  for (const match of matches) {
    const url = match[0];
    const start = match.index!;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url;
    }

    parts.push(
      <a
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-1 hover:opacity-80 transition-opacity break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url.length > 60 ? `${hostname}/…` : url}
      </a>
    );
    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

// ==========================================
// ReactionsBar (inline sub-component)
// ==========================================

function ReactionsBar({
  reactions,
  currentUserId,
  messageId,
  chatType,
  isMine,
  onReactionsChange,
}: {
  reactions: MessageReaction[];
  currentUserId: string;
  messageId: string;
  chatType: 'direct' | 'suggestion';
  isMine: boolean;
  onReactionsChange?: (messageId: string, reactions: MessageReaction[]) => void;
}) {
  if (!reactions || reactions.length === 0) return null;

  const grouped = reactions.reduce<
    Record<string, { count: number; userReacted: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userReacted: false };
    acc[r.emoji].count += 1;
    if (r.userId === currentUserId) acc[r.emoji].userReacted = true;
    return acc;
  }, {});

  const handleClick = async (emoji: string, userReacted: boolean) => {
    try {
      const url = `/api/messages/${messageId}/reactions?messageType=${chatType}`;
      const res = await fetch(url, {
        method: userReacted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        onReactionsChange?.(messageId, data.reactions || []);
      }
    } catch (error) {
      console.error('[ReactionsBar] Error:', error);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 mt-1',
        isMine ? 'justify-end' : 'justify-start'
      )}
    >
      {Object.entries(grouped).map(([emoji, { count, userReacted }]) => (
        <button
          key={emoji}
          onClick={() => handleClick(emoji, userReacted)}
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
            'border transition-colors cursor-pointer',
            userReacted
              ? 'bg-teal-50 border-teal-300 text-teal-700'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
          )}
          aria-label={`${emoji} ${count}`}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px]">{count}</span>}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// ChatBubble Props
// ==========================================

interface ChatBubbleProps {
  message: ChatMessage;
  locale: 'he' | 'en';
  /** Grouped with previous message from same sender — hide name & tail, tighter spacing */
  isGrouped?: boolean;
  /** Last message in a group — show tail */
  isLastInGroup?: boolean;
  /** For reactions: 'direct' or 'suggestion' */
  chatType?: 'direct' | 'suggestion';
  /** Current user ID for reactions */
  currentUserId?: string;
  /** Callback when reactions change */
  onReactionsChange?: (messageId: string, reactions: MessageReaction[]) => void;
}

// ==========================================
// Component
// ==========================================

export default function ChatBubble({
  message,
  locale,
  isGrouped = false,
  isLastInGroup = true,
  chatType = 'direct',
  currentUserId,
  onReactionsChange,
}: ChatBubbleProps) {
  const isHe = locale === 'he';
  const msg = message;
  const [hovered, setHovered] = useState(false);
  const isTemp = msg.id.startsWith('temp-');
  const contentType = msg.messageType || 'TEXT';

  const emojiOnly = useMemo(
    () => contentType === 'TEXT' && isEmojiOnly(msg.content),
    [contentType, msg.content]
  );

  // System message — centered pill
  if (msg.senderType === 'system') {
    return (
      <div className="flex items-center justify-center my-3" role="status">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm max-w-[85%]">
          <Bot className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-center">{msg.content}</span>
        </div>
      </div>
    );
  }

  const showTail = isLastInGroup && !isGrouped;

  // Regular message bubble
  return (
    <div
      className={cn(
        'flex group',
        msg.isMine ? 'justify-end' : 'justify-start',
        isGrouped ? 'mb-0.5' : 'mb-1'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-label={
        isHe
          ? `הודעה מ${msg.isMine ? 'אותך' : msg.senderName}`
          : `Message from ${msg.isMine ? 'you' : msg.senderName}`
      }
    >
      {/* Reaction picker — appears on hover for own messages */}
      {msg.isMine && currentUserId && hovered && !isTemp && (
        <div className="flex items-center me-1 animate-in fade-in duration-150">
          <ReactionPicker
            messageId={msg.id}
            messageType={chatType}
            currentUserId={currentUserId}
            reactions={msg.reactions || []}
            onReactionChange={(reactions) =>
              onReactionsChange?.(msg.id, reactions)
            }
            isHe={isHe}
            className="opacity-100"
          />
        </div>
      )}

      <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
        <div
          className={cn(
            'relative px-3.5 py-2 shadow-sm',
            // Emoji-only: no background, larger text
            emojiOnly
              ? 'bg-transparent shadow-none px-1 py-0'
              : msg.isMine
                ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                : 'bg-white text-gray-800',
            // Rounded corners with tail
            !emojiOnly && msg.isMine
              ? showTail
                ? isHe
                  ? 'rounded-2xl rounded-tl-md'
                  : 'rounded-2xl rounded-tr-md'
                : 'rounded-2xl'
              : !emojiOnly
                ? showTail
                  ? isHe
                    ? 'rounded-2xl rounded-tr-md'
                    : 'rounded-2xl rounded-tl-md'
                  : 'rounded-2xl'
                : '',
            isTemp && 'opacity-70'
          )}
        >
          {/* Sender name for incoming messages (hidden when grouped) */}
          {!msg.isMine && msg.senderName && !isGrouped && !emojiOnly && (
            <p
              className={cn(
                'text-xs font-bold mb-1',
                msg.senderType === 'matchmaker'
                  ? 'text-purple-600'
                  : 'text-teal-600'
              )}
            >
              {msg.senderName}
            </p>
          )}

          {/* Content by type */}
          {contentType === 'IMAGE' && msg.mediaUrl ? (
            <div className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={msg.mediaUrl}
                alt={isHe ? 'תמונה בהודעה' : 'Image in message'}
                className="rounded-lg max-w-[280px] max-h-[300px] object-cover cursor-pointer"
                loading="lazy"
                onClick={() => {
                  if (msg.mediaUrl) window.open(msg.mediaUrl, '_blank');
                }}
              />
              {msg.content && (
                <p className="text-[14px] whitespace-pre-wrap leading-relaxed break-words">
                  {renderLinkedText(msg.content)}
                </p>
              )}
            </div>
          ) : contentType === 'VOICE' && msg.mediaUrl ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-70">
                  {isHe ? 'הודעה קולית' : 'Voice message'}
                </span>
              </div>
              <audio
                controls
                preload="metadata"
                className="max-w-[240px] h-8"
                src={msg.mediaUrl}
              />
              {msg.content && (
                <p className="text-[14px] whitespace-pre-wrap leading-relaxed break-words">
                  {renderLinkedText(msg.content)}
                </p>
              )}
            </div>
          ) : emojiOnly ? (
            <span className="text-4xl leading-none" role="img">
              {msg.content}
            </span>
          ) : (
            <p className="text-[14px] whitespace-pre-wrap leading-relaxed break-words">
              {renderLinkedText(msg.content)}
            </p>
          )}

          {/* Timestamp + read receipt */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              msg.isMine ? 'justify-end' : 'justify-start',
              emojiOnly && 'mt-0.5'
            )}
          >
            <span
              className={cn(
                'text-[10px]',
                emojiOnly
                  ? 'text-gray-400'
                  : msg.isMine
                    ? 'text-white/70'
                    : 'text-gray-400'
              )}
            >
              {format(new Date(msg.createdAt), 'HH:mm', {
                locale: isHe ? he : enUS,
              })}
            </span>
            {msg.isMine && !isTemp && (
              msg.isRead ? (
                <DoubleCheck className="text-sky-300" />
              ) : (
                <SingleCheck
                  className={cn(
                    emojiOnly ? 'text-gray-400' : 'text-white/60'
                  )}
                />
              )
            )}
          </div>

          {/* WhatsApp-style tail */}
          {showTail && !emojiOnly && (
            <div
              className={cn(
                'absolute top-0 w-3 h-3 overflow-hidden',
                msg.isMine
                  ? isHe
                    ? '-left-1.5'
                    : '-right-1.5'
                  : isHe
                    ? '-right-1.5'
                    : '-left-1.5'
              )}
              aria-hidden="true"
            >
              <div
                className={cn(
                  'w-4 h-4 transform rotate-45 origin-bottom-right',
                  msg.isMine ? 'bg-teal-500' : 'bg-white'
                )}
                style={{
                  marginTop: '2px',
                  ...(msg.isMine
                    ? isHe
                      ? { marginRight: '6px' }
                      : { marginLeft: '6px' }
                    : isHe
                      ? { marginLeft: '6px' }
                      : { marginRight: '6px' }),
                }}
              />
            </div>
          )}
        </div>

        {/* Reactions bar */}
        {currentUserId && msg.reactions && msg.reactions.length > 0 && (
          <ReactionsBar
            reactions={msg.reactions}
            currentUserId={currentUserId}
            messageId={msg.id}
            chatType={chatType}
            isMine={msg.isMine}
            onReactionsChange={onReactionsChange}
          />
        )}
      </div>

      {/* Reaction picker — appears on hover for incoming messages */}
      {!msg.isMine && currentUserId && hovered && !isTemp && (
        <div className="flex items-center ms-1 animate-in fade-in duration-150">
          <ReactionPicker
            messageId={msg.id}
            messageType={chatType}
            currentUserId={currentUserId}
            reactions={msg.reactions || []}
            onReactionChange={(reactions) =>
              onReactionsChange?.(msg.id, reactions)
            }
            isHe={isHe}
            className="opacity-100"
          />
        </div>
      )}
    </div>
  );
}
