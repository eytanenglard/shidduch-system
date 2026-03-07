// src/components/messages/UserChatPanel.tsx
//
// ✅ OPTIMIZED:
//   - Chat list polling pauses when a chat is open (תיקון 4)
//   - loadChats dependency is stable (no re-render loops)
//   - onUnreadUpdate wrapped in ref to avoid callback identity changes

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  Inbox,
  Clock,
  User,
  Heart,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { Locale } from '../../../i18n-config';
import SuggestionChat from '@/components/messages/SuggestionChat';

// ==========================================
// Types
// ==========================================

interface ChatSummary {
  id: string;
  type: 'direct' | 'suggestion';
  title: string;
  subtitle?: string;
  matchmakerName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageIsMine?: boolean;
  unreadCount: number;
  suggestionId?: string;
  status?: string;
}

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

interface UserChatPanelProps {
  locale: Locale;
  onUnreadUpdate?: (count: number) => void;
}

// ==========================================
// Helpers
// ==========================================

function formatTime(dateStr: string | undefined, locale: Locale) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const loc = locale === 'he' ? he : enUS;
  if (isToday(date)) return format(date, 'HH:mm', { locale: loc });
  if (isYesterday(date)) return locale === 'he' ? 'אתמול' : 'Yesterday';
  return format(date, 'dd/MM', { locale: loc });
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

// ==========================================
// Component
// ==========================================

export default function UserChatPanel({
  locale,
  onUnreadUpdate,
}: UserChatPanelProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  // ==========================================
  // ✅ Stable ref for onUnreadUpdate to avoid re-creating loadChats
  // ==========================================
  const onUnreadUpdateRef = useRef(onUnreadUpdate);
  useEffect(() => {
    onUnreadUpdateRef.current = onUnreadUpdate;
  }, [onUnreadUpdate]);

  // ==========================================
  // Smart auto-scroll refs (for direct chat only)
  // ==========================================
  const prevMessageCountRef = useRef(0);
  const userScrolledUpRef = useRef(false);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // ==========================================
  // Track if user scrolled up (for direct chat)
  // ==========================================
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    userScrolledUpRef.current = !isAtBottom;
  }, []);

  // ==========================================
  // Load chat list
  // ✅ No dependency on onUnreadUpdate (uses ref instead)
  // ==========================================

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/chats');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
        onUnreadUpdateRef.current?.(data.totalUnread || 0);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // ==========================================
  // ✅ Visibility-aware polling for chat list
  //    Pauses when a chat is open (selectedChatId !== null)
  // ==========================================
  useEffect(() => {
    loadChats();
    let interval: NodeJS.Timeout | null = null;

    const start = () => {
      // ✅ Don't poll the list when user is inside a specific chat
      if (selectedChatId) return;
      interval = setInterval(loadChats, 30000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        loadChats();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadChats, selectedChatId]);

  // ==========================================
  // Load messages for direct chat only
  // ==========================================

  const loadDirectMessages = useCallback(async () => {
    if (!selectedChatId || selectedChatId !== 'direct') return;

    try {
      const res = await fetch('/api/messages/direct');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading direct messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (selectedChatId === 'direct') {
      setIsLoadingMessages(true);
      loadDirectMessages();
      // Mark as read
      fetch('/api/messages/direct', { method: 'PATCH' }).catch(console.error);
    }
  }, [selectedChatId, loadDirectMessages]);

  // Visibility-aware polling for direct messages
  useEffect(() => {
    if (!selectedChatId || selectedChatId !== 'direct') return;

    let interval: NodeJS.Timeout | null = null;
    const start = () => {
      interval = setInterval(loadDirectMessages, 12000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        loadDirectMessages();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [selectedChatId, loadDirectMessages]);

  // Smart auto-scroll for direct chat
  useEffect(() => {
    if (!scrollRef.current || selectedChatId !== 'direct') return;

    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (isNewMessage && !userScrolledUpRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChatId]);

  // ==========================================
  // Send direct message (optimistic)
  // ==========================================

  const handleSendDirect = async () => {
    if (!newMessage.trim() || isSending || selectedChatId !== 'direct') return;

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
      const res = await fetch('/api/messages/direct', {
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
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      console.error('Send error:', error);
      toast.error(isHe ? 'שגיאה בשליחת ההודעה' : 'Error sending message');
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendDirect();
    }
  };

  const openChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMessages([]);
    prevMessageCountRef.current = 0;
    userScrolledUpRef.current = false;
  };

  const closeChat = () => {
    setSelectedChatId(null);
    setMessages([]);
    prevMessageCountRef.current = 0;
    userScrolledUpRef.current = false;
    loadChats(); // Refresh unread counts
  };

  // ==========================================
  // Render — Chat View (when a chat is selected)
  // ==========================================

  if (selectedChat) {
    // ========================================
    // Suggestion chats — use shared SuggestionChat component
    // ========================================
    if (selectedChat.type === 'suggestion' && selectedChat.id !== 'direct') {
      return (
        <Card className="shadow-lg border-0 overflow-hidden bg-white">
          {/* Chat Header with back button */}
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50/40 border-b py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeChat}
                className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-teal-50"
              >
                {isHe ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
                {isHe ? 'חזרה' : 'Back'}
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2.5">
                <Avatar className="w-9 h-9 shadow-sm ring-2 ring-white">
                  <AvatarFallback className="text-white text-xs font-bold bg-gradient-to-br from-teal-400 to-cyan-500">
                    {getInitials(selectedChat.title)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {selectedChat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isHe ? 'שדכן/ית:' : 'Matchmaker:'}{' '}
                    {selectedChat.matchmakerName}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Shared SuggestionChat component — same data source as the modal */}
          <SuggestionChat
            suggestionId={selectedChat.id}
            locale={locale}
            compact
            heightClass="h-[450px]"
          />
        </Card>
      );
    }

    // ========================================
    // Direct chat — keep inline implementation
    // ========================================
    return (
      <Card className="shadow-lg border-0 overflow-hidden bg-white">
        {/* Chat Header */}
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50/40 border-b py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-teal-50"
            >
              {isHe ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
              {isHe ? 'חזרה' : 'Back'}
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 shadow-sm ring-2 ring-white">
                <AvatarFallback className="text-white text-xs font-bold bg-gradient-to-br from-purple-400 to-pink-500">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selectedChat.matchmakerName}
                </p>
                <p className="text-xs text-gray-500">
                  {isHe
                    ? 'שיחה כללית עם השדכן/ית'
                    : 'General chat with matchmaker'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Direct Messages */}
        <CardContent className="p-0">
          <div className="flex flex-col h-[500px]">
            <ScrollArea
              className="flex-1 px-4"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-teal-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 mb-1">
                    {isHe ? 'אין הודעות עדיין' : 'No messages yet'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isHe
                      ? 'שלח/י הודעה כדי להתחיל שיחה'
                      : 'Send a message to start the conversation'}
                  </p>
                </div>
              ) : (
                <div className="py-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        msg.isMine ? 'justify-end' : 'justify-start',
                        msg.senderType === 'system' && 'justify-center'
                      )}
                    >
                      {msg.senderType === 'system' ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                          <Bot className="w-3 h-3" />
                          {msg.content}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                            msg.isMine
                              ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md',
                            msg.id.startsWith('temp-') && 'opacity-70'
                          )}
                        >
                          {!msg.isMine && (
                            <p
                              className={cn(
                                'text-xs font-semibold mb-1',
                                msg.senderType === 'matchmaker'
                                  ? 'text-purple-600'
                                  : 'text-teal-600'
                              )}
                            >
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                          <p
                            className={cn(
                              'text-[10px] mt-1',
                              msg.isMine ? 'text-white/70' : 'text-gray-400'
                            )}
                          >
                            {format(new Date(msg.createdAt), 'HH:mm', {
                              locale: isHe ? he : enUS,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t bg-gray-50/50 p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isHe ? 'כתוב/י הודעה...' : 'Type a message...'}
                  className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl border-gray-200 focus:border-teal-300 focus:ring-teal-200"
                  rows={1}
                  dir={isHe ? 'rtl' : 'ltr'}
                />
                <Button
                  onClick={handleSendDirect}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md flex-shrink-0"
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
        </CardContent>
      </Card>
    );
  }

  // ==========================================
  // Render — Chat List (no chat selected)
  // ==========================================

  if (isLoadingList) {
    return (
      <Card className="shadow-lg border-0 bg-white/80">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50/40 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isHe ? 'השיחות שלי' : 'My Conversations'}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {isHe
                  ? 'שיחות עם השדכן/ית שלך'
                  : 'Conversations with your matchmaker'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadChats}
            className="text-gray-500 hover:text-teal-600"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-1 font-medium">
              {isHe ? 'אין שיחות עדיין' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400">
              {isHe
                ? 'כשתקבל/י הצעה, תוכל/י לשוחח עם השדכן/ית כאן'
                : "When you receive a suggestion, you'll be able to chat here"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y divide-gray-100">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  className="w-full px-5 py-4 flex items-center gap-3.5 hover:bg-gray-50/80 transition-colors text-start"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12 shadow-sm ring-2 ring-white">
                      <AvatarFallback
                        className={cn(
                          'text-white font-bold bg-gradient-to-br',
                          chat.type === 'direct'
                            ? 'from-purple-400 to-pink-500'
                            : 'from-teal-400 to-cyan-500'
                        )}
                      >
                        {chat.type === 'direct' ? (
                          <User className="w-5 h-5" />
                        ) : (
                          getInitials(chat.title)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {chat.type === 'suggestion' && (
                      <div className="absolute -bottom-0.5 -end-1 p-0.5 bg-white rounded-full shadow">
                        <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {chat.type === 'direct'
                          ? isHe
                            ? `💬 שיחה עם ${chat.matchmakerName}`
                            : `💬 Chat with ${chat.matchmakerName}`
                          : chat.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {chat.lastMessageTime && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTime(chat.lastMessageTime, locale)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subtitle */}
                    <p className="text-xs text-gray-400 mb-0.5">
                      {chat.type === 'direct'
                        ? isHe
                          ? 'שיחה כללית'
                          : 'General chat'
                        : `${isHe ? 'שדכן/ית:' : 'Matchmaker:'} ${chat.matchmakerName}`}
                    </p>

                    {/* Last message preview */}
                    {chat.lastMessage ? (
                      <p className="text-xs text-gray-500 truncate">
                        {chat.lastMessageIsMine && (
                          <span className="text-teal-600 font-medium">
                            {isHe ? 'אני: ' : 'Me: '}
                          </span>
                        )}
                        {truncate(chat.lastMessage, 60)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        {isHe ? 'לחץ/י לפתיחת שיחה' : 'Tap to open chat'}
                      </p>
                    )}
                  </div>

                  {/* Unread badge + Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {chat.unreadCount > 0 && (
                      <Badge className="bg-teal-500 text-white text-xs px-2 py-0.5 border-0 shadow-sm animate-pulse">
                        {chat.unreadCount}
                      </Badge>
                    )}
                    <ChevronLeft className="w-4 h-4 text-gray-300 rtl:-scale-x-100" />
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
