// src/components/messages/MatchmakerChatPanel.tsx
// ==========================================
// NeshamaTech - Matchmaker Chat Panel 
// Standalone panel for the Messages page
// Shows all suggestion chats with unread badges
// ==========================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Users,
  Inbox,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import SuggestionChatTab from '../matchmaker/suggestions/details/SuggestionChatTab';
import type { Locale } from '../../../i18n-config';

// ==========================================
// Types
// ==========================================

interface SuggestionChatSummary {
  suggestionId: string;
  firstPartyName: string;
  secondPartyName: string;
  lastMessage?: {
    content: string;
    senderType: string;
    createdAt: string;
  };
  unreadCount: number;
  status: string;
}

interface MatchmakerChatPanelProps {
  locale: Locale;
}

// ==========================================
// Component
// ==========================================

export default function MatchmakerChatPanel({ locale }: MatchmakerChatPanelProps) {
  const [chatSummaries, setChatSummaries] = useState<SuggestionChatSummary[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const isHe = locale === 'he';

  // ==========================================
  // Load suggestions with messages
  // ==========================================

  const loadChatSummaries = useCallback(async () => {
    try {
      // 1. Get all suggestions
      const suggestionsRes = await fetch('/api/matchmaker/suggestions');
      if (!suggestionsRes.ok) throw new Error('Failed to fetch suggestions');
      const suggestions = await suggestionsRes.json();

      // 2. Get unread counts
      const unreadRes = await fetch('/api/matchmaker/chat/unread');
      let unreadData: { bySuggestion?: Record<string, number> } = {};
      if (unreadRes.ok) {
        unreadData = await unreadRes.json();
      }
      const unread = unreadData.bySuggestion || {};
      setUnreadMap(unread);

      // 3. Build summaries - only include suggestions that have messages or unread
      // For now, we show all active suggestions (matchmaker can message any)
      const summaries: SuggestionChatSummary[] = suggestions
        .filter((s: { category: string }) => s.category !== 'HISTORY')
        .map((s: {
          id: string;
          status: string;
          firstParty: { firstName: string; lastName: string };
          secondParty: { firstName: string; lastName: string };
        }) => ({
          suggestionId: s.id,
          firstPartyName: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
          secondPartyName: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
          unreadCount: unread[s.id] || 0,
          status: s.status,
        }))
        .sort((a: SuggestionChatSummary, b: SuggestionChatSummary) => b.unreadCount - a.unreadCount);

      setChatSummaries(summaries);
    } catch (error) {
      console.error('Error loading chat summaries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChatSummaries();
    const interval = setInterval(loadChatSummaries, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadChatSummaries]);

  // ==========================================
  // Helpers
  // ==========================================

  const totalUnread = Object.values(unreadMap).reduce((sum, n) => sum + n, 0);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { he: string; en: string; color: string }> = {
      PENDING_FIRST_PARTY: { he: 'ממתין לצד א\'', en: 'Pending Party A', color: 'bg-yellow-100 text-yellow-700' },
      PENDING_SECOND_PARTY: { he: 'ממתין לצד ב\'', en: 'Pending Party B', color: 'bg-blue-100 text-blue-700' },
      FIRST_PARTY_APPROVED: { he: 'צד א\' אישר', en: 'Party A Approved', color: 'bg-green-100 text-green-700' },
      SECOND_PARTY_APPROVED: { he: 'צד ב\' אישר', en: 'Party B Approved', color: 'bg-green-100 text-green-700' },
      CONTACT_DETAILS_SHARED: { he: 'פרטי קשר נשלחו', en: 'Details Shared', color: 'bg-purple-100 text-purple-700' },
      DATING: { he: 'בדייט', en: 'Dating', color: 'bg-pink-100 text-pink-700' },
    };
    const info = labels[status] || { he: status, en: status, color: 'bg-gray-100 text-gray-700' };
    return { label: isHe ? info.he : info.en, color: info.color };
  };

  // ==========================================
  // Render
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
                {isHe ? 'צ\'אט עם מועמדים' : 'Chat with Candidates'}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {isHe ? 'הודעות פנימיות על הצעות שידוך' : 'Internal messages about suggestions'}
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
        <div className="flex h-[600px]">
          {/* Left panel - Chat list */}
          <div className={cn(
            'w-80 border-l flex flex-col',
            isHe ? 'border-l' : 'border-r',
            selectedSuggestionId ? 'hidden md:flex' : 'flex w-full md:w-80'
          )}>
            <div className="p-3 border-b bg-gray-50/50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  {chatSummaries.length} {isHe ? 'הצעות פעילות' : 'active suggestions'}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1">
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
                    const isSelected = selectedSuggestionId === summary.suggestionId;
                    const statusInfo = getStatusLabel(summary.status);

                    return (
                      <button
                        key={summary.suggestionId}
                        onClick={() => setSelectedSuggestionId(summary.suggestionId)}
                        className={cn(
                          'w-full p-3 transition-all duration-200 hover:bg-gray-50',
                          isHe ? 'text-right' : 'text-left',
                          isSelected && 'bg-purple-50 border-r-2 border-purple-500'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Combined avatar */}
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-10 h-10 shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white text-xs font-bold">
                                {getInitials(summary.firstPartyName)}
                              </AvatarFallback>
                            </Avatar>
                            <Avatar className={cn(
                              'w-7 h-7 absolute -bottom-1 shadow-sm border-2 border-white',
                              isHe ? '-left-2' : '-right-2'
                            )}>
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-400 text-white text-[9px] font-bold">
                                {getInitials(summary.secondPartyName)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-sm text-gray-800 truncate">
                                {summary.firstPartyName.split(' ')[0]} & {summary.secondPartyName.split(' ')[0]}
                              </span>
                              {summary.unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center border-0">
                                  {summary.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', statusInfo.color)}>
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

          {/* Right panel - Chat view */}
          <div className={cn(
            'flex-1 flex flex-col',
            !selectedSuggestionId ? 'hidden md:flex' : 'flex'
          )}>
            {selectedSuggestionId ? (
              <>
                {/* Back button on mobile */}
                <div className="md:hidden border-b p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSuggestionId(null)}
                    className="gap-1"
                  >
                    {isHe ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {isHe ? 'חזרה לרשימה' : 'Back to list'}
                  </Button>
                </div>
                <SuggestionChatTab
                  suggestionId={selectedSuggestionId}
                  locale={locale}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  {isHe ? 'בחר/י הצעה כדי לפתוח צ\'אט' : 'Select a suggestion to open chat'}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {isHe
                    ? 'כאן תוכל/י לנהל שיחות עם המועמדים בנוגע להצעות שידוך'
                    : 'Here you can manage conversations with candidates about suggestions'}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
