// src/components/suggestions/chat/AiChatInput.tsx
// =============================================================================
// Chat input field with send button
// =============================================================================

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  locale: 'he' | 'en';
  placeholder?: string;
}

export default function AiChatInput({
  onSend,
  isStreaming,
  locale,
  placeholder,
}: AiChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHebrew = locale === 'he';

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Auto-resize textarea
  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  // Listen for quick prompt events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') {
        setValue(detail);
        // Auto-send after a tiny delay to let state update
        setTimeout(() => {
          onSend(detail);
          setValue('');
        }, 50);
      }
    };
    window.addEventListener('ai-chat-quick-prompt', handler);
    return () => window.removeEventListener('ai-chat-quick-prompt', handler);
  }, [onSend]);

  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (isHebrew ? 'כתוב/כתבי הודעה...' : 'Type a message...')}
          className={cn(
            'flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent',
            'max-h-[120px] min-h-[38px]',
            'text-right',
          )}
          rows={1}
          maxLength={2000}
          disabled={isStreaming}
          dir="auto"
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all',
            value.trim() && !isStreaming
              ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className={cn('w-4 h-4', isHebrew && 'rotate-180')} />
          )}
        </button>
      </div>
    </div>
  );
}
