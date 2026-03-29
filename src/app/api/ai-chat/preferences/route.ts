// src/app/api/ai-chat/preferences/route.ts
// =============================================================================
// Get and update user's learned preferences (transparent to user)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const preferences = await prisma.userMatchingPreferences.findUnique({
      where: { userId },
      select: {
        likedTraitScores: true,
        avoidTraitScores: true,
        chatDerivedInsights: true,
        preferenceSummary: true,
        lastChatExtraction: true,
        totalFeedbacks: true,
      },
    });

    if (!preferences) {
      return NextResponse.json({
        success: true,
        preferences: null,
        message: 'No learned preferences yet',
      });
    }

    // Format for display
    const liked = preferences.likedTraitScores as Record<string, number> | null;
    const avoided = preferences.avoidTraitScores as Record<string, number> | null;

    return NextResponse.json({
      success: true,
      preferences: {
        likedTraits: liked ? Object.entries(liked).sort((a, b) => b[1] - a[1]).map(([trait, score]) => ({ trait, score })) : [],
        avoidedTraits: avoided ? Object.entries(avoided).sort((a, b) => b[1] - a[1]).map(([trait, score]) => ({ trait, score })) : [],
        insights: preferences.chatDerivedInsights,
        summary: preferences.preferenceSummary,
        lastUpdated: preferences.lastChatExtraction,
        totalFeedbacks: preferences.totalFeedbacks,
      },
    });
  } catch (error) {
    console.error('[AiChat Preferences] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

// DELETE a specific learned preference
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { traitType, traitName } = await req.json();

    if (!traitType || !traitName) {
      return NextResponse.json({ error: 'Missing traitType or traitName' }, { status: 400 });
    }

    const preferences = await prisma.userMatchingPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return NextResponse.json({ error: 'No preferences found' }, { status: 404 });
    }

    if (traitType === 'liked') {
      const liked = (preferences.likedTraitScores as Record<string, number>) || {};
      delete liked[traitName];
      await prisma.userMatchingPreferences.update({
        where: { userId },
        data: { likedTraitScores: liked },
      });
    } else if (traitType === 'avoided') {
      const avoided = (preferences.avoidTraitScores as Record<string, number>) || {};
      delete avoided[traitName];
      await prisma.userMatchingPreferences.update({
        where: { userId },
        data: { avoidTraitScores: avoided },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AiChat Preferences] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
