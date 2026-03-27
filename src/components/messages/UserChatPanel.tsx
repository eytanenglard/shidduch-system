// src/components/messages/UserChatPanel.tsx
//
// User's main chat panel — shows chat list + direct/suggestion chat views.
// Features: skeleton loading, unread highlights, quick filters, rich previews,
// split view on desktop, improved empty state.

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Heart,
  RefreshCw,
  Search,
  Image as ImageIcon,
  Mic,
  Info,
  Sparkles,
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
  lastMessageType?: 'TEXT' | 'IMAGE' | 'VOICE' | 'SYSTEM';
  unreadCount: number;
  suggestionId?: string;
  status?: string;
}

interface UserChatPanelProps {
  locale: Locale;
  onUnreadUpdate?: (count: number) => void;
}

type ChatFilter = 'all' | 'unread' | 'suggestions' | 'direct';

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

/** Rich preview prefix for non-text messages */
function getMessagePreview(
  chat: ChatSummary,
  isHe: boolean
): { icon?: React.ReactNode; text: string } {
  if (chat.lastMessageType === 'IMAGE') {
    return {
      icon: <ImageIcon className="w-3 h-3 inline-block me-0.5 opacity-60" />,
      text: isHe ? 'תמונה' : 'Photo',
    };
  }
  if (chat.lastMessageType === 'VOICE') {
    return {
      icon: <Mic className="w-3 h-3 inline-block me-0.5 opacity-60" />,
      text: isHe ? 'הודעה קולית' : 'Voice message',
    };
  }
  if (chat.lastMessageType === 'SYSTEM') {
    return {
      icon: <Info className="w-3 h-3 inline-block me-0.5 opacity-60" />,
      text: chat.lastMessage ? truncate(chat.lastMessage, 50) : (isHe ? 'עדכון מערכת' : 'System update'),
    };
  }
  return { text: chat.lastMessage ? truncate(chat.lastMessage, 60) : '' };
}

// ==========================================
// Skeleton Loading
// ==========================================

function ChatListSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-5 py-4 flex items-center gap-3.5 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex justify-between">
              <div className="h-3.5 bg-gray-200 rounded-full w-32" />
              <div className="h-3 bg-gray-100 rounded-full w-10" />
            </div>
            <div className="h-3 bg-gray-100 rounded-full w-24" />
            <div className="h-3 bg-gray-100 rounded-full w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// Filter Pills
// ==========================================

function ChatFilterPills({
  active,
  onChange,
  unreadCount,
  isHe,
}: {
  active: ChatFilter;
  onChange: (f: ChatFilter) => void;
  unreadCount: number;
  isHe: boolean;
}) {
  const filters: { key: ChatFilter; label: string }[] = [
    { key: 'all', label: isHe ? 'הכל' : 'All' },
    { key: 'unread', label: isHe ? 'לא נקראו' : 'Unread' },
    { key: 'suggestions', label: isHe ? 'הצעות' : 'Suggestions' },
    { key: 'direct', label: isHe ? 'כללי' : 'Direct' },
  ];

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
            active === key
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {label}
          {key === 'unread' && unreadCount > 0 && (
            <span
              className={cn(
                'ms-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold',
                active === 'unread'
                  ? 'bg-white/30 text-white'
                  : 'bg-teal-500 text-white'
              )}
            >
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// Chat Row Item
// ==========================================

function ChatRow({
  chat,
  isHe,
  locale,
  onClick,
  isSelected,
}: {
  chat: ChatSummary;
  isHe: boolean;
  locale: Locale;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const isUnread = chat.unreadCount > 0;
  const preview = getMessagePreview(chat, isHe);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-5 py-4 flex items-center gap-3.5 transition-colors text-start',
        isUnread
          ? 'bg-teal-50/50 hover:bg-teal-50/80'
          : 'hover:bg-gray-50/80',
        isSelected && 'bg-teal-50 ring-1 ring-inset ring-teal-200'
      )}
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
          <p
            className={cn(
              'text-sm truncate',
              isUnread
                ? 'font-bold text-gray-900'
                : 'font-semibold text-gray-800'
            )}
          >
            {chat.type === 'direct'
              ? isHe
                ? `שיחה עם ${chat.matchmakerName}`
                : `Chat with ${chat.matchmakerName}`
              : chat.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {chat.lastMessageTime && (
              <span
                className={cn(
                  'text-[10px] flex items-center gap-0.5',
                  isUnread ? 'text-teal-600 font-semibold' : 'text-gray-400'
                )}
              >
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

        {/* Last message preview — rich */}
        {preview.text ? (
          <p
            className={cn(
              'text-xs truncate',
              isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
            )}
          >
            {chat.lastMessageIsMine && chat.lastMessageType !== 'SYSTEM' && (
              <span className="text-teal-600 font-medium">
                {isHe ? 'אני: ' : 'Me: '}
              </span>
            )}
            {preview.icon}
            {preview.text}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">
            {isHe ? 'לחץ/י לפתיחת שיחה' : 'Tap to open chat'}
          </p>
        )}
      </div>

      {/* Unread badge + Arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isUnread && (
          <Badge className="bg-teal-500 text-white text-xs px-2 py-0.5 border-0 shadow-sm animate-zoom-in">
            {chat.unreadCount}
          </Badge>
        )}
        {isHe ? (
          <ChevronLeft className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        )}
      </div>
    </button>
  );
}

// ==========================================
// Empty State
// ==========================================

function EmptyState({ isHe }: { isHe: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center shadow-inner">
          <MessageCircle className="w-9 h-9 text-teal-300" />
        </div>
        <div className="absolute -top-1 -end-1 w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <h3 className="text-base font-bold text-gray-700 mb-1.5">
        {isHe ? 'עוד אין שיחות' : 'No conversations yet'}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        {isHe
          ? 'ברגע שתקבל/י הצעת שידוך, תוכל/י לשוחח עם השדכן/ית שלך כאן. שב/י בנוח, אנחנו עובדים בשבילך!'
          : "Once you receive a match suggestion, you'll be able to chat with your matchmaker here. Sit tight — we're working for you!"}
      </p>
    </div>
  );
}

// ==========================================
// Main Component
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
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const isHe = locale === 'he';

  // Stable ref for onUnreadUpdate to avoid re-creating loadChats
  const onUnreadUpdateRef = useRef(onUnreadUpdate);
  useEffect(() => {
    onUnreadUpdateRef.current = onUnreadUpdate;
  }, [onUnreadUpdate]);

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  // ==========================================
  // Filtered chats
  // ==========================================
  const totalUnread = useMemo(
    () => chats.reduce((sum, c) => sum + c.unreadCount, 0),
    [chats]
  );

  const filteredChats = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return chats.filter((c) => c.unreadCount > 0);
      case 'suggestions':
        return chats.filter((c) => c.type === 'suggestion');
      case 'direct':
        return chats.filter((c) => c.type === 'direct');
      default:
        return chats;
    }
  }, [chats, activeFilter]);

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
  // Chat View Component (reused in both mobile & split)
  // ==========================================
  const renderChatView = () => {
    if (!selectedChat) return null;

    // Suggestion chats
    if (selectedChat.type === 'suggestion' && selectedChat.id !== 'direct') {
      return (
        <Card className="shadow-lg border-0 overflow-hidden bg-white h-full" dir={isHe ? 'rtl' : 'ltr'}>
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50/40 border-b py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeChat}
                className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-teal-50 lg:hidden"
              >
                {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {isHe ? 'חזרה' : 'Back'}
              </Button>
              <div className="h-6 w-px bg-gray-200 lg:hidden" />
              <div className="flex items-center gap-2.5">
                <Avatar className="w-9 h-9 shadow-sm ring-2 ring-white">
                  <AvatarFallback className="text-white text-xs font-bold bg-gradient-to-br from-teal-400 to-cyan-500">
                    {getInitials(selectedChat.title)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selectedChat.title}</p>
                  <p className="text-xs text-gray-500">
                    {isHe ? 'שדכן/ית:' : 'Matchmaker:'} {selectedChat.matchmakerName}
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

    // Direct chat
    return (
      <Card className="shadow-lg border-0 overflow-hidden bg-white h-full" dir={isHe ? 'rtl' : 'ltr'}>
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50/40 border-b py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-teal-50 lg:hidden"
            >
              {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isHe ? 'חזרה' : 'Back'}
            </Button>
            <div className="h-6 w-px bg-gray-200 lg:hidden" />
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 shadow-sm ring-2 ring-white">
                <AvatarFallback className="text-white text-xs font-bold bg-gradient-to-br from-purple-400 to-pink-500">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{selectedChat.matchmakerName}</p>
                <p className="text-xs text-gray-500">
                  {isHe ? 'שיחה כללית עם השדכן/ית' : 'General chat with matchmaker'}
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
              isHe ? 'שלח/י הודעה כדי להתחיל שיחה' : 'Send a message to start the conversation'
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
  };

  // ==========================================
  // Chat List Component (reused in both mobile & split)
  // ==========================================
  const renderChatList = (isSplitMode = false) => (
    <Card
      className={cn(
        'shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm',
        isSplitMode && 'h-full'
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
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

      {/* Quick Filters */}
      {chats.length > 0 && (
        <ChatFilterPills
          active={activeFilter}
          onChange={setActiveFilter}
          unreadCount={totalUnread}
          isHe={isHe}
        />
      )}

      <CardContent className="p-0">
        {isLoadingList ? (
          <ChatListSkeleton />
        ) : chats.length === 0 ? (
          <EmptyState isHe={isHe} />
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-sm text-gray-500 mb-1">
              {isHe ? 'אין שיחות בסינון הנוכחי' : 'No chats match this filter'}
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-teal-600 hover:underline mt-1"
            >
              {isHe ? 'הצג הכל' : 'Show all'}
            </button>
          </div>
        ) : (
          <ScrollArea className={cn(isSplitMode ? 'h-[calc(100%-1px)]' : 'max-h-[600px]')}>
            <div className="divide-y divide-gray-100" dir={isHe ? 'rtl' : 'ltr'}>
              {filteredChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  isHe={isHe}
                  locale={locale}
                  onClick={() => openChat(chat.id)}
                  isSelected={isSplitMode && chat.id === selectedChatId}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  // ==========================================
  // Render — Mobile (below lg) vs Split View (lg+)
  // ==========================================

  // Mobile: show either chat list or chat view
  if (!selectedChat) {
    return renderChatList();
  }

  // Desktop split view: sidebar + chat side by side
  return (
    <>
      {/* Desktop: split view */}
      <div className="hidden lg:flex gap-4" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="w-[380px] flex-shrink-0">
          {renderChatList(true)}
        </div>
        <div className="flex-1 min-w-0">
          {renderChatView()}
        </div>
      </div>

      {/* Mobile: full-screen chat view */}
      <div className="lg:hidden">
        {renderChatView()}
      </div>
    </>
  );
}
