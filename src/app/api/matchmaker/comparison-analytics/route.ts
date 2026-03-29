// src/app/api/matchmaker/comparison-analytics/route.ts
// Analytics for matchmakers: how users use the AI comparison feature

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    // Verify matchmaker/admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'MATCHMAKER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Count suggestions that have comparison data in structuredRationale
    const suggestionsWithComparisons = await prisma.matchSuggestion.findMany({
      where: {
        matchmakerId: session.user.id,
        NOT: { structuredRationale: { equals: Prisma.DbNull } },
      },
      select: {
        id: true,
        status: true,
        structuredRationale: true,
        firstParty: { select: { firstName: true } },
        secondParty: { select: { firstName: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let totalComparisons = 0;
    let totalFeedback = 0;
    let chosenHigherScore = 0;
    let chosenLowerScore = 0;

    for (const sug of suggestionsWithComparisons) {
      const rationale = sug.structuredRationale as Record<string, any> | null;
      if (!rationale) continue;

      // Count comparisons
      if (rationale.comparisons && typeof rationale.comparisons === 'object') {
        totalComparisons += Object.keys(rationale.comparisons).length;
      }

      // Count feedback
      if (rationale.comparisonFeedback) {
        totalFeedback++;
        const fb = rationale.comparisonFeedback as {
          scores?: { chosenScore?: number; otherScore?: number };
        };
        if (fb.scores?.chosenScore != null && fb.scores?.otherScore != null) {
          if (fb.scores.chosenScore >= fb.scores.otherScore) {
            chosenHigherScore++;
          } else {
            chosenLowerScore++;
          }
        }
      }
    }

    const analytics = {
      totalComparisons,
      totalFeedback,
      chosenHigherScore,
      chosenLowerScore,
      aiAccuracy: totalFeedback > 0
        ? Math.round((chosenHigherScore / totalFeedback) * 100)
        : null,
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('[comparison-analytics] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
