// src/app/api/ai-chat/action/route.ts
// =============================================================================
// Execute suggestion actions (approve/decline) triggered from AI chat
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MatchSuggestionStatus } from '@prisma/client';
import { z } from 'zod';
import { statusTransitionService } from '@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService';
import { getDictionary } from '@/lib/dictionaries';
import type { EmailDictionary } from '@/types/dictionary';
import { AiChatService } from '@/lib/services/aiChatService';

const actionSchema = z.object({
  suggestionId: z.string(),
  status: z.nativeEnum(MatchSuggestionStatus),
  conversationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { suggestionId, status, conversationId } = parsed.data;

    // Verify the suggestion exists and the user is a party
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const isFirstParty = suggestion.firstPartyId === userId;
    const isSecondParty = suggestion.secondPartyId === userId;

    if (!isFirstParty && !isSecondParty) {
      return NextResponse.json({ error: 'Not a party to this suggestion' }, { status: 403 });
    }

    // Validate that the requested status is allowed for this user
    const allowedStatuses: MatchSuggestionStatus[] = [];
    if (isFirstParty && suggestion.status === 'PENDING_FIRST_PARTY') {
      allowedStatuses.push('FIRST_PARTY_APPROVED', 'FIRST_PARTY_INTERESTED', 'FIRST_PARTY_DECLINED');
    }
    if (isSecondParty && suggestion.status === 'PENDING_SECOND_PARTY') {
      allowedStatuses.push('SECOND_PARTY_APPROVED', 'SECOND_PARTY_DECLINED');
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Action not available for current suggestion status' },
        { status: 400 },
      );
    }

    // Load dictionaries for email notifications
    const [heDict, enDict] = await Promise.all([
      getDictionary('he'),
      getDictionary('en'),
    ]);

    const dictionaries = {
      he: heDict.email as EmailDictionary,
      en: enDict.email as EmailDictionary,
    };

    const firstPartyLang = (suggestion.firstParty as any).language || 'he';
    const secondPartyLang = (suggestion.secondParty as any).language || 'he';
    const matchmakerLang = (suggestion.matchmaker as any).language || 'he';

    // Check if first party approving (delay matchmaker notification)
    const isFirstPartyApproving =
      isFirstParty && status === 'FIRST_PARTY_APPROVED';

    // Execute the status transition
    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      status,
      dictionaries,
      `סטטוס שונה דרך צ'אט AI מ-${suggestion.status} ל-${status}`,
      {
        sendNotifications: !isFirstPartyApproving,
        notifyParties: ['first', 'second', 'matchmaker'],
        skipValidation: false,
      },
      {
        firstParty: firstPartyLang,
        secondParty: secondPartyLang,
        matchmaker: matchmakerLang,
      },
    );

    if (isFirstPartyApproving) {
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: { matchmakerNotifiedAt: null },
      });
    }

    // Save a note in the AI chat conversation about the action
    if (conversationId) {
      const isHebrew = firstPartyLang === 'he' || secondPartyLang === 'he';
      const actionNote = status.includes('APPROVED') || status.includes('INTERESTED')
        ? (isHebrew ? 'אישרת את ההצעה! השדכנית תעודכן.' : 'You approved the suggestion! The matchmaker will be notified.')
        : (isHebrew ? 'דחית את ההצעה. נמשיך למצוא לך התאמות טובות יותר.' : 'You declined the suggestion. We\'ll keep finding better matches for you.');

      await AiChatService.saveMessage(conversationId, 'assistant', actionNote, {
        action: status,
        automated: true,
      });
    }

    return NextResponse.json({
      success: true,
      suggestion: {
        id: updatedSuggestion.id,
        status: updatedSuggestion.status,
        previousStatus: updatedSuggestion.previousStatus,
      },
    });
  } catch (error) {
    console.error('[AiChat Action] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
