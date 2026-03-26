// src/app/api/ai-chat/action/route.ts
// =============================================================================
// Execute actions triggered from AI chat:
// - suggestion_status: approve/decline existing suggestions
// - interested: create MatchSuggestion from chat candidate
// - not_for_me: skip candidate, get next
// - tell_me_more: switch to discussing phase
// - trigger_search: search for next candidate
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

const actionSchema = z.discriminatedUnion('actionType', [
  // Existing: action on existing suggestion
  z.object({
    actionType: z.literal('suggestion_status'),
    suggestionId: z.string(),
    status: z.nativeEnum(MatchSuggestionStatus),
    conversationId: z.string().optional(),
  }),
  // Smart Assistant: user is interested in presented candidate
  z.object({
    actionType: z.literal('interested'),
    candidateUserId: z.string(),
    conversationId: z.string(),
    potentialMatchId: z.string(),
  }),
  // Smart Assistant: candidate not a match
  z.object({
    actionType: z.literal('not_for_me'),
    candidateUserId: z.string(),
    conversationId: z.string(),
    feedback: z.string().optional(),
  }),
  // Smart Assistant: want more info
  z.object({
    actionType: z.literal('tell_me_more'),
    conversationId: z.string(),
  }),
  // Smart Assistant: trigger search
  z.object({
    actionType: z.literal('trigger_search'),
    conversationId: z.string(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Support legacy format (no actionType field)
    if (!body.actionType && body.suggestionId && body.status) {
      body.actionType = 'suggestion_status';
    }

    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // === Handle suggestion status actions (existing flow) ===
    if (data.actionType === 'suggestion_status') {
      return handleSuggestionStatus(userId, data.suggestionId, data.status, data.conversationId);
    }

    // === Handle smart assistant actions ===

    // Verify conversation belongs to user
    const conversation = await prisma.aiChatConversation.findFirst({
      where: { id: data.conversationId, userId },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (data.actionType === 'interested') {
      // Create MatchSuggestion from chat
      const suggestion = await AiChatService.createSuggestionFromChat(
        userId,
        data.candidateUserId,
        data.conversationId,
        data.potentialMatchId,
      );

      // Save confirmation message
      await AiChatService.saveMessage(
        data.conversationId,
        'assistant',
        'מצוין! יצרתי את ההצעה. השדכנית שלך תעודכן ותוכל ללוות את התהליך. 🎉',
        { type: 'action_confirmation', action: 'interested', suggestionId: suggestion.id },
      );

      // Dispatch event
      return NextResponse.json({
        success: true,
        suggestionId: suggestion.id,
        phase: 'discovery',
      });
    }

    if (data.actionType === 'not_for_me') {
      // Add to presented list and clear current
      await AiChatService.updateConversationPhase(
        data.conversationId,
        'discovery', // Go back to discovery temporarily
        null,
        data.candidateUserId,
      );

      // Save feedback message if provided
      if (data.feedback) {
        await AiChatService.saveMessage(
          data.conversationId,
          'user',
          data.feedback,
          { type: 'decline_feedback' },
        );
      }

      // Try to find next candidate
      const nextCandidate = await AiChatService.getNextCandidate(userId, data.conversationId);

      if (nextCandidate) {
        await AiChatService.updateConversationPhase(
          data.conversationId,
          'presenting',
          nextCandidate.candidateUserId,
          nextCandidate.candidateUserId,
        );

        // Save profile card message
        await AiChatService.saveMessage(
          data.conversationId,
          'assistant',
          'הנה מישהו/י אחר/ת שיכול/ה להתאים:',
          { type: 'profile_card', candidateUserId: nextCandidate.candidateUserId },
        );

        return NextResponse.json({
          success: true,
          phase: 'presenting',
          candidateUserId: nextCandidate.candidateUserId,
          actionButtons: [
            { type: 'interested', label: { he: 'מעוניין/ת', en: 'Interested' } },
            { type: 'not_for_me', label: { he: 'לא מתאים', en: 'Not for me' } },
            { type: 'tell_me_more', label: { he: 'ספר/י לי עוד', en: 'Tell me more' } },
          ],
          potentialMatchId: nextCandidate.potentialMatchId,
        });
      }

      // No more candidates
      await AiChatService.saveMessage(
        data.conversationId,
        'assistant',
        'כרגע אין לי עוד התאמות חדשות להציע. בואו נמשיך לדבר כדי שאוכל למצוא לך התאמות טובות יותר בהמשך. 💬',
        { type: 'no_more_candidates' },
      );

      return NextResponse.json({
        success: true,
        phase: 'discovery',
        noMoreCandidates: true,
      });
    }

    if (data.actionType === 'tell_me_more') {
      await AiChatService.updateConversationPhase(data.conversationId, 'discussing');

      return NextResponse.json({
        success: true,
        phase: 'discussing',
      });
    }

    if (data.actionType === 'trigger_search') {
      const nextCandidate = await AiChatService.getNextCandidate(userId, data.conversationId);

      if (nextCandidate) {
        await AiChatService.updateConversationPhase(
          data.conversationId,
          'presenting',
          nextCandidate.candidateUserId,
          nextCandidate.candidateUserId,
        );

        // Save profile card message
        await AiChatService.saveMessage(
          data.conversationId,
          'assistant',
          'מצאתי מישהו/י שיכול/ה להתאים לך:',
          { type: 'profile_card', candidateUserId: nextCandidate.candidateUserId },
        );

        return NextResponse.json({
          success: true,
          phase: 'presenting',
          candidateUserId: nextCandidate.candidateUserId,
          actionButtons: [
            { type: 'interested', label: { he: 'מעוניין/ת', en: 'Interested' } },
            { type: 'not_for_me', label: { he: 'לא מתאים', en: 'Not for me' } },
            { type: 'tell_me_more', label: { he: 'ספר/י לי עוד', en: 'Tell me more' } },
          ],
          potentialMatchId: nextCandidate.potentialMatchId,
        });
      }

      await AiChatService.saveMessage(
        data.conversationId,
        'assistant',
        'חיפשתי במאגר ולא מצאתי כרגע התאמות חדשות. ככל שנמשיך לדייק את מה שחשוב לך, יעלו התאמות חדשות. 🔍',
        { type: 'no_candidates_found' },
      );

      return NextResponse.json({
        success: true,
        phase: 'discovery',
        noMoreCandidates: true,
      });
    }

    return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
  } catch (error) {
    console.error('[AiChat Action] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

// === Existing suggestion status handler ===
async function handleSuggestionStatus(
  userId: string,
  suggestionId: string,
  status: MatchSuggestionStatus,
  conversationId?: string,
) {
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

  // Validate allowed statuses
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

  const isFirstPartyApproving = isFirstParty && status === 'FIRST_PARTY_APPROVED';

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

  // Save a note in the AI chat conversation
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
}
