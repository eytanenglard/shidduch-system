// src/app/api/matchmaker/ai-insights/route.ts
// =============================================================================
// Matchmaker API: Get AI chat insights for a specific candidate
// Shows what Neshama learned about a user's preferences from chats & rejections
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only matchmakers and admins
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!currentUser || !['MATCHMAKER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const candidateId = req.nextUrl.searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    // Get learned preferences
    const preferences = await prisma.userMatchingPreferences.findUnique({
      where: { userId: candidateId },
      select: {
        likedTraitScores: true,
        avoidTraitScores: true,
        chatDerivedInsights: true,
        preferenceSummary: true,
        lastChatExtraction: true,
        totalFeedbacks: true,
      },
    });

    // Get recent chat conversations
    const conversations = await prisma.aiChatConversation.findMany({
      where: { userId: candidateId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        phase: true,
        updatedAt: true,
        extractedPreferences: true,
        presentedCandidateIds: true,
        _count: { select: { messages: true } },
      },
    });

    // Get rejection stats
    const rejectionStats: Record<string, number> = {};
    for (const conv of conversations) {
      const prefs = conv.extractedPreferences as Record<string, unknown> | null;
      if (prefs && Array.isArray(prefs.rejections)) {
        for (const r of prefs.rejections as Array<Record<string, unknown>>) {
          if (r.rejectionCategory && typeof r.rejectionCategory === 'string') {
            rejectionStats[r.rejectionCategory] = (rejectionStats[r.rejectionCategory] || 0) + 1;
          }
        }
      }
    }

    // Count total presented candidates
    const totalPresented = conversations.reduce((sum, c) => {
      const ids = c.presentedCandidateIds as string[] | null;
      return sum + (ids?.length || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      insights: {
        // Learned preferences
        likedTraits: preferences?.likedTraitScores
          ? Object.entries(preferences.likedTraitScores as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([trait, score]) => ({ trait, score }))
          : [],
        avoidedTraits: preferences?.avoidTraitScores
          ? Object.entries(preferences.avoidTraitScores as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([trait, score]) => ({ trait, score }))
          : [],
        chatInsights: preferences?.chatDerivedInsights || null,
        preferenceSummary: preferences?.preferenceSummary || null,
        totalFeedbacks: preferences?.totalFeedbacks || 0,
        lastUpdated: preferences?.lastChatExtraction || null,
        // Chat activity
        activeConversations: conversations.length,
        totalMessages: conversations.reduce((sum, c) => sum + c._count.messages, 0),
        totalPresented,
        // Rejection patterns
        rejectionStats: Object.entries(rejectionStats)
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => ({ category, count })),
      },
    });
  } catch (error) {
    console.error('[Matchmaker AI Insights] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
