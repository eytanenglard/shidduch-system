// src/components/suggestions/chat/AiChatInput.tsx
// =============================================================================
// Chat input field with send button and voice input
// =============================================================================

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  locale: 'he' | 'en';
  placeholder?: string;
}

// Check if SpeechRecognition is available
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SR = (window as unknown as Record<string, unknown>).SpeechRecognition
    || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return SR as (new () => any) | undefined;
};

export default function AiChatInput({
  onSend,
  isStreaming,
  locale,
  placeholder,
}: AiChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isHebrew = locale === 'he';
  const hasVoiceSupport = typeof window !== 'undefined' && !!getSpeechRecognition();

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
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

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SRClass = getSpeechRecognition();
    if (!SRClass) return;

    const recognition = new SRClass();
    recognition.lang = isHebrew ? 'he-IL' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, isHebrew]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Listen for quick prompt events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') {
        setValue(detail);
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
        {/* Voice input button */}
        {hasVoiceSupport && (
          <button
            onClick={toggleVoice}
            disabled={isStreaming}
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all',
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              isStreaming && 'opacity-50 cursor-not-allowed',
            )}
            title={isListening ? (isHebrew ? 'עצור הקלטה' : 'Stop recording') : (isHebrew ? 'הקלט הודעה' : 'Voice input')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? (isHebrew ? 'מקשיב...' : 'Listening...')
              : placeholder || (isHebrew ? 'כתוב/כתבי הודעה...' : 'Type a message...')
          }
          className={cn(
            'flex-1 resize-none rounded-xl border px-3 py-2 text-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent',
            'max-h-[120px] min-h-[38px]',
            'text-right',
            isListening ? 'border-red-300 bg-red-50/30' : 'border-gray-200',
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
