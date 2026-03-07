// src/components/messages/SuggestionChat.tsx

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MessageCircle, Loader2, Send, Bot } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

// ==========================================
// Types
// ==========================================

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'matchmaker' | 'system';
  senderName: string;
  isRead: boolean;
  createdAt: string;
  isMine: boolean;
}

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

// ==========================================
// Helpers
// ==========================================

function formatMessageTime(dateStr: string, locale: 'he' | 'en') {
  const date = new Date(dateStr);
  return format(date, 'HH:mm', { locale: locale === 'he' ? he : enUS });
}

function formatDateSeparator(dateStr: string, locale: 'he' | 'en'): string {
  const date = new Date(dateStr);
  const loc = locale === 'he' ? he : enUS;

  if (isToday(date)) return locale === 'he' ? 'היום' : 'Today';
  if (isYesterday(date)) return locale === 'he' ? 'אתמול' : 'Yesterday';
  return format(date, locale === 'he' ? 'EEEE, d בMMMM' : 'EEEE, MMMM d', {
    locale: loc,
  });
}

function shouldShowDateSeparator(
  messages: ChatMessage[],
  index: number
): boolean {
  if (index === 0) return true;
  const current = new Date(messages[index].createdAt);
  const previous = new Date(messages[index - 1].createdAt);
  return !isSameDay(current, previous);
}

// ==========================================
// Component
// ==========================================

export default function SuggestionChat({
  suggestionId,
  locale,
  compact = false,
  header,
  className,
  heightClass,
}: SuggestionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCountRef = useRef(0);
  const userScrolledUpRef = useRef(false);

  const isHe = locale === 'he';

  // ==========================================
  // Track scroll position
  // ==========================================
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    userScrolledUpRef.current = !isAtBottom;
  }, []);

  // ==========================================
  // Scroll to bottom
  // ==========================================
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollRef.current) return;
    if (force || !userScrolledUpRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, []);

  // ==========================================
  // Load messages
  // ==========================================
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/chat`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    setMessages([]);
    prevMessageCountRef.current = 0;
    userScrolledUpRef.current = false;
    loadMessages();
  }, [suggestionId, loadMessages]);

  // Mark as read on mount
  useEffect(() => {
    if (suggestionId) {
      fetch(`/api/suggestions/${suggestionId}/chat`, { method: 'PATCH' }).catch(
        console.error
      );
    }
  }, [suggestionId]);

  // Polling with visibility awareness
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const start = () => {
      interval = setInterval(loadMessages, 12000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        loadMessages();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadMessages]);

  // Smart auto-scroll
  useEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    const isInitialLoad =
      prevMessageCountRef.current === 0 && messages.length > 0;
    prevMessageCountRef.current = messages.length;

    if (isInitialLoad) {
      scrollToBottom(true);
    } else if (isNewMessage) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // ==========================================
  // Send message (optimistic)
  // ==========================================
  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      content: newMessage.trim(),
      senderId: '',
      senderType: 'user',
      senderName: '',
      isRead: false,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    userScrolledUpRef.current = false;

    setIsSending(true);
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimisticMsg.content }),
      });

      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(isHe ? 'שגיאה בשליחת ההודעה' : 'Error sending message');
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ==========================================
  // Render
  // ==========================================

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

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent',
          containerHeight,
          // WhatsApp-style chat background
          'bg-[#f0f2f5]'
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e5eb' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {isHe ? 'טוען הודעות...' : 'Loading messages...'}
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-5">
              <MessageCircle className="w-10 h-10 text-teal-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2 text-lg">
              {isHe ? 'אין הודעות עדיין' : 'No messages yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              {isHe
                ? 'שלח/י הודעה לשדכן/ית כדי להתחיל שיחה על ההצעה'
                : 'Send a message to your matchmaker to start a conversation'}
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-1">
            {messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                {/* Date separator */}
                {shouldShowDateSeparator(messages, index) && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
                      <span className="text-xs font-medium text-gray-500">
                        {formatDateSeparator(msg.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                )}

                {/* System message */}
                {msg.senderType === 'system' ? (
                  <div className="flex items-center justify-center my-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm max-w-[85%]">
                      <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-center">{msg.content}</span>
                    </div>
                  </div>
                ) : (
                  /* Regular message bubble */
                  <div
                    className={cn(
                      'flex mb-1',
                      msg.isMine ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'relative max-w-[80%] sm:max-w-[70%] px-3.5 py-2 shadow-sm',
                        msg.isMine
                          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl rounded-br-md'
                          : 'bg-white text-gray-800 rounded-2xl rounded-bl-md',
                        // Dim temp messages
                        msg.id.startsWith('temp-') && 'opacity-70'
                      )}
                    >
                      {/* Sender name for non-mine messages */}
                      {!msg.isMine && msg.senderName && (
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

                      {/* Message content */}
                      <p className="text-[14px] whitespace-pre-wrap leading-relaxed break-words">
                        {msg.content}
                      </p>

                      {/* Timestamp */}
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-1',
                          msg.isMine ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <span
                          className={cn(
                            'text-[10px]',
                            msg.isMine ? 'text-white/70' : 'text-gray-400'
                          )}
                        >
                          {formatMessageTime(msg.createdAt, locale)}
                        </span>
                        {/* Read receipt for mine */}
                        {msg.isMine && !msg.id.startsWith('temp-') && (
                          <span className="text-[10px] text-white/70">
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>

                      {/* WhatsApp-style tail */}
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
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 bg-gray-50/80 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isHe ? 'כתוב/י הודעה לשדכן/ית...' : 'Type a message...'
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
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
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
    </div>
  );
}
