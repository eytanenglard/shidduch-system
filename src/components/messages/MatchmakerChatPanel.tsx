// src/components/messages/MatchmakerChatPanel.tsx
'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
  ChevronDown,
  ChevronUp,
  Users,
  Inbox,
  Clock,
  Send,
  Search,
  X,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import SuggestionChatTab from '../matchmaker/suggestions/details/SuggestionChatTab';
import type { Locale } from '../../../i18n-config';

// ==========================================
// Types
// ==========================================

interface PartyInfo {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSenderType?: 'user' | 'matchmaker' | 'system';
  unreadCount: number;
}

interface SuggestionChatSummary {
  suggestionId: string;
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  status: string;
  totalUnread: number;
}

interface DirectChatSummary {
  userId: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageIsMine?: boolean;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'matchmaker' | 'system';
  senderId: string;
  createdAt: string;
}

interface SelectedChat {
  suggestionId: string;
  partyId: string;
  partyName: string;
  isFirstParty: boolean;
  isDirect?: boolean;
  directUserId?: string;
}

interface MatchmakerChatPanelProps {
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

/** Highlight matching text segments */
function HighlightText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight.trim()) return <>{text}</>;
  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200/70 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ==========================================
// DirectChatView Sub-Component
// ==========================================

function DirectChatView({
  userId,
  userName,
  locale,
  onBack,
}: {
  userId: string;
  userName: string;
  locale: Locale;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHe = locale === 'he';

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/matchmaker/direct-chats/${userId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMessages();
    fetch(`/api/matchmaker/direct-chats/${userId}`, { method: 'PATCH' }).catch(
      console.error
    );
    const interval = setInterval(loadMessages, 12000);
    return () => clearInterval(interval);
  }, [loadMessages, userId]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/matchmaker/direct-chats/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
      }
    } catch {
      toast.error(isHe ? 'שגיאה בשליחה' : 'Send error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/40 border-b py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-purple-50"
          >
            <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
            {isHe ? 'חזרה' : 'Back'}
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2.5">
            <Avatar className="w-9 h-9 shadow-sm ring-2 ring-white">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xs font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{userName}</p>
              <p className="text-xs text-gray-500">
                {isHe ? 'שיחה כללית' : 'General Chat'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[500px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center mb-3">
                    <MessageCircle className="w-7 h-7 text-purple-300" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {isHe
                      ? 'אין הודעות עדיין. שלח/י הודעה ראשונה!'
                      : 'No messages yet. Send the first message!'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderType === 'matchmaker';
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex',
                        isMine ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                          isMine
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                        <p
                          className={cn(
                            'text-[10px] mt-1',
                            isMine ? 'text-purple-200' : 'text-gray-400'
                          )}
                        >
                          {formatTime(msg.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t bg-gray-50/50 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isHe ? 'כתוב/י הודעה...' : 'Type a message...'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                  dir={isHe ? 'rtl' : 'ltr'}
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 h-10 shadow-sm"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 rtl:-scale-x-100" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// Main Component
// ==========================================

export default function MatchmakerChatPanel({
  locale,
}: MatchmakerChatPanelProps) {
  const [chatSummaries, setChatSummaries] = useState<SuggestionChatSummary[]>(
    []
  );
  const [directChats, setDirectChats] = useState<DirectChatSummary[]>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ====== SEARCH STATE ======
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isHe = locale === 'he';

  // ==========================================
  // Load data
  // ==========================================

  const loadChatSummaries = useCallback(async () => {
    try {
      const [suggestionsRes, unreadRes, directRes] = await Promise.all([
        fetch('/api/matchmaker/suggestions'),
        fetch('/api/matchmaker/chat/unread'),
        fetch('/api/matchmaker/direct-chats'),
      ]);

      if (!suggestionsRes.ok) throw new Error('Failed to fetch suggestions');

      const suggestions = await suggestionsRes.json();
      let unreadData: { bySuggestion?: Record<string, number> } = {};
      if (unreadRes.ok) {
        unreadData = await unreadRes.json();
      }
      const unreadMap = unreadData.bySuggestion || {};

      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData.success) {
          setDirectChats(directData.chats || []);
        }
      }

      const summaries: SuggestionChatSummary[] = suggestions
        .filter((s: { category: string }) => s.category !== 'HISTORY')
        .map(
          (s: {
            id: string;
            status: string;
            firstParty: { id: string; firstName: string; lastName: string };
            secondParty: { id: string; firstName: string; lastName: string };
          }) => ({
            suggestionId: s.id,
            firstParty: {
              id: s.firstParty.id,
              name: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
              unreadCount: 0,
            },
            secondParty: {
              id: s.secondParty.id,
              name: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
              unreadCount: 0,
            },
            status: s.status,
            totalUnread: unreadMap[s.id] || 0,
          })
        )
        .sort(
          (a: SuggestionChatSummary, b: SuggestionChatSummary) =>
            b.totalUnread - a.totalUnread
        );

      setChatSummaries(summaries);

      // Only auto-expand unread when NOT searching
      if (!searchQuery.trim()) {
        const withUnread = summaries
          .filter((s: SuggestionChatSummary) => s.totalUnread > 0)
          .map((s: SuggestionChatSummary) => s.suggestionId);
        setExpandedSuggestions(new Set(withUnread));
      }

      for (const summary of summaries) {
        fetchLastMessagesForSummary(summary, suggestions);
      }
    } catch (error) {
      console.error('Error loading chat summaries:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLastMessagesForSummary = async (
    summary: SuggestionChatSummary,
    allSuggestions: Array<{
      id: string;
      firstParty: { id: string };
      secondParty: { id: string };
    }>
  ) => {
    try {
      const res = await fetch(
        `/api/matchmaker/suggestions/${summary.suggestionId}/chat`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.messages?.length) return;

      const msgs = data.messages as Array<{
        content: string;
        createdAt: string;
        senderType: 'user' | 'matchmaker' | 'system';
        senderId: string;
        targetUserId?: string | null;
      }>;
      const suggestion = allSuggestions.find(
        (s) => s.id === summary.suggestionId
      );
      if (!suggestion) return;

      const firstId = suggestion.firstParty.id;
      const secondId = suggestion.secondParty.id;

      const firstMsgs = msgs.filter(
        (m) =>
          (m.senderType === 'user' && m.senderId === firstId) ||
          (m.senderType === 'matchmaker' &&
            (m.targetUserId === firstId || !m.targetUserId))
      );
      const secondMsgs = msgs.filter(
        (m) =>
          (m.senderType === 'user' && m.senderId === secondId) ||
          (m.senderType === 'matchmaker' &&
            (m.targetUserId === secondId || !m.targetUserId))
      );

      const lastFirst = firstMsgs[firstMsgs.length - 1];
      const lastSecond = secondMsgs[secondMsgs.length - 1];

      setChatSummaries((prev) =>
        prev.map((s) =>
          s.suggestionId === summary.suggestionId
            ? {
                ...s,
                firstParty: {
                  ...s.firstParty,
                  lastMessage: lastFirst?.content,
                  lastMessageTime: lastFirst?.createdAt,
                  lastMessageSenderType: lastFirst?.senderType,
                },
                secondParty: {
                  ...s.secondParty,
                  lastMessage: lastSecond?.content,
                  lastMessageTime: lastSecond?.createdAt,
                  lastMessageSenderType: lastSecond?.senderType,
                },
              }
            : s
        )
      );
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    loadChatSummaries();
    const interval = setInterval(loadChatSummaries, 30000);
    return () => clearInterval(interval);
  }, [loadChatSummaries]);

  // ==========================================
  // Filtered data (search)
  // ==========================================

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSummaries = useMemo(() => {
    if (!normalizedQuery) return chatSummaries;
    return chatSummaries.filter(
      (s) =>
        s.firstParty.name.toLowerCase().includes(normalizedQuery) ||
        s.secondParty.name.toLowerCase().includes(normalizedQuery)
    );
  }, [chatSummaries, normalizedQuery]);

  const filteredDirectChats = useMemo(() => {
    if (!normalizedQuery) return directChats;
    return directChats.filter((dc) =>
      dc.name.toLowerCase().includes(normalizedQuery)
    );
  }, [directChats, normalizedQuery]);

  // Auto-expand all matching suggestions when searching
  useEffect(() => {
    if (normalizedQuery) {
      const matchingIds = filteredSummaries.map((s) => s.suggestionId);
      setExpandedSuggestions(new Set(matchingIds));
    }
    // When clearing search, revert to showing only unread expanded
    if (!normalizedQuery && chatSummaries.length > 0) {
      const withUnread = chatSummaries
        .filter((s) => s.totalUnread > 0)
        .map((s) => s.suggestionId);
      setExpandedSuggestions(new Set(withUnread));
    }
  }, [normalizedQuery, filteredSummaries, chatSummaries]);

  // ==========================================
  // Handlers
  // ==========================================

  const toggleExpand = (suggestionId: string) => {
    setExpandedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  };

  const openChat = (
    suggestionId: string,
    partyId: string,
    partyName: string,
    isFirstParty: boolean
  ) => {
    setSelectedChat({ suggestionId, partyId, partyName, isFirstParty });
  };

  const closeChat = () => {
    setSelectedChat(null);
    loadChatSummaries();
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // ==========================================
  // Helpers
  // ==========================================

  const totalUnread =
    chatSummaries.reduce((sum, s) => sum + s.totalUnread, 0) +
    directChats.reduce((sum, dc) => sum + dc.unreadCount, 0);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { he: string; en: string; color: string }> = {
      PENDING_FIRST_PARTY: {
        he: "ממתין לצד א'",
        en: 'Pending Party A',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      PENDING_SECOND_PARTY: {
        he: "ממתין לצד ב'",
        en: 'Pending Party B',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      FIRST_PARTY_APPROVED: {
        he: "צד א' אישר/ה",
        en: 'Party A Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
      },
      SECOND_PARTY_APPROVED: {
        he: "צד ב' אישר/ה",
        en: 'Party B Approved',
        color: 'bg-green-50 text-green-700 border-green-200',
      },
      CONTACT_DETAILS_SHARED: {
        he: 'פרטי קשר נשלחו',
        en: 'Details Shared',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
      },
      DATING: {
        he: 'בדייט',
        en: 'Dating',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      },
    };
    const info = labels[status] || {
      he: status,
      en: status,
      color: 'bg-gray-100 text-gray-700',
    };
    return { label: isHe ? info.he : info.en, color: info.color };
  };

  // ==========================================
  // Render - Chat View
  // ==========================================

  if (selectedChat) {
    if (selectedChat.isDirect) {
      return (
        <DirectChatView
          userId={selectedChat.directUserId!}
          userName={selectedChat.partyName}
          locale={locale}
          onBack={closeChat}
        />
      );
    }

    return (
      <Card className="shadow-lg border-0 overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50/40 border-b py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-teal-50"
            >
              <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
              {isHe ? 'חזרה' : 'Back'}
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9 shadow-sm ring-2 ring-white">
                <AvatarFallback
                  className={cn(
                    'text-white text-xs font-bold bg-gradient-to-br',
                    selectedChat.isFirstParty
                      ? 'from-teal-400 to-cyan-500'
                      : 'from-amber-400 to-orange-500'
                  )}
                >
                  {getInitials(selectedChat.partyName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {selectedChat.partyName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedChat.isFirstParty
                    ? isHe
                      ? "צד א'"
                      : 'Party A'
                    : isHe
                      ? "צד ב'"
                      : 'Party B'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <SuggestionChatTab
            suggestionId={selectedChat.suggestionId}
            locale={locale}
            defaultParty={selectedChat.isFirstParty ? 'first' : 'second'}
            hidePartyTabs={true}
          />
        </CardContent>
      </Card>
    );
  }

  // ==========================================
  // Render - List View
  // ==========================================

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  const hasResults =
    filteredSummaries.length > 0 || filteredDirectChats.length > 0;
  const isSearching = normalizedQuery.length > 0;

  return (
    <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50/40 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isHe ? "צ'אט עם מועמדים" : 'Chat with Candidates'}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {isHe ? 'בחר/י מועמד/ת לשיחה' : 'Select a candidate to chat'}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-amber-500 text-white border-0 px-3 py-1 text-sm shadow-sm">
              {totalUnread} {isHe ? 'חדשות' : 'new'}
            </Badge>
          )}
        </div>

        {/* ====== SEARCH BAR ====== */}
        <div className="mt-3">
          <div className="relative">
            <Search
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-4 h-4 transition-colors',
                isSearchFocused ? 'text-teal-500' : 'text-gray-400',
                isHe ? 'right-3' : 'left-3'
              )}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={
                isHe ? 'חיפוש מועמד/ת לפי שם...' : 'Search candidate by name...'
              }
              className={cn(
                'w-full py-2.5 rounded-xl border bg-white text-sm transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400',
                'placeholder:text-gray-400',
                isHe ? 'pr-10 pl-10' : 'pl-10 pr-10',
                isSearchFocused
                  ? 'border-teal-300 shadow-sm'
                  : 'border-gray-200'
              )}
              dir={isHe ? 'rtl' : 'ltr'}
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors',
                  isHe ? 'left-2' : 'right-2'
                )}
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Search result count */}
          {isSearching && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium',
                  hasResults
                    ? 'border-teal-200 text-teal-700 bg-teal-50/50'
                    : 'border-gray-200 text-gray-500'
                )}
              >
                <Search className="w-3 h-3 me-1" />
                {hasResults
                  ? isHe
                    ? `נמצאו ${filteredSummaries.length} הצעות ו-${filteredDirectChats.length} שיחות ישירות`
                    : `Found ${filteredSummaries.length} suggestions & ${filteredDirectChats.length} direct chats`
                  : isHe
                    ? 'לא נמצאו תוצאות'
                    : 'No results found'}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-4">
                {isSearching ? (
                  <Search className="w-8 h-8 text-gray-300" />
                ) : (
                  <Inbox className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {isSearching
                  ? isHe
                    ? `לא נמצאו תוצאות עבור "${searchQuery}"`
                    : `No results for "${searchQuery}"`
                  : isHe
                    ? 'אין הצעות פעילות כרגע'
                    : 'No active suggestions'}
              </p>
              {isSearching && (
                <p className="text-xs text-gray-400">
                  {isHe
                    ? 'נסה/י לחפש שם אחר או לנקות את החיפוש'
                    : 'Try a different name or clear the search'}
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* ======== Direct Chats Section ======== */}
              {filteredDirectChats.length > 0 && (
                <>
                  <div className="px-5 py-2.5 bg-purple-50/50 border-b">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                      {isHe ? 'שיחות כלליות' : 'General Chats'}
                      {isSearching && (
                        <span className="text-purple-400 font-normal ms-1">
                          ({filteredDirectChats.length})
                        </span>
                      )}
                    </p>
                  </div>
                  {filteredDirectChats.map((dc) => (
                    <button
                      key={dc.userId}
                      onClick={() =>
                        setSelectedChat({
                          suggestionId: '',
                          partyId: dc.userId,
                          partyName: dc.name,
                          isFirstParty: false,
                          isDirect: true,
                          directUserId: dc.userId,
                        })
                      }
                      className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-purple-50/40 transition-colors text-start border-b border-gray-100"
                    >
                      <Avatar className="w-11 h-11 shadow-sm ring-2 ring-white">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xs font-bold">
                          {getInitials(dc.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-medium text-gray-800 text-sm">
                            <HighlightText
                              text={dc.name}
                              highlight={searchQuery}
                            />
                          </p>
                          {dc.lastMessageTime && (
                            <span className="text-[10px] text-gray-400">
                              {formatTime(dc.lastMessageTime, locale)}
                            </span>
                          )}
                        </div>
                        {dc.lastMessage ? (
                          <p className="text-xs text-gray-500 truncate">
                            {dc.lastMessageIsMine && (
                              <span className="text-purple-600 font-medium">
                                {isHe ? 'את/ה: ' : 'You: '}
                              </span>
                            )}
                            {truncate(dc.lastMessage, 50)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            {isHe ? 'לחץ/י לפתיחת שיחה' : 'Click to open chat'}
                          </p>
                        )}
                      </div>
                      {dc.unreadCount > 0 && (
                        <Badge className="bg-purple-500 text-white text-xs px-2 py-0.5 border-0 shadow-sm animate-pulse">
                          {dc.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                  {filteredSummaries.length > 0 && (
                    <div className="px-5 py-2.5 bg-teal-50/50 border-b">
                      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
                        {isHe ? 'שיחות לפי הצעה' : 'Suggestion Chats'}
                        {isSearching && (
                          <span className="text-teal-400 font-normal ms-1">
                            ({filteredSummaries.length})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Show section header even when no direct chats but searching */}
              {filteredDirectChats.length === 0 &&
                filteredSummaries.length > 0 &&
                isSearching && (
                  <div className="px-5 py-2.5 bg-teal-50/50 border-b">
                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
                      {isHe ? 'שיחות לפי הצעה' : 'Suggestion Chats'}
                      <span className="text-teal-400 font-normal ms-1">
                        ({filteredSummaries.length})
                      </span>
                    </p>
                  </div>
                )}

              {/* ======== Suggestion Chats Section ======== */}
              {filteredSummaries.map((summary) => {
                const isExpanded = expandedSuggestions.has(
                  summary.suggestionId
                );
                const statusInfo = getStatusLabel(summary.status);

                // Determine which party matches the search (for visual hint)
                const firstMatches =
                  isSearching &&
                  summary.firstParty.name
                    .toLowerCase()
                    .includes(normalizedQuery);
                const secondMatches =
                  isSearching &&
                  summary.secondParty.name
                    .toLowerCase()
                    .includes(normalizedQuery);

                return (
                  <div key={summary.suggestionId}>
                    {/* Suggestion Header */}
                    <button
                      onClick={() => toggleExpand(summary.suggestionId)}
                      className={cn(
                        'w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-start',
                        summary.totalUnread > 0 && 'bg-teal-50/30',
                        isSearching && 'bg-teal-50/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar
                            className={cn(
                              'w-11 h-11 shadow-sm ring-2',
                              firstMatches ? 'ring-amber-300' : 'ring-white'
                            )}
                          >
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-bold">
                              {getInitials(summary.firstParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar
                            className={cn(
                              'w-7 h-7 absolute -bottom-0.5 -end-2 shadow-sm ring-2',
                              secondMatches ? 'ring-amber-300' : 'ring-white'
                            )}
                          >
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[9px] font-bold">
                              {getInitials(summary.secondParty.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            <HighlightText
                              text={summary.firstParty.name.split(' ')[0]}
                              highlight={searchQuery}
                            />
                            {' & '}
                            <HighlightText
                              text={summary.secondParty.name.split(' ')[0]}
                              highlight={searchQuery}
                            />
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 mt-0.5 border',
                              statusInfo.color
                            )}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {summary.totalUnread > 0 && (
                          <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5 border-0 shadow-sm animate-pulse">
                            {summary.totalUnread}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded: Party Cards */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 space-y-2 bg-gray-50/50">
                        {/* First Party */}
                        <button
                          onClick={() =>
                            openChat(
                              summary.suggestionId,
                              summary.firstParty.id,
                              summary.firstParty.name,
                              true
                            )
                          }
                          className={cn(
                            'w-full p-3 rounded-xl bg-white border hover:border-teal-300 hover:bg-teal-50/40 transition-all flex items-center gap-3 shadow-sm text-start',
                            firstMatches
                              ? 'border-amber-300 bg-amber-50/20'
                              : 'border-gray-200'
                          )}
                        >
                          <Avatar className="w-10 h-10 shadow-sm flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-sm font-bold">
                              {getInitials(summary.firstParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-medium text-gray-800 text-sm">
                                <HighlightText
                                  text={summary.firstParty.name}
                                  highlight={searchQuery}
                                />
                              </p>
                              <div className="flex items-center gap-1.5">
                                {summary.firstParty.lastMessageTime && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(
                                      summary.firstParty.lastMessageTime,
                                      locale
                                    )}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-teal-200 text-teal-700 px-1.5 py-0"
                                >
                                  {isHe ? "צד א'" : 'Party A'}
                                </Badge>
                              </div>
                            </div>
                            {summary.firstParty.lastMessage ? (
                              <p className="text-xs text-gray-500 truncate">
                                {summary.firstParty.lastMessageSenderType ===
                                  'matchmaker' && (
                                  <span className="text-teal-600 font-medium">
                                    {isHe ? 'את/ה: ' : 'You: '}
                                  </span>
                                )}
                                {truncate(summary.firstParty.lastMessage, 50)}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">
                                {isHe
                                  ? 'לחץ/י לפתיחת שיחה'
                                  : 'Click to open chat'}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 rtl:-scale-x-100" />
                        </button>

                        {/* Second Party */}
                        <button
                          onClick={() =>
                            openChat(
                              summary.suggestionId,
                              summary.secondParty.id,
                              summary.secondParty.name,
                              false
                            )
                          }
                          className={cn(
                            'w-full p-3 rounded-xl bg-white border hover:border-amber-300 hover:bg-amber-50/40 transition-all flex items-center gap-3 shadow-sm text-start',
                            secondMatches
                              ? 'border-amber-300 bg-amber-50/20'
                              : 'border-gray-200'
                          )}
                        >
                          <Avatar className="w-10 h-10 shadow-sm flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold">
                              {getInitials(summary.secondParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-medium text-gray-800 text-sm">
                                <HighlightText
                                  text={summary.secondParty.name}
                                  highlight={searchQuery}
                                />
                              </p>
                              <div className="flex items-center gap-1.5">
                                {summary.secondParty.lastMessageTime && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(
                                      summary.secondParty.lastMessageTime,
                                      locale
                                    )}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-amber-200 text-amber-700 px-1.5 py-0"
                                >
                                  {isHe ? "צד ב'" : 'Party B'}
                                </Badge>
                              </div>
                            </div>
                            {summary.secondParty.lastMessage ? (
                              <p className="text-xs text-gray-500 truncate">
                                {summary.secondParty.lastMessageSenderType ===
                                  'matchmaker' && (
                                  <span className="text-teal-600 font-medium">
                                    {isHe ? 'את/ה: ' : 'You: '}
                                  </span>
                                )}
                                {truncate(summary.secondParty.lastMessage, 50)}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">
                                {isHe
                                  ? 'לחץ/י לפתיחת שיחה'
                                  : 'Click to open chat'}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 rtl:-scale-x-100" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
