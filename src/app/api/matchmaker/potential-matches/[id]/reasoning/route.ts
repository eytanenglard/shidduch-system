// src/app/api/matchmaker/potential-matches/[id]/reasoning/route.ts
// Lazy-load reasoning data for a potential match

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(['MATCHMAKER', 'ADMIN'] as string[]).includes(session.user.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const match = await prisma.potentialMatch.findUnique({
      where: { id },
      select: {
        id: true,
        shortReasoning: true,
        detailedReasoning: true,
        hybridReasoning: true,
        algorithmicReasoning: true,
        vectorReasoning: true,
        metricsV2Reasoning: true,
        scoreBreakdown: true,
        hybridScoreBreakdown: true,
        algorithmicScoreBreakdown: true,
        metricsV2ScoreBreakdown: true,
      },
    });

    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reasoning: {
        shortReasoning: match.shortReasoning,
        detailedReasoning: match.detailedReasoning,
        hybridReasoning: match.hybridReasoning,
        algorithmicReasoning: match.algorithmicReasoning,
        vectorReasoning: match.vectorReasoning,
        metricsV2Reasoning: match.metricsV2Reasoning,
        scoreBreakdown: match.scoreBreakdown,
        hybridScoreBreakdown: match.hybridScoreBreakdown,
        algorithmicScoreBreakdown: match.algorithmicScoreBreakdown,
        metricsV2ScoreBreakdown: match.metricsV2ScoreBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching reasoning:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
