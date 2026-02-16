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
  ChevronLeft,
  ChevronRight,
  Users,
  Inbox,
  Send,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
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
  firstParty: { firstName: string; lastName: string };
  secondParty: { firstName: string; lastName: string };
  category?: string;
}

// Dictionary type
interface MatchmakerMessagesDict {
  header: { title: string; subtitle: string };
  tabs: { chat: string; availability: string };
  chatPanel: {
    activeSuggestions: string;
    noActiveSuggestions: string;
    selectSuggestion: string;
    selectSuggestionDescription: string;
    back: string;
    noMessages: string;
    noMessagesDescription: string;
    placeholder: string;
    sendError: string;
    messages: string;
    senderLabels: { matchmaker: string; system: string };
    partyLabels: { partyA: string; partyB: string };
    statusLabels: Record<string, string>;
  };
}

// Fallback (Hebrew)
const defaultDict: MatchmakerMessagesDict = {
  header: {
    title: 'מרכז הודעות',
    subtitle: 'נהל/י תקשורת עם מועמדים ובקשות זמינות',
  },
  tabs: { chat: "צ'אט עם מועמדים", availability: 'בקשות זמינות' },
  chatPanel: {
    activeSuggestions: 'הצעות פעילות',
    noActiveSuggestions: 'אין הצעות פעילות כרגע',
    selectSuggestion: "בחר/י הצעה כדי לפתוח צ'אט",
    selectSuggestionDescription:
      'כאן תוכל/י לנהל שיחות עם המועמדים בנוגע להצעות שידוך',
    back: 'חזרה',
    noMessages: 'אין הודעות עדיין',
    noMessagesDescription: 'שלח/י הודעה למועמדים בהקשר של ההצעה הזו',
    placeholder: 'כתוב/י הודעה...',
    sendError: 'שגיאה בשליחת ההודעה',
    messages: 'הודעות',
    senderLabels: { matchmaker: 'את/ה (שדכן)', system: 'מערכת' },
    partyLabels: { partyA: "צד א'", partyB: "צד ב'" },
    statusLabels: {
      PENDING_FIRST_PARTY: "ממתין לצד א'",
      PENDING_SECOND_PARTY: "ממתין לצד ב'",
      FIRST_PARTY_APPROVED: "צד א' אישר",
      SECOND_PARTY_APPROVED: "צד ב' אישר",
      CONTACT_DETAILS_SHARED: 'פרטי קשר נשלחו',
      DATING: 'בדייטים',
      AWAITING_FIRST_DATE_FEEDBACK: 'ממתין למשוב',
    },
  },
};

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
  const isHe = locale === 'he';

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
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-pink-50/20"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            {t.header.title}
          </h1>
          <p className="text-lg text-gray-600">{t.header.subtitle}</p>
        </header>

        <Tabs defaultValue="chat" dir={isHe ? 'rtl' : 'ltr'}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg border border-gray-200/50 h-auto">
              <TabsTrigger
                value="chat"
                className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all relative gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t.tabs.chat}
                {totalUnread > 0 && (
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[20px] h-5 border-0 shadow-md">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all gap-2"
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

function ChatPanel({
  locale,
  unreadMap,
  onMessagesRead,
  dict: t,
}: ChatPanelProps) {
  const [suggestions, setSuggestions] = useState<SuggestionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isHe = locale === 'he';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/matchmaker/suggestions');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const active = data.filter(
          (s: SuggestionSummary & { category?: string }) =>
            s.category !== 'HISTORY'
        );
        active.sort(
          (a: SuggestionSummary, b: SuggestionSummary) =>
            (unreadMap[b.id] || 0) - (unreadMap[a.id] || 0)
        );
        setSuggestions(active);
      } catch {
        console.error('Failed to load suggestions');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [unreadMap]);

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex h-[650px]">
          {/* Sidebar */}
          <div
            className={cn(
              'w-full md:w-80 flex-shrink-0 flex flex-col bg-white',
              isHe ? 'md:border-l' : 'md:border-r',
              selectedId ? 'hidden md:flex' : 'flex'
            )}
          >
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-medium text-gray-700">
                  {suggestions.length} {t.activeSuggestions}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
                  <Inbox className="w-14 h-14 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    {t.noActiveSuggestions}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {suggestions.map((s) => {
                    const isSelected = selectedId === s.id;
                    const statusLabel = t.statusLabels[s.status] || s.status;
                    const unread = unreadMap[s.id] || 0;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          'w-full p-3.5 transition-all duration-200 hover:bg-gray-50',
                          isHe ? 'text-right' : 'text-left',
                          isSelected && 'bg-purple-50/70',
                          isSelected &&
                            (isHe
                              ? 'border-r-3 border-purple-400'
                              : 'border-l-3 border-purple-400')
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-10 h-10 shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-xs font-bold">
                                {getInitials(
                                  `${s.firstParty.firstName} ${s.firstParty.lastName}`
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <Avatar
                              className={cn(
                                'w-7 h-7 absolute -bottom-1 shadow-sm border-2 border-white',
                                isHe ? '-left-2' : '-right-2'
                              )}
                            >
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-400 text-white text-[9px] font-bold">
                                {getInitials(
                                  `${s.secondParty.firstName} ${s.secondParty.lastName}`
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-gray-800 truncate">
                                {s.firstParty.firstName} &{' '}
                                {s.secondParty.firstName}
                              </span>
                              {unread > 0 && (
                                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] border-0 shadow-sm animate-pulse">
                                  {unread}
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-normal"
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div
            className={cn(
              'flex-1 flex flex-col bg-gray-50/30',
              !selectedId ? 'hidden md:flex' : 'flex'
            )}
          >
            {selectedId ? (
              <>
                <div className="md:hidden border-b bg-white p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedId(null)}
                    className="gap-1"
                  >
                    {isHe ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                    {t.back}
                  </Button>
                </div>
                <ChatView
                  suggestionId={selectedId}
                  locale={locale}
                  onMessagesRead={onMessagesRead}
                  dict={t}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {t.selectSuggestion}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {t.selectSuggestionDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// Chat View
// ==========================================

interface ChatViewProps {
  suggestionId: string;
  locale: Locale;
  onMessagesRead: () => void;
  dict: MatchmakerMessagesDict['chatPanel'];
}

function ChatView({
  suggestionId,
  locale,
  onMessagesRead,
  dict: t,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parties, setParties] = useState<{
    firstParty?: PartyInfo;
    secondParty?: PartyInfo;
  }>({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/chat`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setParties(data.parties || {});
        if (data.unreadCount > 0) {
          await fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`, {
            method: 'PATCH',
          });
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
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        textareaRef.current?.focus();
      }
    } catch {
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
    if (msg.isFirstParty && parties.firstParty) return parties.firstParty.name;
    if (msg.isSecondParty && parties.secondParty)
      return parties.secondParty.name;
    return msg.senderName;
  };

  const getPartyLabel = (msg: ChatMessage) => {
    if (msg.isFirstParty) return t.partyLabels.partyA;
    if (msg.isSecondParty) return t.partyLabels.partyB;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-gray-700">
            {parties.firstParty && parties.secondParty
              ? `${parties.firstParty.name} & ${parties.secondParty.name}`
              : t.messages}
          </span>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchMessages}
          className="text-gray-500 hover:text-purple-600"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">{t.noMessages}</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {t.noMessagesDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {messages.map((msg) => {
              const isMatchmaker = msg.senderType === 'matchmaker';
              const isSystem = msg.senderType === 'system';
              const partyLabel = getPartyLabel(msg);

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full">
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
                    isMatchmaker
                      ? isHe
                        ? 'flex-row-reverse'
                        : 'flex-row'
                      : isHe
                        ? 'flex-row'
                        : 'flex-row-reverse'
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                    <AvatarFallback
                      className={cn(
                        'text-white text-xs font-bold bg-gradient-to-br',
                        isMatchmaker
                          ? 'from-purple-500 to-pink-500'
                          : msg.isFirstParty
                            ? 'from-blue-500 to-cyan-500'
                            : 'from-emerald-500 to-green-500'
                      )}
                    >
                      {isMatchmaker ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        getInitials(msg.senderName)
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      isMatchmaker
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5 mb-1',
                        isHe ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isMatchmaker ? 'text-purple-100' : 'text-gray-500'
                        )}
                      >
                        {getSenderLabel(msg)}
                      </span>
                      {partyLabel && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            isMatchmaker
                              ? 'border-purple-300 text-purple-100'
                              : msg.isFirstParty
                                ? 'border-blue-300 text-blue-600'
                                : 'border-emerald-300 text-emerald-600'
                          )}
                        >
                          {partyLabel}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-sm leading-relaxed whitespace-pre-wrap',
                        isHe ? 'text-right' : 'text-left'
                      )}
                    >
                      {msg.content}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1',
                        isHe ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px]',
                          isMatchmaker ? 'text-purple-200' : 'text-gray-400'
                        )}
                      >
                        {format(new Date(msg.createdAt), 'HH:mm', {
                          locale: isHe ? he : enUS,
                        })}
                      </span>
                      {!msg.isRead && !isMatchmaker && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className={cn(
              'flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400',
              isHe ? 'text-right' : 'text-left'
            )}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className={cn(
              'rounded-xl h-11 w-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transition-all',
              isHe ? 'rotate-180' : ''
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {parties.firstParty && parties.secondParty && (
          <div
            className={cn(
              'flex items-center gap-3 mt-2 text-xs text-gray-400',
              isHe ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {t.partyLabels.partyA}: {parties.firstParty.name}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {t.partyLabels.partyB}: {parties.secondParty.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
