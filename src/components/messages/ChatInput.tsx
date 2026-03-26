// src/components/messages/ChatInput.tsx
//
// Shared chat input with auto-expanding textarea, Enter-to-send, and typing notification.

'use client';

import React, { useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  isSending: boolean;
  locale: 'he' | 'en';
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onTyping,
  isSending,
  locale,
  placeholder,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      onTyping?.();
    },
    [onChange, onTyping]
  );

  // Refocus textarea after send
  const handleSendClick = useCallback(() => {
    onSend();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [onSend]);

  return (
    <div className="border-t border-gray-100 bg-gray-50/80 p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (isHe ? 'כתוב/י הודעה...' : 'Type a message...')
          }
          className={cn(
            'flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl',
            'border-gray-200 bg-white focus:border-teal-300 focus:ring-teal-200',
            'text-sm placeholder:text-gray-400'
          )}
          rows={1}
          dir={isHe ? 'rtl' : 'ltr'}
        />
        <Button
          onClick={handleSendClick}
          disabled={!value.trim() || isSending}
          size="icon"
          className={cn(
            'h-11 w-11 rounded-full flex-shrink-0 shadow-md',
            'bg-gradient-to-br from-teal-500 to-teal-600',
            'hover:from-teal-600 hover:to-teal-700',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className={cn('w-4 h-4', isHe && '-scale-x-100')} />
          )}
        </Button>
      </div>
    </div>
  );
}
