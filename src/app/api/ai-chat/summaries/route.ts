// src/app/api/ai-chat/summaries/route.ts
// =============================================================================
// NeshamaTech - AI Chat Summaries API for Matchmakers
// Returns AI chat conversation summaries for matchmaker dashboard
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AiChatService } from '@/lib/services/aiChatService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only matchmakers and admins can view summaries
    if (session.user.role !== 'MATCHMAKER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const suggestionId = searchParams.get('suggestionId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const summaries = await AiChatService.getSummariesForMatchmaker(
      session.user.id,
      { unreadOnly, suggestionId, limit },
    );

    return NextResponse.json({
      success: true,
      summaries: summaries.map((s) => ({
        id: s.id,
        conversationId: s.conversationId,
        suggestionId: s.suggestionId,
        userId: s.userId,
        userName: s.user ? `${s.user.firstName} ${s.user.lastName}` : '',
        summary: s.summary,
        sentiment: s.sentiment,
        keyInsights: s.keyInsights,
        messageCount: s.messageCount,
        isRead: s.isRead,
        createdAt: s.createdAt.toISOString(),
        suggestion: s.suggestion ? {
          id: s.suggestion.id,
          status: s.suggestion.status,
          firstPartyName: `${s.suggestion.firstParty.firstName} ${s.suggestion.firstParty.lastName}`,
          secondPartyName: `${s.suggestion.secondParty.firstName} ${s.suggestion.secondParty.lastName}`,
        } : null,
      })),
    });
  } catch (error) {
    console.error('[AiChat Summaries] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

// PATCH — Mark summary as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MATCHMAKER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { summaryId } = await req.json();
    if (!summaryId) {
      return NextResponse.json({ error: 'summaryId is required' }, { status: 400 });
    }

    await AiChatService.markSummaryRead(summaryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AiChat Summaries PATCH] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
