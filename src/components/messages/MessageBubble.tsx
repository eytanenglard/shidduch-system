// src/components/messages/MessageBubble.tsx

'use client';

import React, { useState } from 'react';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactionPicker, { type Reaction } from './ReactionPicker';

// ==========================================
// Types
// ==========================================

export type MessageContentType = 'TEXT' | 'IMAGE' | 'VOICE';

export interface MessageBubbleData {
  id: string;
  content: string;
  messageType: MessageContentType;
  mediaUrl?: string | null;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'matchmaker' | 'system';
  isMine: boolean;
  isRead: boolean;
  isPinned: boolean;
  reactions: Reaction[];
  createdAt: string;
}

interface MessageBubbleProps {
  message: MessageBubbleData;
  /** "direct" or "suggestion" — passed to reaction/pin APIs */
  chatType: 'direct' | 'suggestion';
  /** Current user ID */
  currentUserId: string;
  /** RTL mode */
  isHe?: boolean;
  /** Time string already formatted */
  formattedTime: string;
  /** Callback when reactions change */
  onReactionsChange?: (messageId: string, reactions: Reaction[]) => void;
  /** Callback when pin is toggled */
  onPinToggle?: (messageId: string, isPinned: boolean) => void;
  /** Show sender avatar/name (useful for group-style chats) */
  showSender?: boolean;
  /** Additional class */
  className?: string;
}

// ==========================================
// i18n
// ==========================================

const dict = {
  he: {
    pinned: 'נעוץ',
    togglePin: 'נעץ/בטל נעיצה',
    imageAlt: 'תמונה בהודעה',
    voiceMessage: 'הודעה קולית',
  },
  en: {
    pinned: 'Pinned',
    togglePin: 'Toggle pin',
    imageAlt: 'Image in message',
    voiceMessage: 'Voice message',
  },
};

// ==========================================
// Sub-components
// ==========================================

/** Render grouped reactions below the bubble */
function ReactionsBar({
  reactions,
  currentUserId,
  messageId,
  chatType,
  isHe,
  onReactionsChange,
}: {
  reactions: Reaction[];
  currentUserId: string;
  messageId: string;
  chatType: 'direct' | 'suggestion';
  isHe: boolean;
  onReactionsChange?: (messageId: string, reactions: Reaction[]) => void;
}) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji with counts
  const grouped = reactions.reduce<Record<string, { count: number; userReacted: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { count: 0, userReacted: false };
      }
      acc[r.emoji].count += 1;
      if (r.userId === currentUserId) {
        acc[r.emoji].userReacted = true;
      }
      return acc;
    },
    {}
  );

  const handleReactionClick = async (emoji: string, userReacted: boolean) => {
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
    <div className={cn('flex flex-wrap gap-1 mt-1', isHe ? 'justify-end' : 'justify-start')}>
      {Object.entries(grouped).map(([emoji, { count, userReacted }]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji, userReacted)}
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
            'border transition-colors cursor-pointer',
            userReacted
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/50 border-border hover:bg-muted'
          )}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px]">{count}</span>}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// Main component
// ==========================================

export default function MessageBubble({
  message,
  chatType,
  currentUserId,
  isHe = false,
  formattedTime,
  onReactionsChange,
  onPinToggle,
  showSender = false,
  className,
}: MessageBubbleProps) {
  const t = isHe ? dict.he : dict.en;
  const [isPinLoading, setIsPinLoading] = useState(false);

  const { isMine, senderType } = message;
  const isSystem = senderType === 'system';

  // Handle pin toggle
  const handlePinToggle = async () => {
    if (isPinLoading) return;
    setIsPinLoading(true);

    try {
      const url = `/api/messages/${message.id}/pin?messageType=${chatType}`;
      const res = await fetch(url, { method: 'PATCH' });

      if (res.ok) {
        const data = await res.json();
        onPinToggle?.(message.id, data.isPinned);
      }
    } catch (error) {
      console.error('[MessageBubble] Pin toggle error:', error);
    } finally {
      setIsPinLoading(false);
    }
  };

  // System messages — centered, muted
  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-2', className)}>
        <div className="bg-muted/60 text-muted-foreground text-xs px-3 py-1.5 rounded-full max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-2 mb-2 px-2',
        isMine ? (isHe ? 'flex-row' : 'flex-row-reverse') : (isHe ? 'flex-row-reverse' : 'flex-row'),
        className
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Avatar — only shown for non-mine messages with showSender */}
      {showSender && !isMine && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="text-xs bg-muted">
            {message.senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble container */}
      <div
        className={cn(
          'flex flex-col max-w-[75%]',
          isMine ? (isHe ? 'items-start' : 'items-end') : (isHe ? 'items-end' : 'items-start')
        )}
      >
        {/* Pin indicator */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-amber-600 mb-0.5">
            <Pin className="h-2.5 w-2.5" />
            <span>{t.pinned}</span>
          </div>
        )}

        {/* Sender name (when showSender and not mine) */}
        {showSender && !isMine && (
          <span className="text-xs text-muted-foreground mb-0.5 px-1">
            {message.senderName}
          </span>
        )}

        {/* Message bubble + hover actions wrapper */}
        <div className="flex items-end gap-1">
          {/* Hover action buttons — shown on the opposite side */}
          {isMine && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ReactionPicker
                messageId={message.id}
                messageType={chatType}
                currentUserId={currentUserId}
                reactions={message.reactions}
                onReactionChange={(reactions) =>
                  onReactionsChange?.(message.id, reactions)
                }
                isHe={isHe}
              />
              <Button
                variant="ghost"
                size="xs"
                className="h-6 w-6 p-0"
                onClick={handlePinToggle}
                disabled={isPinLoading}
                aria-label={t.togglePin}
              >
                <Pin
                  className={cn(
                    'h-3.5 w-3.5',
                    message.isPinned ? 'text-amber-600' : 'text-muted-foreground'
                  )}
                />
              </Button>
            </div>
          )}

          {/* The bubble */}
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
              isMine
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm',
              isHe && isMine && 'rounded-br-2xl rounded-bl-sm',
              isHe && !isMine && 'rounded-bl-2xl rounded-br-sm'
            )}
          >
            {/* Content by type */}
            {message.messageType === 'IMAGE' && message.mediaUrl ? (
              <div className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.mediaUrl}
                  alt={t.imageAlt}
                  className="rounded-lg max-w-[280px] max-h-[300px] object-cover cursor-pointer"
                  loading="lazy"
                  onClick={() => {
                    if (message.mediaUrl) {
                      window.open(message.mediaUrl, '_blank');
                    }
                  }}
                />
                {message.content && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
            ) : message.messageType === 'VOICE' && message.mediaUrl ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-70">{t.voiceMessage}</span>
                </div>
                <audio
                  controls
                  preload="metadata"
                  className="max-w-[240px] h-8"
                  src={message.mediaUrl}
                />
                {message.content && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Time */}
            <div
              className={cn(
                'text-[10px] mt-1 opacity-60',
                isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {formattedTime}
            </div>
          </div>

          {/* Hover action buttons for received messages */}
          {!isMine && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ReactionPicker
                messageId={message.id}
                messageType={chatType}
                currentUserId={currentUserId}
                reactions={message.reactions}
                onReactionChange={(reactions) =>
                  onReactionsChange?.(message.id, reactions)
                }
                isHe={isHe}
              />
              <Button
                variant="ghost"
                size="xs"
                className="h-6 w-6 p-0"
                onClick={handlePinToggle}
                disabled={isPinLoading}
                aria-label={t.togglePin}
              >
                <Pin
                  className={cn(
                    'h-3.5 w-3.5',
                    message.isPinned ? 'text-amber-600' : 'text-muted-foreground'
                  )}
                />
              </Button>
            </div>
          )}
        </div>

        {/* Reactions bar */}
        <ReactionsBar
          reactions={message.reactions}
          currentUserId={currentUserId}
          messageId={message.id}
          chatType={chatType}
          isHe={isHe}
          onReactionsChange={onReactionsChange}
        />
      </div>

      {/* Spacer for mine messages without avatar */}
      {showSender && isMine && <div className="w-7 shrink-0" />}
    </div>
  );
}
