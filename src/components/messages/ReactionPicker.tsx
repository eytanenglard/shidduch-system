// src/components/messages/ReactionPicker.tsx

'use client';

import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// Types
// ==========================================

interface ReactionPickerProps {
  /** Message ID to react to */
  messageId: string;
  /** "direct" or "suggestion" — determines which API path to hit */
  messageType: 'direct' | 'suggestion';
  /** Current user ID — used to check if already reacted */
  currentUserId: string;
  /** Existing reactions on this message */
  reactions?: Reaction[];
  /** Callback after reaction is added/removed */
  onReactionChange?: (reactions: Reaction[]) => void;
  /** RTL mode */
  isHe?: boolean;
  /** Additional class */
  className?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

const EMOJI_OPTIONS = ['❤️', '👍', '😊', '😂', '🙏'];

// ==========================================
// Component
// ==========================================

export default function ReactionPicker({
  messageId,
  messageType,
  currentUserId,
  reactions = [],
  onReactionChange,
  isHe = false,
  className,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hasUserReactedWith = (emoji: string) =>
    reactions.some((r) => r.emoji === emoji && r.userId === currentUserId);

  const handleEmojiClick = async (emoji: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const alreadyReacted = hasUserReactedWith(emoji);

    try {
      const url = `/api/messages/${messageId}/reactions?messageType=${messageType}`;
      const res = await fetch(url, {
        method: alreadyReacted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('[ReactionPicker] Error:', data.error);
        return;
      }

      const data = await res.json();
      onReactionChange?.(data.reactions || []);
      setIsOpen(false);
    } catch (error) {
      console.error('[ReactionPicker] Network error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
            className
          )}
          aria-label={isHe ? 'הוסף תגובה' : 'Add reaction'}
        >
          <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={isHe ? 'left' : 'right'}
        align="center"
        className="w-auto p-1.5"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        <div className="flex gap-1">
          {EMOJI_OPTIONS.map((emoji) => {
            const active = hasUserReactedWith(emoji);
            return (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                disabled={isLoading}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-md text-lg',
                  'hover:bg-accent transition-colors cursor-pointer',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  active && 'bg-accent ring-1 ring-primary/30'
                )}
                aria-label={emoji}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
