// src/components/messages/UserChatPanel.tsx
//
// User's main chat panel — shows chat list + direct/suggestion chat views.
// Uses shared ChatArea, ChatInput, and hooks for consistency.

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatSSE, type SSEMessage } from '@/hooks/useChatSSE';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Clock,
  User,
  Heart,
  RefreshCw,
  Search,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { Locale } from '../../../i18n-config';
import SuggestionChat from '@/components/messages/SuggestionChat';
import ChatArea from './ChatArea';
import ChatInput from './ChatInput';
import ChatSearch from './ChatSearch';

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
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isHe = locale === 'he';

  // Stable ref for onUnreadUpdate to avoid re-creating loadChats
  const onUnreadUpdateRef = useRef(onUnreadUpdate);
  useEffect(() => {
    onUnreadUpdateRef.current = onUnreadUpdate;
  }, [onUnreadUpdate]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // ==========================================
  // Direct chat — shared hooks
  // ==========================================
  const isDirectChatOpen = selectedChatId === 'direct';

  const {
    messages: directMessages,
    isLoading: isLoadingDirect,
    isSending: isSendingDirect,
    sendMessage: sendDirectMessage,
    addMessageFromSSE: addDirectMessageFromSSE,
  } = useChatMessages({
    endpoint: '/api/messages/direct',
    enabled: isDirectChatOpen,
    pollInterval: 12000,
    locale,
  });

  const {
    typingUser: directTypingUser,
    onRemoteTyping: onDirectRemoteTyping,
    notifyTyping: notifyDirectTyping,
  } = useTypingIndicator({
    conversationId: 'direct',
    conversationType: 'direct',
  });

  // ==========================================
  // SSE integration for real-time updates
  // ==========================================
  const loadChatsRef = useRef<(() => void) | null>(null);

  const handleSSENewMessage = useCallback(
    (message: SSEMessage) => {
      if (isDirectChatOpen && message.conversationType === 'direct') {
        addDirectMessageFromSSE({
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
      loadChatsRef.current?.();
    },
    [isDirectChatOpen, addDirectMessageFromSSE]
  );

  const handleSSETyping = useCallback(
    (data: { conversationId: string; userId: string; userName: string }) => {
      if (isDirectChatOpen) {
        onDirectRemoteTyping(data);
      }
    },
    [isDirectChatOpen, onDirectRemoteTyping]
  );

  const { isConnected, isPolling } = useChatSSE({
    streamUrl: '/api/messages/stream',
    pollUrl: isDirectChatOpen ? '/api/messages/direct' : '/api/messages/chats',
    pollInterval: isDirectChatOpen ? 12000 : 30000,
    enabled: true,
    onNewMessage: handleSSENewMessage,
    onTyping: handleSSETyping,
  });

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
        onUnreadUpdateRef.current?.(data.totalUnread || 0);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadChatsRef.current = loadChats;
  }, [loadChats]);

  // Visibility-aware polling for chat list (pauses when a chat is open)
  useEffect(() => {
    loadChats();
    let interval: NodeJS.Timeout | null = null;

    const start = () => {
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
  // Direct chat send handler
  // ==========================================
  const handleSendDirect = useCallback(async () => {
    if (!newMessage.trim()) return;
    const content = newMessage;
    setNewMessage('');
    await sendDirectMessage(content);
  }, [newMessage, sendDirectMessage]);

  // ==========================================
  // Navigation
  // ==========================================
  const openChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setNewMessage('');
  };

  const closeChat = () => {
    setSelectedChatId(null);
    setNewMessage('');
    loadChats();
  };

  const handleSearchResultClick = (
    _messageId: string,
    conversationId: string,
    conversationType: 'direct' | 'suggestion'
  ) => {
    setIsSearchOpen(false);
    if (conversationType === 'direct') {
      openChat('direct');
    } else {
      openChat(conversationId);
    }
  };

  // ==========================================
  // Render — Chat View (when a chat is selected)
  // ==========================================

  if (selectedChat) {
    // Suggestion chats — use shared SuggestionChat component
    if (selectedChat.type === 'suggestion' && selectedChat.id !== 'direct') {
      return (
        <Card className="shadow-lg border-0 overflow-hidden bg-white">
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

          <SuggestionChat
            suggestionId={selectedChat.id}
            locale={locale}
            compact
            heightClass="h-[450px]"
          />
        </Card>
      );
    }

    // Direct chat — using shared ChatArea + ChatInput
    return (
      <Card className="shadow-lg border-0 overflow-hidden bg-white">
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

        <CardContent className="p-0">
          <ChatArea
            messages={directMessages}
            isLoading={isLoadingDirect}
            locale={locale}
            typingUser={directTypingUser}
            isConnected={isConnected}
            isPolling={isPolling}
            heightClass="h-[440px]"
            emptySubtitle={
              isHe
                ? 'שלח/י הודעה כדי להתחיל שיחה'
                : 'Send a message to start the conversation'
            }
          />

          <ChatInput
            value={newMessage}
            onChange={setNewMessage}
            onSend={handleSendDirect}
            onTyping={notifyDirectTyping}
            isSending={isSendingDirect}
            locale={locale}
          />
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchOpen((p) => !p)}
              className={cn(
                'text-gray-500 hover:text-teal-600',
                isSearchOpen && 'text-teal-600 bg-teal-50'
              )}
              aria-label={isHe ? 'חיפוש בהודעות' : 'Search messages'}
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadChats}
              className="text-gray-500 hover:text-teal-600"
              aria-label={isHe ? 'רענון' : 'Refresh'}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Slide-down search */}
      <ChatSearch
        open={isSearchOpen}
        searchUrl="/api/messages/search"
        isHe={isHe}
        onResultClick={handleSearchResultClick}
      />

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
                      <Badge className="bg-teal-500 text-white text-xs px-2 py-0.5 border-0 shadow-sm animate-zoom-in">
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
