// =============================================================================
// 26. UserChatPanel — Chat sidebar + active chat view
// File: src/components/messages/UserChatPanel.tsx
// =============================================================================
//
// Two-pane layout:
//   Left: list of chats (direct + per-suggestion)
//   Right: active chat view
//
// Mobile: shows one pane at a time with back button
// =============================================================================

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

export default function UserChatPanel({ locale }: UserChatPanelProps) {
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

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // ==========================================
  // Load chat list
  // ==========================================

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/chats');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, [loadChats]);

  // ==========================================
  // Load messages for selected chat
  // ==========================================

  const loadMessages = useCallback(async () => {
    if (!selectedChatId) return;

    try {
      const endpoint =
        selectedChatId === 'direct'
          ? '/api/messages/direct'
          : `/api/suggestions/${selectedChatId}/chat`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      setIsLoadingMessages(true);
      loadMessages();
      // Mark as read
      const endpoint =
        selectedChatId === 'direct'
          ? '/api/messages/direct'
          : `/api/suggestions/${selectedChatId}/chat`;
      fetch(endpoint, { method: 'PATCH' }).catch(console.error);
    }
  }, [selectedChatId, loadMessages]);

  // Poll messages when chat is open
  useEffect(() => {
    if (!selectedChatId) return;
    const interval = setInterval(loadMessages, 12000);
    return () => clearInterval(interval);
  }, [selectedChatId, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ==========================================
  // Send message
  // ==========================================

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !selectedChatId) return;
    setIsSending(true);

    try {
      const endpoint =
        selectedChatId === 'direct'
          ? '/api/messages/direct'
          : `/api/suggestions/${selectedChatId}/chat`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error(isHe ? 'שגיאה בשליחת ההודעה' : 'Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMessages([]);
  };

  const closeChat = () => {
    setSelectedChatId(null);
    setMessages([]);
    loadChats(); // Refresh unread counts
  };

  // ==========================================
  // Render — Chat View (when a chat is selected)
  // ==========================================

  if (selectedChat) {
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
                <AvatarFallback
                  className={cn(
                    'text-white text-xs font-bold bg-gradient-to-br',
                    selectedChat.type === 'direct'
                      ? 'from-purple-400 to-pink-500'
                      : 'from-teal-400 to-cyan-500'
                  )}
                >
                  {selectedChat.type === 'direct' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    getInitials(selectedChat.title)
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selectedChat.type === 'direct'
                    ? selectedChat.matchmakerName
                    : selectedChat.title}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedChat.type === 'direct'
                    ? isHe
                      ? 'שיחה כללית עם השדכן/ית'
                      : 'General chat with matchmaker'
                    : `${isHe ? 'שדכן/ית:' : 'Matchmaker:'} ${selectedChat.matchmakerName}`}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="p-0">
          <div className="flex flex-col h-[500px]">
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
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
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
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
                  onClick={handleSend}
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
  // Render — Chat List
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
                {isHe ? 'שיחות עם השדכן/ית שלך' : 'Conversations with your matchmaker'}
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
              {isHe ? "אין שיחות עדיין" : 'No conversations yet'}
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
