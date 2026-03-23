// src/app/api/mobile/suggestions/[id]/auto-feedback/route.ts
// Mobile endpoint for auto-suggestion feedback

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMobileToken, corsJson, corsError, corsOptions } from '@/lib/mobile-auth';
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
    if (data.decision === 'DECLINED') {
      return data.missingTraits && data.missingTraits.length > 0;
    }
    return true;
  },
  { message: 'missingTraits is required when declining', path: ['missingTraits'] }
);

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: suggestionId } = await props.params;
    const auth = await verifyMobileToken(req);

    if (!auth) {
      return corsError(req, 'Unauthorized', 401, 'AUTH_REQUIRED');
    }

    const userId = auth.userId;
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return corsError(req, 'Invalid input', 400, 'VALIDATION_ERROR');
    }

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: { id: true, firstPartyId: true, secondPartyId: true },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404, 'NOT_FOUND');
    }

    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return corsError(req, 'Not a party to this suggestion', 403, 'FORBIDDEN');
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

    return corsJson(req, { success: true, feedbackId: feedback.id });
  } catch (error) {
    console.error('[Mobile Auto-Feedback] Error:', error);
    return corsError(req, 'Internal error', 500, 'INTERNAL_ERROR');
  }
}
