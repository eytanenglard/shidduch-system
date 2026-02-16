// src/app/[locale]/(authenticated)/matchmaker/messages/MatchmakerMessagesClientPage.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  MessageSquare,
  ClipboardCheck,
  MessageCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Users,
  Inbox,
  Send,
  Bot,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import MessagesPage from '@/components/messages/MessagesPage';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { Locale } from '../../../../../../i18n-config';

// ==========================================
// Types
// ==========================================

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'matchmaker' | 'system';
  senderName: string;
  targetUserId?: string | null;
  isRead: boolean;
  createdAt: string;
  isFirstParty?: boolean;
  isSecondParty?: boolean;
}

interface PartyInfo {
  id: string;
  name: string;
}

interface SuggestionSummary {
  id: string;
  status: string;
  firstParty: { id: string; firstName: string; lastName: string };
  secondParty: { id: string; firstName: string; lastName: string };
  category?: string;
}

interface LastMessageInfo {
  content: string;
  time: string;
  senderType: 'user' | 'matchmaker' | 'system';
}

// ==========================================
// Dictionary
// ==========================================

interface MatchmakerMessagesDict {
  header: { title: string; subtitle: string };
  tabs: { chat: string; availability: string };
  chatPanel: {
    activeSuggestions: string;
    noActiveSuggestions: string;
    selectSuggestion: string;
    selectSuggestionDescription: string;
    selectParty: string;
    selectPartyDescription: string;
    back: string;
    backToList: string;
    backToParties: string;
    noMessages: string;
    noMessagesDescription: string;
    placeholder: string;
    sendError: string;
    sendingTo: string;
    messages: string;
    senderLabels: { matchmaker: string; system: string };
    partyLabels: { partyA: string; partyB: string };
    statusLabels: Record<string, string>;
    clickToChat: string;
    today: string;
    yesterday: string;
    you: string;
  };
}

const defaultDict: MatchmakerMessagesDict = {
  header: {
    title: 'מרכז הודעות',
    subtitle: 'נהל/י תקשורת עם מועמדים ובקשות זמינות',
  },
  tabs: { chat: "צ'אט עם מועמדים", availability: 'בקשות זמינות' },
  chatPanel: {
    activeSuggestions: 'הצעות פעילות',
    noActiveSuggestions: 'אין הצעות פעילות כרגע',
    selectSuggestion: 'בחר/י הצעה',
    selectSuggestionDescription: 'כאן תוכל/י לנהל שיחות עם המועמדים בנוגע להצעות שידוך',
    selectParty: 'בחר/י מועמד/ת לשיחה',
    selectPartyDescription: "לחץ/י על אחד המועמדים כדי לפתוח צ'אט",
    back: 'חזרה',
    backToList: 'חזרה לרשימה',
    backToParties: 'חזרה לבחירת מועמד',
    noMessages: 'אין הודעות עדיין',
    noMessagesDescription: 'שלח/י הודעה ראשונה למועמד/ת',
    placeholder: 'כתוב/י הודעה...',
    sendError: 'שגיאה בשליחת ההודעה',
    sendingTo: 'שולח/ת ל:',
    messages: 'הודעות',
    senderLabels: { matchmaker: 'את/ה (שדכן/ית)', system: 'מערכת' },
    partyLabels: { partyA: "צד א'", partyB: "צד ב'" },
    statusLabels: {
      PENDING_FIRST_PARTY: "ממתין לצד א'",
      PENDING_SECOND_PARTY: "ממתין לצד ב'",
      FIRST_PARTY_APPROVED: "צד א' אישר/ה",
      SECOND_PARTY_APPROVED: "צד ב' אישר/ה",
      CONTACT_DETAILS_SHARED: 'פרטי קשר נשלחו',
      DATING: 'בדייטים',
      AWAITING_FIRST_DATE_FEEDBACK: 'ממתין למשוב',
    },
    clickToChat: 'לחץ/י לפתיחת שיחה',
    today: 'היום',
    yesterday: 'אתמול',
    you: 'את/ה',
  },
};

// ==========================================
// Helpers
// ==========================================

function formatMessageTime(
  dateStr: string,
  locale: Locale,
  dict: { today: string; yesterday: string }
) {
  const date = new Date(dateStr);
  const loc = locale === 'he' ? he : enUS;
  if (isToday(date)) return format(date, 'HH:mm', { locale: loc });
  if (isYesterday(date)) return dict.yesterday;
  return format(date, 'dd/MM', { locale: loc });
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

// ==========================================
// Selected Chat State
// ==========================================

interface SelectedChat {
  suggestionId: string;
  partyId: string;
  partyName: string;
  isFirstParty: boolean;
  suggestionName: string;
}

// ==========================================
// Main Component
// ==========================================

interface Props {
  locale: Locale;
  dict?: MatchmakerMessagesDict;
}

export default function MatchmakerMessagesClientPage({ locale, dict }: Props) {
  const t = dict || defaultDict;
  const { data: session } = useSession();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/matchmaker/chat/unread');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTotalUnread(data.totalUnread || 0);
          setUnreadMap(data.bySuggestion || {});
        }
      }
    } catch (e) {
      console.error('Error fetching unread:', e);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [session, fetchUnread]);

  if (!session?.user) {
    return <StandardizedLoadingSpinner className="h-[calc(100vh-80px)]" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-amber-600 bg-clip-text text-transparent mb-3">
            {t.header.title}
          </h1>
          <p className="text-base text-gray-500">{t.header.subtitle}</p>
        </header>

        {/* Tabs – no dir prop needed, inherits from html */}
        <Tabs defaultValue="chat">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/90 backdrop-blur-sm rounded-2xl p-1.5 shadow-md border border-gray-100 h-auto">
              <TabsTrigger
                value="chat"
                className="rounded-xl px-6 py-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all relative gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t.tabs.chat}
                {totalUnread > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-[20px] h-5 border-0 shadow-sm">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="rounded-xl px-6 py-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                {t.tabs.availability}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="mt-0">
            <ChatPanel
              locale={locale}
              unreadMap={unreadMap}
              onMessagesRead={fetchUnread}
              dict={t.chatPanel}
            />
          </TabsContent>
          <TabsContent value="availability" className="mt-0">
            <MessagesPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==========================================
// Chat Panel
// ==========================================

interface ChatPanelProps {
  locale: Locale;
  unreadMap: Record<string, number>;
  onMessagesRead: () => void;
  dict: MatchmakerMessagesDict['chatPanel'];
}

function ChatPanel({ locale, unreadMap, onMessagesRead, dict: t }: ChatPanelProps) {
  const [suggestions, setSuggestions] = useState<SuggestionSummary[]>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState<
    Record<string, { firstParty?: LastMessageInfo; secondParty?: LastMessageInfo }>
  >({});
  const isHe = locale === 'he';

  // Load suggestions + last messages
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/matchmaker/suggestions');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const active = data.filter(
          (s: SuggestionSummary & { category?: string }) => s.category !== 'HISTORY'
        );
        active.sort(
          (a: SuggestionSummary, b: SuggestionSummary) =>
            (unreadMap[b.id] || 0) - (unreadMap[a.id] || 0)
        );
        setSuggestions(active);

        const withUnread = active
          .filter((s: SuggestionSummary) => (unreadMap[s.id] || 0) > 0)
          .map((s: SuggestionSummary) => s.id);
        setExpandedSuggestions(new Set(withUnread));

        // Fetch last messages in background
        for (const s of active) {
          fetchLastMessages(s);
        }
      } catch {
        console.error('Failed to load suggestions');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [unreadMap]);

  const fetchLastMessages = async (s: SuggestionSummary) => {
    try {
      const res = await fetch(`/api/matchmaker/suggestions/${s.id}/chat`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.messages?.length) return;

      const msgs: ChatMessage[] = data.messages;

      const firstPartyMsgs = msgs.filter(
        (m) =>
          (m.senderType === 'user' && m.senderId === s.firstParty.id) ||
          (m.senderType === 'matchmaker' && m.targetUserId === s.firstParty.id) ||
          (m.senderType === 'matchmaker' && !m.targetUserId)
      );
      const secondPartyMsgs = msgs.filter(
        (m) =>
          (m.senderType === 'user' && m.senderId === s.secondParty.id) ||
          (m.senderType === 'matchmaker' && m.targetUserId === s.secondParty.id) ||
          (m.senderType === 'matchmaker' && !m.targetUserId)
      );

      const lastFirst = firstPartyMsgs[firstPartyMsgs.length - 1];
      const lastSecond = secondPartyMsgs[secondPartyMsgs.length - 1];

      setLastMessages((prev) => ({
        ...prev,
        [s.id]: {
          firstParty: lastFirst
            ? { content: lastFirst.content, time: lastFirst.createdAt, senderType: lastFirst.senderType }
            : undefined,
          secondParty: lastSecond
            ? { content: lastSecond.content, time: lastSecond.createdAt, senderType: lastSecond.senderType }
            : undefined,
        },
      }));
    } catch {
      /* silent */
    }
  };

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

  const openChat = (suggestion: SuggestionSummary, isFirstParty: boolean) => {
    const party = isFirstParty ? suggestion.firstParty : suggestion.secondParty;
    setSelectedChat({
      suggestionId: suggestion.id,
      partyId: party.id,
      partyName: `${party.firstName} ${party.lastName}`,
      isFirstParty,
      suggestionName: `${suggestion.firstParty.firstName} & ${suggestion.secondParty.firstName}`,
    });
  };

  const closeChat = () => {
    setSelectedChat(null);
    onMessagesRead();
  };

  const getStatusLabel = (status: string) => t.statusLabels[status] || status;

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  // ========== Chat View ==========
  if (selectedChat) {
    return (
      <Card className="shadow-lg border-0 overflow-hidden bg-white">
        <CardContent className="p-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-teal-50 to-amber-50/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-teal-50"
            >
              {/* CSS logical: chevron-left in RTL already points right */}
              <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
              {t.backToList}
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
                <p className="font-semibold text-gray-800 text-sm leading-tight">
                  {selectedChat.partyName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedChat.isFirstParty ? t.partyLabels.partyA : t.partyLabels.partyB}
                  {' · '}
                  {selectedChat.suggestionName}
                </p>
              </div>
            </div>
          </div>

          <ChatView
            suggestionId={selectedChat.suggestionId}
            targetUserId={selectedChat.partyId}
            targetUserName={selectedChat.partyName}
            isFirstParty={selectedChat.isFirstParty}
            locale={locale}
            onMessagesRead={onMessagesRead}
            dict={t}
          />
        </CardContent>
      </Card>
    );
  }

  // ========== Suggestion List ==========
  const totalNewMessages = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  return (
    <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardContent className="p-0">
        {/* List header */}
        <div className="px-5 py-4 border-b bg-gradient-to-r from-teal-50 to-amber-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-semibold text-gray-800">
                {suggestions.length} {t.activeSuggestions}
              </span>
            </div>
            {totalNewMessages > 0 && (
              <Badge className="bg-amber-500 text-white border-0 text-xs px-2.5 py-1 shadow-sm">
                {totalNewMessages} {isHe ? 'חדשות' : 'new'}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          {suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t.noActiveSuggestions}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestions.map((s) => {
                const isExpanded = expandedSuggestions.has(s.id);
                const statusLabel = getStatusLabel(s.status);
                const unread = unreadMap[s.id] || 0;
                const lastMsgData = lastMessages[s.id];

                return (
                  <div key={s.id}>
                    {/* Suggestion row */}
                    <button
                      onClick={() => toggleExpand(s.id)}
                      className={cn(
                        'w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-start',
                        unread > 0 && 'bg-teal-50/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-11 h-11 shadow-sm ring-2 ring-white">
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-bold">
                              {getInitials(`${s.firstParty.firstName} ${s.firstParty.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="w-7 h-7 absolute -bottom-0.5 -end-2 shadow-sm ring-2 ring-white">
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[9px] font-bold">
                              {getInitials(`${s.secondParty.firstName} ${s.secondParty.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {s.firstParty.firstName} & {s.secondParty.firstName}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 mt-0.5 bg-gray-100 text-gray-600"
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {unread > 0 && (
                          <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5 border-0 shadow-sm animate-pulse">
                            {unread}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded party cards */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 space-y-2 bg-gray-50/50">
                        <PartyCard
                          name={`${s.firstParty.firstName} ${s.firstParty.lastName}`}
                          partyLabel={t.partyLabels.partyA}
                          lastMessage={lastMsgData?.firstParty}
                          colorFrom="from-teal-400"
                          colorTo="to-cyan-500"
                          borderHover="hover:border-teal-300 hover:bg-teal-50/40"
                          badgeColor="border-teal-200 text-teal-700"
                          locale={locale}
                          dict={t}
                          onClick={() => openChat(s, true)}
                        />
                        <PartyCard
                          name={`${s.secondParty.firstName} ${s.secondParty.lastName}`}
                          partyLabel={t.partyLabels.partyB}
                          lastMessage={lastMsgData?.secondParty}
                          colorFrom="from-amber-400"
                          colorTo="to-orange-500"
                          borderHover="hover:border-amber-300 hover:bg-amber-50/40"
                          badgeColor="border-amber-200 text-amber-700"
                          locale={locale}
                          dict={t}
                          onClick={() => openChat(s, false)}
                        />
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

// ==========================================
// Party Card
// ==========================================

interface PartyCardProps {
  name: string;
  partyLabel: string;
  lastMessage?: LastMessageInfo;
  colorFrom: string;
  colorTo: string;
  borderHover: string;
  badgeColor: string;
  locale: Locale;
  dict: MatchmakerMessagesDict['chatPanel'];
  onClick: () => void;
}

function PartyCard({
  name,
  partyLabel,
  lastMessage,
  colorFrom,
  colorTo,
  borderHover,
  badgeColor,
  locale,
  dict: t,
  onClick,
}: PartyCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-xl bg-white border border-gray-200 transition-all flex items-center gap-3 shadow-sm text-start',
        borderHover
      )}
    >
      <Avatar className="w-10 h-10 shadow-sm flex-shrink-0">
        <AvatarFallback className={cn('text-white text-sm font-bold bg-gradient-to-br', colorFrom, colorTo)}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-medium text-gray-800 text-sm">{name}</p>
          <div className="flex items-center gap-1.5">
            {lastMessage && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatMessageTime(lastMessage.time, locale, t)}
              </span>
            )}
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', badgeColor)}>
              {partyLabel}
            </Badge>
          </div>
        </div>
        {lastMessage ? (
          <p className="text-xs text-gray-500 truncate">
            {lastMessage.senderType === 'matchmaker' && (
              <span className="text-teal-600 font-medium">{t.you}: </span>
            )}
            {truncate(lastMessage.content, 50)}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">{t.clickToChat}</p>
        )}
      </div>
      {/* Logical arrow: in RTL chevron-left already points correct direction */}
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 rtl:-scale-x-100" />
    </button>
  );
}

// ==========================================
// Chat View
// ==========================================

interface ChatViewProps {
  suggestionId: string;
  targetUserId: string;
  targetUserName: string;
  isFirstParty: boolean;
  locale: Locale;
  onMessagesRead: () => void;
  dict: MatchmakerMessagesDict['chatPanel'];
}

function ChatView({
  suggestionId,
  targetUserId,
  targetUserName,
  isFirstParty,
  locale,
  onMessagesRead,
  dict: t,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.unreadCount > 0) {
          await fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`, { method: 'PATCH' });
          onMessagesRead();
        }
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId, onMessagesRead]);

  useEffect(() => {
    setIsLoading(true);
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 12000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredMessages = messages.filter((msg) => {
    if (msg.senderType === 'system') return true;
    if (msg.senderType === 'user') return msg.senderId === targetUserId;
    if (msg.senderType === 'matchmaker') {
      if (!msg.targetUserId) return true;
      return msg.targetUserId === targetUserId;
    }
    return true;
  });

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim(), targetUserId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send');
      }
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error(t.sendError);
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

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderType === 'matchmaker') return t.senderLabels.matchmaker;
    if (msg.senderType === 'system') return t.senderLabels.system;
    return msg.senderName;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[550px]">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-teal-300" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">{t.noMessages}</h3>
            <p className="text-sm text-gray-400 max-w-xs">{t.noMessagesDescription}</p>
          </div>
        ) : (
          <div className="space-y-3 py-4" dir="ltr">
            {filteredMessages.map((msg) => {
              const isMatchmaker = msg.senderType === 'matchmaker';
              const isSystem = msg.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-500 text-[11px] px-3 py-1.5 rounded-full">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2.5',
                    isMatchmaker ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                    <AvatarFallback
                      className={cn(
                        'text-white text-xs font-bold bg-gradient-to-br',
                        isMatchmaker
                          ? 'from-teal-500 to-teal-600'
                          : isFirstParty
                            ? 'from-teal-400 to-cyan-500'
                            : 'from-amber-400 to-orange-500'
                      )}
                    >
                      {isMatchmaker ? <Bot className="w-4 h-4" /> : getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    dir={isHe ? 'rtl' : 'ltr'}
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      isMatchmaker
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-tr-md'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-md'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-medium block mb-1',
                        isMatchmaker ? 'text-teal-100' : 'text-gray-400'
                      )}
                    >
                      {getSenderLabel(msg)}
                    </span>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1.5',
                      isMatchmaker ? 'justify-start' : 'justify-end'
                    )}>
                      <span
                        className={cn(
                          'text-[10px]',
                          isMatchmaker ? 'text-teal-200' : 'text-gray-400'
                        )}
                      >
                        {format(new Date(msg.createdAt), 'HH:mm', {
                          locale: isHe ? he : enUS,
                        })}
                      </span>
                      {isMatchmaker && (
                        <CheckCheck
                          className={cn('w-3.5 h-3.5', msg.isRead ? 'text-teal-200' : 'text-teal-300/50')}
                        />
                      )}
                      {!msg.isRead && !isMatchmaker && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-3">
        {/* "Sending to" banner */}
        <div
          className={cn(
            'flex items-center gap-2 mb-2.5 px-3 py-2 rounded-lg text-xs',
            isFirstParty ? 'bg-teal-50 border border-teal-100' : 'bg-amber-50 border border-amber-100'
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isFirstParty ? 'bg-teal-400' : 'bg-amber-400'
            )}
          />
          <span className="text-gray-600">
            {t.sendingTo}{' '}
            <span className={cn('font-semibold', isFirstParty ? 'text-teal-700' : 'text-amber-700')}>
              {targetUserName}
            </span>
          </span>
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-xl h-11 w-11 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md transition-all disabled:opacity-40"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}