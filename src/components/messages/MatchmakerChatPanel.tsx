// src/components/messages/MatchmakerChatPanel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
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

interface SelectedChat {
  suggestionId: string;
  partyId: string;
  partyName: string;
  isFirstParty: boolean;
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

// ==========================================
// Component
// ==========================================

export default function MatchmakerChatPanel({
  locale,
}: MatchmakerChatPanelProps) {
  const [chatSummaries, setChatSummaries] = useState<SuggestionChatSummary[]>(
    []
  );
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isHe = locale === 'he';

  // ==========================================
  // Load data
  // ==========================================

  const loadChatSummaries = useCallback(async () => {
    try {
      const [suggestionsRes, unreadRes] = await Promise.all([
        fetch('/api/matchmaker/suggestions'),
        fetch('/api/matchmaker/chat/unread'),
      ]);

      if (!suggestionsRes.ok) throw new Error('Failed to fetch suggestions');

      const suggestions = await suggestionsRes.json();
      let unreadData: { bySuggestion?: Record<string, number> } = {};
      if (unreadRes.ok) {
        unreadData = await unreadRes.json();
      }
      const unreadMap = unreadData.bySuggestion || {};

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

      const withUnread = summaries
        .filter((s: SuggestionChatSummary) => s.totalUnread > 0)
        .map((s: SuggestionChatSummary) => s.suggestionId);
      setExpandedSuggestions(new Set(withUnread));

      // Fetch last messages per suggestion in background
      for (const summary of summaries) {
        fetchLastMessagesForSummary(summary, suggestions);
      }
    } catch (error) {
      console.error('Error loading chat summaries:', error);
    } finally {
      setIsLoading(false);
    }
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

  // ==========================================
  // Helpers
  // ==========================================

  const totalUnread = chatSummaries.reduce((sum, s) => sum + s.totalUnread, 0);

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

  return (
    <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50/40 border-b">
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
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {chatSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">
                {isHe ? 'אין הצעות פעילות כרגע' : 'No active suggestions'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chatSummaries.map((summary) => {
                const isExpanded = expandedSuggestions.has(
                  summary.suggestionId
                );
                const statusInfo = getStatusLabel(summary.status);

                return (
                  <div key={summary.suggestionId}>
                    {/* Suggestion Header */}
                    <button
                      onClick={() => toggleExpand(summary.suggestionId)}
                      className={cn(
                        'w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-start',
                        summary.totalUnread > 0 && 'bg-teal-50/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-11 h-11 shadow-sm ring-2 ring-white">
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-xs font-bold">
                              {getInitials(summary.firstParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="w-7 h-7 absolute -bottom-0.5 -end-2 shadow-sm ring-2 ring-white">
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[9px] font-bold">
                              {getInitials(summary.secondParty.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {summary.firstParty.name.split(' ')[0]} &{' '}
                            {summary.secondParty.name.split(' ')[0]}
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
                          className="w-full p-3 rounded-xl bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all flex items-center gap-3 shadow-sm text-start"
                        >
                          <Avatar className="w-10 h-10 shadow-sm flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-sm font-bold">
                              {getInitials(summary.firstParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-medium text-gray-800 text-sm">
                                {summary.firstParty.name}
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
                          className="w-full p-3 rounded-xl bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all flex items-center gap-3 shadow-sm text-start"
                        >
                          <Avatar className="w-10 h-10 shadow-sm flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold">
                              {getInitials(summary.secondParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-medium text-gray-800 text-sm">
                                {summary.secondParty.name}
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
