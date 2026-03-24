// src/components/matchmaker/suggestions/AiChatInsightsPanel.tsx
// =============================================================================
// AI Chat Insights Panel for Matchmaker Dashboard
// Shows summaries of AI conversations users had about suggestions
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Eye, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// TYPES
// =============================================================================

interface AiChatSummaryData {
  id: string;
  conversationId: string;
  suggestionId: string | null;
  userId: string;
  userName: string;
  summary: string;
  sentiment: string | null;
  keyInsights: string[] | null;
  messageCount: number;
  isRead: boolean;
  createdAt: string;
  suggestion: {
    id: string;
    status: string;
    firstPartyName: string;
    secondPartyName: string;
  } | null;
}

interface AiChatInsightsPanelProps {
  suggestionId?: string; // If set, shows only summaries for this suggestion
  className?: string;
}

// =============================================================================
// SENTIMENT HELPERS
// =============================================================================

const sentimentConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  POSITIVE: { label: 'חיובי', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  NEGATIVE: { label: 'שלילי', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200' },
  NEUTRAL: { label: 'ניטרלי', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' },
  HESITANT: { label: 'מתלבט/ת', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function AiChatInsightsPanel({ suggestionId, className }: AiChatInsightsPanelProps) {
  const [summaries, setSummaries] = useState<AiChatSummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchSummaries = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ limit: '10' });
      if (suggestionId) params.set('suggestionId', suggestionId);
      params.set('unreadOnly', 'false');

      const res = await fetch(`/api/ai-chat/summaries?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) {
        setSummaries(data.summaries || []);
      }
    } catch (err) {
      console.error('[AiChatInsights] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId]);

  useEffect(() => {
    void fetchSummaries();
  }, [fetchSummaries]);

  const markAsRead = useCallback(async (summaryId: string) => {
    try {
      await fetch('/api/ai-chat/summaries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryId }),
      });
      setSummaries((prev) =>
        prev.map((s) => (s.id === summaryId ? { ...s, isRead: true } : s))
      );
    } catch (err) {
      console.error('[AiChatInsights] Mark read error:', err);
    }
  }, []);

  const unreadCount = summaries.filter((s) => !s.isRead).length;

  if (isLoading || summaries.length === 0) return null;

  return (
    <div className={cn('rounded-xl border border-violet-200 bg-white overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-800">
            תובנות משיחות AI
          </span>
          {unreadCount > 0 && (
            <Badge className="bg-violet-500 text-white text-[10px] px-1.5 py-0">
              {unreadCount} חדשות
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-violet-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-violet-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {summaries.map((summary) => {
            const sentiment = sentimentConfig[summary.sentiment || 'NEUTRAL'];

            return (
              <div
                key={summary.id}
                className={cn(
                  'px-4 py-3 transition-colors',
                  !summary.isRead && 'bg-violet-50/30'
                )}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {summary.userName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 border', sentiment.bgColor, sentiment.color)}
                    >
                      {sentiment.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      {new Date(summary.createdAt).toLocaleDateString('he-IL')}
                    </span>
                    {!summary.isRead && (
                      <button
                        onClick={() => markAsRead(summary.id)}
                        className="text-[10px] text-violet-600 hover:text-violet-800 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Suggestion context */}
                {summary.suggestion && (
                  <p className="text-xs text-gray-500 mb-1">
                    {summary.suggestion.firstPartyName} ↔ {summary.suggestion.secondPartyName}
                  </p>
                )}

                {/* Summary */}
                <p className="text-sm text-gray-700 leading-relaxed mb-1.5">
                  {summary.summary}
                </p>

                {/* Key Insights */}
                {summary.keyInsights && (summary.keyInsights as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(summary.keyInsights as string[]).map((insight, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100"
                      >
                        <Lightbulb className="w-2.5 h-2.5" />
                        {insight}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message count */}
                <p className="text-[10px] text-gray-400 mt-1">
                  {summary.messageCount} הודעות בשיחה
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
