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
  ArrowLeft,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
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
// Component
// ==========================================

export default function MatchmakerChatPanel({ locale }: MatchmakerChatPanelProps) {
  const [chatSummaries, setChatSummaries] = useState<SuggestionChatSummary[]>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
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

      // Build summaries
      const summaries: SuggestionChatSummary[] = suggestions
        .filter((s: { category: string }) => s.category !== 'HISTORY')
        .map((s: {
          id: string;
          status: string;
          firstParty: { id: string; firstName: string; lastName: string };
          secondParty: { id: string; firstName: string; lastName: string };
        }) => {
          const suggestionUnread = unreadMap[s.id] || 0;
          
          return {
            suggestionId: s.id,
            firstParty: {
              id: s.firstParty.id,
              name: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
              unreadCount: 0, // Will be updated separately if needed
            },
            secondParty: {
              id: s.secondParty.id,
              name: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
              unreadCount: 0,
            },
            status: s.status,
            totalUnread: suggestionUnread,
          };
        })
        .sort((a: SuggestionChatSummary, b: SuggestionChatSummary) => 
          b.totalUnread - a.totalUnread
        );

      setChatSummaries(summaries);

      // Auto-expand suggestions with unread messages
      const withUnread = summaries
        .filter((s: SuggestionChatSummary) => s.totalUnread > 0)
        .map((s: SuggestionChatSummary) => s.suggestionId);
      setExpandedSuggestions(new Set(withUnread));

    } catch (error) {
      console.error('Error loading chat summaries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    loadChatSummaries(); // Refresh to update unread counts
  };

  // ==========================================
  // Helpers
  // ==========================================

  const totalUnread = chatSummaries.reduce((sum, s) => sum + s.totalUnread, 0);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { he: string; en: string; color: string }> = {
      PENDING_FIRST_PARTY: { he: "ממתין לצד א'", en: 'Pending Party A', color: 'bg-yellow-100 text-yellow-700' },
      PENDING_SECOND_PARTY: { he: "ממתין לצד ב'", en: 'Pending Party B', color: 'bg-blue-100 text-blue-700' },
      FIRST_PARTY_APPROVED: { he: "צד א' אישר", en: 'Party A Approved', color: 'bg-green-100 text-green-700' },
      SECOND_PARTY_APPROVED: { he: "צד ב' אישר", en: 'Party B Approved', color: 'bg-green-100 text-green-700' },
      CONTACT_DETAILS_SHARED: { he: 'פרטי קשר נשלחו', en: 'Details Shared', color: 'bg-purple-100 text-purple-700' },
      DATING: { he: 'בדייט', en: 'Dating', color: 'bg-pink-100 text-pink-700' },
    };
    const info = labels[status] || { he: status, en: status, color: 'bg-gray-100 text-gray-700' };
    return { label: isHe ? info.he : info.en, color: info.color };
  };

  // ==========================================
  // Render - Chat View
  // ==========================================

  if (selectedChat) {
    return (
      <Card className="shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="gap-1 text-gray-600 hover:text-gray-900"
            >
              {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isHe ? 'חזרה' : 'Back'}
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 shadow-sm">
                <AvatarFallback
                  className={cn(
                    'text-white text-xs font-bold bg-gradient-to-br',
                    selectedChat.isFirstParty
                      ? 'from-blue-400 to-cyan-400'
                      : 'from-emerald-400 to-green-400'
                  )}
                >
                  {getInitials(selectedChat.partyName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-800">{selectedChat.partyName}</p>
                <p className="text-xs text-gray-500">
                  {selectedChat.isFirstParty
                    ? (isHe ? "צד א'" : 'Party A')
                    : (isHe ? "צד ב'" : 'Party B')}
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
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
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
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 px-3 py-1 text-sm shadow-md">
              {totalUnread} {isHe ? 'חדשות' : 'new'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {chatSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
              <Inbox className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {isHe ? 'אין הצעות פעילות כרגע' : 'No active suggestions'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {chatSummaries.map((summary) => {
                const isExpanded = expandedSuggestions.has(summary.suggestionId);
                const statusInfo = getStatusLabel(summary.status);

                return (
                  <div key={summary.suggestionId} className="bg-white">
                    {/* Suggestion Header */}
                    <button
                      onClick={() => toggleExpand(summary.suggestionId)}
                      className={cn(
                        'w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors',
                        isHe ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Combined Avatar */}
                        <div className="relative">
                          <Avatar className="w-10 h-10 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-xs font-bold">
                              {getInitials(summary.firstParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar
                            className={cn(
                              'w-7 h-7 absolute -bottom-1 shadow-sm border-2 border-white',
                              isHe ? '-left-2' : '-right-2'
                            )}
                          >
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-400 text-white text-[9px] font-bold">
                              {getInitials(summary.secondParty.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">
                            {summary.firstParty.name.split(' ')[0]} &{' '}
                            {summary.secondParty.name.split(' ')[0]}
                          </p>
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] px-1.5 py-0 mt-1', statusInfo.color)}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {summary.totalUnread > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 border-0">
                            {summary.totalUnread}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded: Party Cards */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 bg-gray-50/50">
                        {/* First Party Chat Card */}
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
                            'w-full p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center gap-3 shadow-sm',
                            isHe ? 'text-right' : 'text-left'
                          )}
                        >
                          <Avatar className="w-10 h-10 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-sm font-bold">
                              {getInitials(summary.firstParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800">
                                {summary.firstParty.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-blue-200 text-blue-600"
                              >
                                {isHe ? "צד א'" : 'Party A'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {isHe ? 'לחץ/י לפתיחת שיחה' : 'Click to open chat'}
                            </p>
                          </div>
                          {isHe ? (
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {/* Second Party Chat Card */}
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
                            'w-full p-3 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 shadow-sm',
                            isHe ? 'text-right' : 'text-left'
                          )}
                        >
                          <Avatar className="w-10 h-10 shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-400 text-white text-sm font-bold">
                              {getInitials(summary.secondParty.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800">
                                {summary.secondParty.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald-200 text-emerald-600"
                              >
                                {isHe ? "צד ב'" : 'Party B'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {isHe ? 'לחץ/י לפתיחת שיחה' : 'Click to open chat'}
                            </p>
                          </div>
                          {isHe ? (
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
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