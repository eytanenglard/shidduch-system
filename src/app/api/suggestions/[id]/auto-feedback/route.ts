// src/app/api/suggestions/[id]/auto-feedback/route.ts
// =============================================================================
// NeshamaTech - Suggestion Feedback API
// Saves user feedback on ALL suggestions (auto + regular) for learning & matching improvement
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { AutoSuggestionFeedbackService } from '@/lib/services/autoSuggestionFeedbackService';
import { RejectionCategory } from '@prisma/client';

const feedbackSchema = z.object({
  decision: z.enum(['APPROVED', 'DECLINED', 'INTERESTED']),
  likedTraits: z.array(z.string()).default([]),
  likedFreeText: z.string().max(1000).optional(),
  missingTraits: z.array(z.string()).optional(),
  rejectionCategory: z.nativeEnum(RejectionCategory).optional(),
  missingFreeText: z.string().max(1000).optional(),
}).refine(
  (data) => {
    // On decline, missingTraits must have at least one item
    if (data.decision === 'DECLINED') {
      return data.missingTraits && data.missingTraits.length > 0;
    }
    return true;
  },
  { message: 'missingTraits is required when declining', path: ['missingTraits'] }
);

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await props.params;

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify the suggestion exists and user is a party
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        isAutoSuggestion: true,
        firstPartyId: true,
        secondPartyId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return NextResponse.json({ success: false, error: 'Not a party to this suggestion' }, { status: 403 });
    }

    const targetUserId = isFirstParty ? suggestion.secondPartyId : suggestion.firstPartyId;

    const feedback = await AutoSuggestionFeedbackService.saveFeedback({
      suggestionId,
      userId,
      targetUserId,
      decision: parsed.data.decision,
      likedTraits: parsed.data.likedTraits,
      likedFreeText: parsed.data.likedFreeText,
      missingTraits: parsed.data.missingTraits,
      rejectionCategory: parsed.data.rejectionCategory,
      missingFreeText: parsed.data.missingFreeText,
    });

    return NextResponse.json({ success: true, feedbackId: feedback.id });
  } catch (error) {
    console.error('[Auto-Feedback API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
