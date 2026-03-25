// src/app/api/matchmaker/skipped-suggestions/route.ts
// =============================================================================
// NeshamaTech - Skipped Auto-Suggestions API
// Shows matchmakers why users didn't receive auto-suggestions
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse query params
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD or 'today'
    const userIdParam = searchParams.get('userId'); // Filter by specific user
    const reasonParam = searchParams.get('reason'); // Filter by skip reason
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50;

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (dateParam && dateParam !== 'today') {
      startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    // 3. Query skipped suggestions
    const skipped = await prisma.skippedAutoSuggestion.findMany({
      where: {
        runDate: { gte: startDate, lte: endDate },
        ...(userIdParam ? { userId: userIdParam } : {}),
        ...(reasonParam ? { skipReason: reasonParam } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: { gender: true, city: true, religiousLevel: true },
            },
          },
        },
        otherParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: {
              select: { gender: true, city: true, religiousLevel: true },
            },
          },
        },
      },
      orderBy: { runDate: 'desc' },
      take: limit,
    });

    // 4. Aggregate by reason
    const reasonCounts: Record<string, number> = {};
    for (const s of skipped) {
      reasonCounts[s.skipReason] = (reasonCounts[s.skipReason] || 0) + 1;
    }

    // 5. Aggregate by user (who gets skipped most)
    const userSkipCounts: Record<string, { name: string; count: number }> = {};
    for (const s of skipped) {
      if (!userSkipCounts[s.userId]) {
        userSkipCounts[s.userId] = {
          name: `${s.user.firstName} ${s.user.lastName}`,
          count: 0,
        };
      }
      userSkipCounts[s.userId].count++;
    }

    const topSkippedUsers = Object.entries(userSkipCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([id, data]) => ({ userId: id, ...data }));

    return NextResponse.json({
      success: true,
      date: dateParam || 'today',
      total: skipped.length,
      reasonBreakdown: reasonCounts,
      topSkippedUsers,
      items: skipped.map((s) => ({
        id: s.id,
        user: {
          id: s.user.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          email: s.user.email,
          gender: s.user.profile?.gender,
          city: s.user.profile?.city,
        },
        otherParty: {
          id: s.otherParty.id,
          name: `${s.otherParty.firstName} ${s.otherParty.lastName}`,
          gender: s.otherParty.profile?.gender,
          city: s.otherParty.profile?.city,
        },
        aiScore: s.aiScore,
        skipReason: s.skipReason,
        skipDetails: s.skipDetails,
        runDate: s.runDate,
      })),
    });
  } catch (error) {
    console.error('[Skipped Suggestions] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
