// src/components/messages/ChatArea.tsx
//
// Shared chat message area with WhatsApp-style background, date separators,
// message bubbles, typing indicator, scroll-to-bottom button, and connection status.
// Supports message grouping (consecutive same-sender), accessibility, and reactions.

'use client';

import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, MessageReaction } from '@/hooks/useChatMessages';
import { useSmartScroll } from '@/hooks/useSmartScroll';
import ChatBubble from './ChatBubble';
import DateSeparator, { shouldShowDateSeparator } from './DateSeparator';
import TypingBubble from './TypingBubble';
import ScrollToBottom from './ScrollToBottom';
import ConnectionStatus from './ConnectionStatus';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  locale: 'he' | 'en';
  /** Name of user currently typing, or null */
  typingUser?: string | null;
  /** SSE connection state */
  isConnected?: boolean;
  isPolling?: boolean;
  /** Height class override */
  heightClass?: string;
  /** Empty state text overrides */
  emptyTitle?: string;
  emptySubtitle?: string;
  /** For reactions support */
  chatType?: 'direct' | 'suggestion';
  currentUserId?: string;
  onReactionsChange?: (messageId: string, reactions: MessageReaction[]) => void;
}

const CHAT_BG_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e5eb' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

/**
 * Check if a message should be grouped with the previous one
 * (same sender, same type, within 2 minutes, no date separator between)
 */
function shouldGroup(
  messages: ChatMessage[],
  index: number,
  dateParts: string[]
): boolean {
  if (index === 0) return false;
  const curr = messages[index];
  const prev = messages[index - 1];

  // Don't group system messages
  if (curr.senderType === 'system' || prev.senderType === 'system')
    return false;

  // Same sender
  if (curr.senderId !== prev.senderId) return false;

  // Within 2 minutes
  const timeDiff =
    new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  if (timeDiff > 2 * 60 * 1000) return false;

  // No date separator between them
  if (shouldShowDateSeparator(dateParts, index)) return false;

  return true;
}

export default function ChatArea({
  messages,
  isLoading,
  locale,
  typingUser = null,
  isConnected = true,
  isPolling = false,
  heightClass = 'h-[min(500px,60vh)]',
  emptyTitle,
  emptySubtitle,
  chatType = 'direct',
  currentUserId,
  onReactionsChange,
}: ChatAreaProps) {
  const isHe = locale === 'he';
  const {
    scrollRef,
    handleScroll,
    isScrolledUp,
    newMessageCount,
    scrollToBottom,
    onMessagesChanged,
  } = useSmartScroll();

  // Trigger auto-scroll logic when messages change
  useEffect(() => {
    onMessagesChanged(messages.length);
  }, [messages.length, onMessagesChanged]);

  const dateParts = messages.map((m) => m.createdAt);

  // Pre-compute grouping info
  const groupingInfo = messages.map((_, index) => {
    const isGrouped = shouldGroup(messages, index, dateParts);
    const isLastInGroup =
      index === messages.length - 1 ||
      !shouldGroup(messages, index + 1, dateParts);
    return { isGrouped, isLastInGroup };
  });

  return (
    <div className="relative flex flex-col">
      {/* Connection status banner */}
      <ConnectionStatus
        isConnected={isConnected}
        isPolling={isPolling}
        locale={locale}
      />

      {/* Scrollable messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label={isHe ? 'הודעות שיחה' : 'Chat messages'}
        className={cn(
          'flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent',
          heightClass,
          'bg-[#f0f2f5]'
        )}
        style={{ backgroundImage: CHAT_BG_PATTERN }}
      >
        {isLoading ? (
          <div className="flex flex-col justify-end h-full py-4 px-2 gap-3" role="status" aria-label={isHe ? 'טוען הודעות...' : 'Loading messages...'}>
            {/* Skeleton message bubbles */}
            <div className="flex justify-start">
              <div className="w-3/5 max-w-[240px] h-10 rounded-2xl rounded-bl-sm bg-white/70 animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="w-2/5 max-w-[180px] h-10 rounded-2xl rounded-br-sm bg-teal-100/70 animate-pulse" />
            </div>
            <div className="flex justify-start">
              <div className="w-1/2 max-w-[200px] h-14 rounded-2xl rounded-bl-sm bg-white/70 animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="w-3/5 max-w-[240px] h-10 rounded-2xl rounded-br-sm bg-teal-100/70 animate-pulse" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-in fade-in-0 duration-500">
            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-teal-400" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1.5 text-base">
              {emptyTitle || (isHe ? 'אין הודעות עדיין' : 'No messages yet')}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              {emptySubtitle ||
                (isHe
                  ? 'שלח/י הודעה כדי להתחיל שיחה'
                  : 'Send a message to start the conversation')}
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-0.5">
            {messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                {shouldShowDateSeparator(dateParts, index) && (
                  <DateSeparator dateStr={msg.createdAt} locale={locale} />
                )}
                <ChatBubble
                  message={msg}
                  locale={locale}
                  isGrouped={groupingInfo[index].isGrouped}
                  isLastInGroup={groupingInfo[index].isLastInGroup}
                  chatType={chatType}
                  currentUserId={currentUserId}
                  onReactionsChange={onReactionsChange}
                />
              </React.Fragment>
            ))}

            {/* Typing indicator as last bubble */}
            {typingUser && (
              <TypingBubble userName={typingUser} locale={locale} />
            )}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottom
        visible={isScrolledUp}
        newMessageCount={newMessageCount}
        onClick={() => scrollToBottom(true)}
        locale={locale}
      />
    </div>
  );
}
