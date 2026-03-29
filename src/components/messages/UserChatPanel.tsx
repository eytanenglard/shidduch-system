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
  Check,
  CheckCheck,
  Eye,
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

/** Suggestion status → user-friendly short label */
function getStatusLabel(status: string | undefined, isHe: boolean): { label: string; color: string } | null {
  if (!status) return null;
  const map: Record<string, { he: string; en: string; color: string }> = {
    PENDING_FIRST_PARTY: { he: 'ממתין לתגובתך', en: 'Awaiting your response', color: 'bg-orange-100 text-orange-700' },
    FIRST_PARTY_APPROVED: { he: 'אישרת', en: 'You approved', color: 'bg-green-100 text-green-700' },
    FIRST_PARTY_INTERESTED: { he: 'הבעת עניין', en: 'Interested', color: 'bg-emerald-100 text-emerald-700' },
    PENDING_SECOND_PARTY: { he: 'ממתין לצד שני', en: 'Awaiting other party', color: 'bg-blue-100 text-blue-700' },
    SECOND_PARTY_APPROVED: { he: 'שני הצדדים אישרו', en: 'Both approved', color: 'bg-green-100 text-green-700' },
    CONTACT_DETAILS_SHARED: { he: 'פרטים שותפו!', en: 'Details shared!', color: 'bg-emerald-100 text-emerald-700' },
    DATING: { he: 'בתהליך היכרות', en: 'Dating', color: 'bg-pink-100 text-pink-700' },
    FIRST_PARTY_DECLINED: { he: 'סירבת', en: 'Declined', color: 'bg-red-100 text-red-600' },
    SECOND_PARTY_DECLINED: { he: 'הצד השני סירב', en: 'Other party declined', color: 'bg-red-100 text-red-600' },
  };
  const entry = map[status];
  if (!entry) return null;
  return { label: isHe ? entry.he : entry.en, color: entry.color };
}

/** Group chats by date of last message */
function groupChatsByDate(
  chats: ChatSummary[],
  locale: Locale
): { label: string; chats: ChatSummary[] }[] {
  const isHe = locale === 'he';
  const loc = isHe ? he : enUS;
  const groups: { label: string; chats: ChatSummary[] }[] = [];

  for (const chat of chats) {
    const dateStr = chat.lastMessageTime;
    let label: string;

    if (!dateStr) {
      label = isHe ? 'ללא הודעות' : 'No messages';
    } else {
      const date = new Date(dateStr);
      if (isToday(date)) {
        label = isHe ? 'היום' : 'Today';
      } else if (isYesterday(date)) {
        label = isHe ? 'אתמול' : 'Yesterday';
      } else {
        label = format(date, isHe ? 'EEEE, d בMMMM' : 'EEEE, MMMM d', { locale: loc });
      }
    }

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.chats.push(chat);
    } else {
      groups.push({ label, chats: [chat] });
    }
  }

  return groups;
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
  onMarkRead,
  isSelected,
}: {
  chat: ChatSummary;
  isHe: boolean;
  locale: Locale;
  onClick: () => void;
  onMarkRead?: () => void;
  isSelected?: boolean;
}) {
  const isUnread = chat.unreadCount > 0;
  const preview = getMessagePreview(chat, isHe);
  const isSuggestion = chat.type === 'suggestion';
  const statusInfo = isSuggestion ? getStatusLabel(chat.status, isHe) : null;

  // Swipe state for mobile mark-as-read
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const rowRef = useRef<HTMLButtonElement>(null);
  const [isSwiped, setIsSwiped] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    // Only allow swipe in the correct direction (start-to-end in RTL = right, LTR = left)
    const swipeDelta = isHe ? delta : -delta;
    if (swipeDelta > 0 && swipeDelta < 100) {
      touchDeltaX.current = swipeDelta;
      if (rowRef.current) {
        const translate = isHe ? swipeDelta : -swipeDelta;
        rowRef.current.style.transform = `translateX(${translate}px)`;
      }
    }
  }, [isHe]);

  const handleTouchEnd = useCallback(() => {
    if (touchDeltaX.current > 60 && isUnread && onMarkRead) {
      setIsSwiped(true);
      onMarkRead();
      setTimeout(() => setIsSwiped(false), 600);
    }
    if (rowRef.current) {
      rowRef.current.style.transform = '';
    }
    touchDeltaX.current = 0;
  }, [isUnread, onMarkRead]);

  // For suggestion chats: the conversation is WITH the matchmaker,
  // and the TOPIC is the suggestion (the other party)
  const chatWithName = chat.matchmakerName;
  const topicName = chat.title; // other party name

  return (
    <div className="relative overflow-hidden">
      {/* Swipe-to-read background */}
      {isUnread && (
        <div className={cn(
          'absolute inset-y-0 flex items-center px-4',
          isHe ? 'left-0' : 'right-0',
          'bg-teal-500 text-white'
        )}>
          <Eye className="w-5 h-5" />
        </div>
      )}
      <button
        ref={rowRef}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'relative w-full px-4 py-3.5 flex items-center gap-3 transition-colors text-start bg-white',
          isUnread
            ? 'bg-teal-50/50 hover:bg-teal-50/80'
            : 'hover:bg-gray-50/80',
          isSelected && 'bg-teal-50 ring-1 ring-inset ring-teal-200',
          isSwiped && 'transition-transform duration-300'
        )}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-11 h-11 shadow-sm ring-2 ring-white">
            <AvatarFallback
              className={cn(
                'text-white font-bold bg-gradient-to-br text-sm',
                isSuggestion
                  ? 'from-teal-400 to-cyan-500'
                  : 'from-purple-400 to-pink-500'
              )}
            >
              {isSuggestion ? (
                getInitials(chatWithName)
              ) : (
                <User className="w-5 h-5" />
              )}
            </AvatarFallback>
          </Avatar>
          {isSuggestion && (
            <div className="absolute -bottom-0.5 -end-0.5 p-0.5 bg-white rounded-full shadow">
              <Heart className="w-2.5 h-2.5 text-pink-500 fill-pink-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Row 1: Name + Time */}
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <p
              className={cn(
                'text-sm truncate flex-1 min-w-0',
                isUnread
                  ? 'font-bold text-gray-900'
                  : 'font-semibold text-gray-800'
              )}
            >
              {chatWithName}
            </p>
            {chat.lastMessageTime && (
              <span
                className={cn(
                  'text-[10px] whitespace-nowrap flex-shrink-0',
                  isUnread ? 'text-teal-600 font-semibold' : 'text-gray-400'
                )}
              >
                {formatTime(chat.lastMessageTime, locale)}
              </span>
            )}
          </div>

          {/* Row 2: Topic / Subtitle + Status badge */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-xs text-gray-400 truncate">
              {isSuggestion
                ? `${isHe ? 'הצעה עם' : 'Suggestion with'} ${topicName}`
                : isHe
                  ? 'שיחה כללית'
                  : 'General chat'}
            </p>
            {statusInfo && (
              <span className={cn(
                'text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0',
                statusInfo.color
              )}>
                {statusInfo.label}
              </span>
            )}
          </div>

          {/* Row 3: Last message preview with read receipts */}
          {preview.text ? (
            <p
              className={cn(
                'text-xs truncate flex items-center gap-0.5',
                isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
              )}
            >
              {chat.lastMessageIsMine && chat.lastMessageType !== 'SYSTEM' && (
                <>
                  {chat.unreadCount === 0 ? (
                    <CheckCheck className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </>
              )}
              {chat.lastMessageIsMine && chat.lastMessageType !== 'SYSTEM' && (
                <span className="text-teal-600 font-medium flex-shrink-0">
                  {isHe ? 'אני: ' : 'Me: '}
                </span>
              )}
              {preview.icon}
              <span className="truncate">{preview.text}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">
              {isHe ? 'לחץ/י לפתיחת שיחה' : 'Tap to open chat'}
            </p>
          )}
        </div>

        {/* Unread badge + Arrow */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isUnread && (
            <Badge className="bg-teal-500 text-white text-[10px] min-w-[20px] h-5 px-1.5 py-0 border-0 shadow-sm animate-zoom-in">
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
    </div>
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

  // Mark chat as read without opening it (swipe action)
  const handleMarkRead = useCallback(async (chatId: string, chatType: 'direct' | 'suggestion') => {
    try {
      const url = chatType === 'direct'
        ? '/api/messages/direct/read'
        : `/api/suggestions/${chatId}/chat/read`;
      await fetch(url, { method: 'POST' });
      // Optimistic update
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ));
      const newTotal = chats.reduce((sum, c) =>
        sum + (c.id === chatId ? 0 : c.unreadCount), 0
      );
      onUnreadUpdateRef.current?.(newTotal);
    } catch {
      // Silently fail — next poll will correct
    }
  }, [chats]);

  // Date-grouped chats for the list
  const groupedChats = useMemo(
    () => groupChatsByDate(filteredChats, locale),
    [filteredChats, locale]
  );

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
                    {getInitials(selectedChat.matchmakerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selectedChat.matchmakerName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                    {isHe ? 'הצעה עם' : 'Suggestion with'} {selectedChat.title}
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
            {/* Connection status dot */}
            <div className="flex items-center gap-1 px-1.5" title={
              isConnected
                ? (isHe ? 'מחובר בזמן אמת' : 'Connected in real-time')
                : isPolling
                  ? (isHe ? 'מתעדכן מדי כמה שניות' : 'Polling for updates')
                  : (isHe ? 'לא מחובר' : 'Disconnected')
            }>
              <div className={cn(
                'w-2 h-2 rounded-full',
                isConnected
                  ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]'
                  : isPolling
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-gray-300'
              )} />
            </div>
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
            <div dir={isHe ? 'rtl' : 'ltr'}>
              {groupedChats.map((group) => (
                <div key={group.label}>
                  {/* Date separator */}
                  {groupedChats.length > 1 && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50/80">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                        {group.label}
                      </span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                  <div className="divide-y divide-gray-100">
                    {group.chats.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isHe={isHe}
                        locale={locale}
                        onClick={() => openChat(chat.id)}
                        onMarkRead={() => handleMarkRead(chat.id, chat.type)}
                        isSelected={isSplitMode && chat.id === selectedChatId}
                      />
                    ))}
                  </div>
                </div>
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
