// src/components/messages/SuggestionChat.tsx
//
// Chat view for a specific match suggestion.
// Uses shared ChatArea + ChatInput + hooks for consistency with direct chat.

'use client';

import React, { useState, useCallback } from 'react';
import { useChatSSE, type SSEMessage } from '@/hooks/useChatSSE';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatArea from './ChatArea';
import ChatInput from './ChatInput';

interface SuggestionChatProps {
  suggestionId: string;
  locale: 'he' | 'en';
  /** Compact mode: no header, shorter height — for embedding inside modal tabs */
  compact?: boolean;
  /** Optional header info — if not provided, header is hidden */
  header?: {
    title: string;
    subtitle?: string;
  };
  /** CSS class overrides */
  className?: string;
  /** Height class override, default h-[500px] */
  heightClass?: string;
}

export default function SuggestionChat({
  suggestionId,
  locale,
  compact = false,
  header,
  className,
  heightClass,
}: SuggestionChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const isHe = locale === 'he';
  const endpoint = `/api/suggestions/${suggestionId}/chat`;

  // Shared hooks
  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    addMessageFromSSE,
  } = useChatMessages({
    endpoint,
    enabled: !!suggestionId,
    pollInterval: 12000,
    locale,
  });

  const { typingUser, onRemoteTyping, notifyTyping } = useTypingIndicator({
    conversationId: suggestionId,
    conversationType: 'suggestion',
  });

  // SSE for real-time updates
  const handleSSENewMessage = useCallback(
    (message: SSEMessage) => {
      if (
        message.conversationId === suggestionId &&
        message.conversationType === 'suggestion'
      ) {
        addMessageFromSSE({
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderType: message.senderType as 'user' | 'matchmaker' | 'system',
          senderName: message.senderName || '',
          isRead: false,
          createdAt: new Date().toISOString(),
          isMine: false,
        });
      }
    },
    [suggestionId, addMessageFromSSE]
  );

  const { isConnected, isPolling } = useChatSSE({
    streamUrl: '/api/messages/stream',
    pollUrl: endpoint,
    pollInterval: 12000,
    enabled: !!suggestionId,
    onNewMessage: handleSSENewMessage,
    onTyping: onRemoteTyping,
  });

  // Send handler
  const handleSend = useCallback(async () => {
    if (!newMessage.trim()) return;
    const content = newMessage;
    setNewMessage('');
    await sendMessage(content);
  }, [newMessage, sendMessage]);

  const containerHeight = heightClass || (compact ? 'h-[420px]' : 'h-[500px]');

  return (
    <div
      className={cn(
        'flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm',
        className
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Header — optional */}
      {header && !compact && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-teal-50 to-cyan-50/40 border-b border-gray-100">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {header.title}
            </p>
            {header.subtitle && (
              <p className="text-xs text-gray-500">{header.subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Chat area with messages */}
      <ChatArea
        messages={messages}
        isLoading={isLoading}
        locale={locale}
        typingUser={typingUser}
        isConnected={isConnected}
        isPolling={isPolling}
        heightClass={containerHeight}
        emptySubtitle={
          isHe
            ? 'שלח/י הודעה לשדכן/ית כדי להתחיל שיחה על ההצעה'
            : 'Send a message to your matchmaker to start a conversation'
        }
      />

      {/* Input area */}
      <ChatInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
        onTyping={notifyTyping}
        isSending={isSending}
        locale={locale}
        placeholder={
          isHe ? 'כתוב/י הודעה לשדכן/ית...' : 'Type a message...'
        }
      />
    </div>
  );
}
