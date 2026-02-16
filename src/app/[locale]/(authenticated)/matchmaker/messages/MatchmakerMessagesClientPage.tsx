// src/app/[locale]/(authenticated)/matchmaker/messages/MatchmakerMessagesClientPage.tsx
// ==========================================
// NeshamaTech - Matchmaker Messages Page (Client)
// Two tabs:
// 1. צ'אט עם מועמדים (Chat with candidates)
// 2. בקשות זמינות (Availability inquiries - existing MessagesPage)
// ==========================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format, formatDistanceToNow } from 'date-fns';
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

// ==========================================
// Main Component
// ==========================================

interface MatchmakerMessagesClientPageProps {
  locale: Locale;
}

export default function MatchmakerMessagesClientPage({
  locale,
}: MatchmakerMessagesClientPageProps) {
  const { data: session } = useSession();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const isHe = locale === 'he';

  // Fetch unread counts
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
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            {isHe ? 'מרכז הודעות' : 'Message Center'}
          </h1>
          <p className="text-lg text-gray-600">
            {isHe
              ? 'נהל/י תקשורת עם מועמדים ובקשות זמינות'
              : 'Manage communication with candidates and availability requests'}
          </p>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="chat" dir={isHe ? 'rtl' : 'ltr'}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg border border-gray-200/50 h-auto">
              <TabsTrigger
                value="chat"
                className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all relative gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {isHe ? 'צ\'אט עם מועמדים' : 'Chat with Candidates'}
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
                {isHe ? 'בקשות זמינות' : 'Availability Requests'}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="mt-0">
            <ChatPanel
              locale={locale}
              unreadMap={unreadMap}
              onMessagesRead={fetchUnread}
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
// Chat Panel - Embedded (replaces separate file)
// ==========================================

interface ChatPanelProps {
  locale: Locale;
  unreadMap: Record<string, number>;
  onMessagesRead: () => void;
}

function ChatPanel({ locale, unreadMap, onMessagesRead }: ChatPanelProps) {
  const [suggestions, setSuggestions] = useState<SuggestionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isHe = locale === 'he';

  // Load suggestions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/matchmaker/suggestions');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const active = data.filter(
          (s: SuggestionSummary & { category?: string }) => s.category !== 'HISTORY'
        );
        // Sort: suggestions with unread messages first
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { he: string; en: string; color: string }> = {
      PENDING_FIRST_PARTY: { he: 'ממתין לצד א\'', en: 'Pending A', color: 'bg-yellow-100 text-yellow-700' },
      PENDING_SECOND_PARTY: { he: 'ממתין לצד ב\'', en: 'Pending B', color: 'bg-blue-100 text-blue-700' },
      FIRST_PARTY_APPROVED: { he: 'צד א\' אישר', en: 'A Approved', color: 'bg-green-100 text-green-700' },
      SECOND_PARTY_APPROVED: { he: 'צד ב\' אישר', en: 'B Approved', color: 'bg-green-100 text-green-700' },
      CONTACT_DETAILS_SHARED: { he: 'פרטי קשר נשלחו', en: 'Shared', color: 'bg-purple-100 text-purple-700' },
      DATING: { he: 'בדייטים', en: 'Dating', color: 'bg-pink-100 text-pink-700' },
      AWAITING_FIRST_DATE_FEEDBACK: { he: 'ממתין למשוב', en: 'Feedback', color: 'bg-orange-100 text-orange-700' },
    };
    const info = labels[status] || { he: status, en: status, color: 'bg-gray-100 text-gray-700' };
    return { label: isHe ? info.he : info.en, color: info.color };
  };

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
          {/* Left/Right sidebar - Suggestion list */}
          <div
            className={cn(
              'w-full md:w-80 flex-shrink-0 flex flex-col bg-white',
              isHe ? 'md:border-l' : 'md:border-r',
              selectedId ? 'hidden md:flex' : 'flex'
            )}
          >
            {/* Sidebar header */}
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-medium text-gray-700">
                  {suggestions.length} {isHe ? 'הצעות פעילות' : 'active suggestions'}
                </span>
              </div>
            </div>

            {/* Suggestion list */}
            <ScrollArea className="flex-1">
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
                  <Inbox className="w-14 h-14 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">
                    {isHe ? 'אין הצעות פעילות כרגע' : 'No active suggestions'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {suggestions.map((s) => {
                    const isSelected = selectedId === s.id;
                    const statusInfo = getStatusLabel(s.status);
                    const unread = unreadMap[s.id] || 0;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={cn(
                          'w-full p-3.5 transition-all duration-200 hover:bg-gray-50',
                          isHe ? 'text-right' : 'text-left',
                          isSelected && 'bg-purple-50/70 border-purple-400',
                          isSelected && (isHe ? 'border-r-3' : 'border-l-3')
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Overlapping avatars */}
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

                          {/* Names + status */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-gray-800 truncate">
                                {s.firstParty.firstName} & {s.secondParty.firstName}
                              </span>
                              {unread > 0 && (
                                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center border-0 shadow-sm animate-pulse">
                                  {unread}
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] px-1.5 py-0 font-normal',
                                statusInfo.color
                              )}
                            >
                              {statusInfo.label}
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

          {/* Main area - Chat view */}
          <div
            className={cn(
              'flex-1 flex flex-col bg-gray-50/30',
              !selectedId ? 'hidden md:flex' : 'flex'
            )}
          >
            {selectedId ? (
              <>
                {/* Mobile back button */}
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
                    {isHe ? 'חזרה' : 'Back'}
                  </Button>
                </div>
                <ChatView
                  suggestionId={selectedId}
                  locale={locale}
                  onMessagesRead={onMessagesRead}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {isHe
                    ? 'בחר/י הצעה כדי לפתוח צ\'אט'
                    : 'Select a suggestion to open chat'}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {isHe
                    ? 'כאן תוכל/י לנהל שיחות עם המועמדים בנוגע להצעות שידוך'
                    : 'Manage conversations with candidates about suggestions'}
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
// Chat View - Shows messages for one suggestion
// ==========================================

interface ChatViewProps {
  suggestionId: string;
  locale: Locale;
  onMessagesRead: () => void;
}

function ChatView({ suggestionId, locale, onMessagesRead }: ChatViewProps) {
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

  // Fetch messages
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

        // Mark as read if there are unread messages
        if (data.unreadCount > 0) {
          await fetch(
            `/api/matchmaker/suggestions/${suggestionId}/chat`,
            { method: 'PATCH' }
          );
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
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
      toast.error(isHe ? 'שגיאה בשליחת ההודעה' : 'Failed to send message');
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

  // Helpers
  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderType === 'matchmaker')
      return isHe ? 'את/ה (שדכן)' : 'You (Matchmaker)';
    if (msg.senderType === 'system') return isHe ? 'מערכת' : 'System';
    if (msg.isFirstParty && parties.firstParty) return parties.firstParty.name;
    if (msg.isSecondParty && parties.secondParty)
      return parties.secondParty.name;
    return msg.senderName;
  };

  const getPartyLabel = (msg: ChatMessage) => {
    if (msg.isFirstParty) return isHe ? 'צד א\'' : 'Party A';
    if (msg.isSecondParty) return isHe ? 'צד ב\'' : 'Party B';
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
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-gray-700">
            {parties.firstParty && parties.secondParty
              ? `${parties.firstParty.name} & ${parties.secondParty.name}`
              : isHe
              ? 'הודעות'
              : 'Messages'}
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

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">
              {isHe ? 'אין הודעות עדיין' : 'No messages yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {isHe
                ? 'שלח/י הודעה למועמדים בהקשר של ההצעה הזו'
                : 'Send a message to candidates about this suggestion'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {messages.map((msg) => {
              const isMatchmaker = msg.senderType === 'matchmaker';
              const isSystem = msg.senderType === 'system';
              const partyLabel = getPartyLabel(msg);

              // System message
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
                  {/* Avatar */}
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

                  {/* Bubble */}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      isMatchmaker
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    )}
                  >
                    {/* Sender */}
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

                    {/* Content */}
                    <p
                      className={cn(
                        'text-sm leading-relaxed whitespace-pre-wrap',
                        isHe ? 'text-right' : 'text-left'
                      )}
                    >
                      {msg.content}
                    </p>

                    {/* Time */}
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

      {/* Input area */}
      <div className="border-t bg-white p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isHe ? 'כתוב/י הודעה...' : 'Type a message...'}
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

        {/* Party labels */}
        {parties.firstParty && parties.secondParty && (
          <div
            className={cn(
              'flex items-center gap-3 mt-2 text-xs text-gray-400',
              isHe ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {isHe ? 'צד א\'' : 'A'}: {parties.firstParty.name}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isHe ? 'צד ב\'' : 'B'}: {parties.secondParty.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}