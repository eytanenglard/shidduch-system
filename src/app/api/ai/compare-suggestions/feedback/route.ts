// src/app/api/ai/compare-suggestions/feedback/route.ts
// Tracks which suggestion the user chose after AI comparison
// Used to improve matching quality over time

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const body = await req.json();
    const { chosenSuggestionId, otherSuggestionId, comparisonScores } = body;

    if (!chosenSuggestionId || !otherSuggestionId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Store feedback as a note on the chosen suggestion's structuredRationale
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: chosenSuggestionId },
      select: { structuredRationale: true },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const rationale = (suggestion.structuredRationale as Record<string, unknown>) || {};

    await prisma.matchSuggestion.update({
      where: { id: chosenSuggestionId },
      data: {
        structuredRationale: {
          ...rationale,
          comparisonFeedback: {
            chosenOverSuggestionId: otherSuggestionId,
            chosenAt: new Date().toISOString(),
            userId: session.user.id,
            scores: comparisonScores || null,
          },
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });

    console.log(
      `[compare-feedback] User ${session.user.id} chose suggestion ${chosenSuggestionId} over ${otherSuggestionId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[compare-feedback] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
