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
import { WeeklyLimitService } from '@/lib/services/weeklyLimitService';

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
  // Smart Assistant: candidate not a match — with optional rejection feedback
  z.object({
    actionType: z.literal('not_for_me'),
    candidateUserId: z.string(),
    conversationId: z.string(),
    feedback: z.string().optional(),
    rejectionCategory: z.string().optional(),
    missingTraits: z.array(z.string()).optional(),
  }),
  // Smart Assistant: skip to next without feedback
  z.object({
    actionType: z.literal('next_candidate'),
    candidateUserId: z.string(),
    conversationId: z.string(),
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
        'discovery',
        null,
        data.candidateUserId,
      );

      // Save structured rejection feedback (for preference learning)
      if (data.rejectionCategory || data.missingTraits?.length) {
        try {
          const { AutoSuggestionFeedbackService } = await import('@/lib/services/autoSuggestionFeedbackService');
          // Save feedback for learning (non-blocking)
          void AutoSuggestionFeedbackService.recalculatePreferences(userId).catch(() => {});
        } catch { /* ignore */ }
      }

      // Save feedback message if provided
      if (data.feedback) {
        await AiChatService.saveMessage(
          data.conversationId,
          'user',
          data.feedback,
          { type: 'decline_feedback', rejectionCategory: data.rejectionCategory },
        );
      } else if (data.rejectionCategory) {
        await AiChatService.saveMessage(
          data.conversationId,
          'user',
          `סיבה: ${data.rejectionCategory}`,
          { type: 'decline_feedback', rejectionCategory: data.rejectionCategory },
        );
      }

      return await handleGetNextCandidate(userId, data.conversationId, 'הנה מישהו/י אחר/ת שיכול/ה להתאים:');
    }

    if (data.actionType === 'next_candidate') {
      // Skip without feedback — just add to presented list
      await AiChatService.updateConversationPhase(
        data.conversationId,
        'discovery',
        null,
        data.candidateUserId,
      );

      return await handleGetNextCandidate(userId, data.conversationId, 'הנה מישהו/י אחר/ת:');
    }

    if (data.actionType === 'tell_me_more') {
      await AiChatService.updateConversationPhase(data.conversationId, 'discussing');

      return NextResponse.json({
        success: true,
        phase: 'discussing',
      });
    }

    if (data.actionType === 'trigger_search') {
      return await handleGetNextCandidate(userId, data.conversationId, 'מצאתי מישהו/י שיכול/ה להתאים לך:');
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

// === Helper: get next candidate and build response ===
const ACTION_BUTTONS = [
  { type: 'interested', label: { he: 'מעוניין/ת', en: 'Interested' } },
  { type: 'not_for_me', label: { he: 'לא מתאים', en: 'Not for me' } },
  { type: 'tell_me_more', label: { he: 'ספר/י לי עוד', en: 'Tell me more' } },
  { type: 'next_candidate', label: { he: 'הבא/ה', en: 'Next' } },
];

async function handleGetNextCandidate(userId: string, conversationId: string, introMessage: string) {
  const nextCandidate = await AiChatService.getNextCandidate(userId, conversationId);

  // Weekly limit reached
  if (nextCandidate?.limitReached) {
    const usage = nextCandidate.weeklyUsage!;
    const resetDate = new Date(usage.resetsAt).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    await AiChatService.saveMessage(
      conversationId,
      'assistant',
      `⏳ הגעת למכסה השבועית של ${usage.limit} הצעות.\n\nלמה יש מגבלה? אנחנו רוצים שכל הצעה שתקבל/י תהיה איכותית ומדויקת. כשמגבילים את הכמות, את/ה יכול/ה להתמקד באמת בכל הצעה ולא לדפדף בלי סוף.\n\n📅 המכסה תתאפס ב**${resetDate}**.\n\nבינתיים, נוכל להמשיך לדבר — ככל שאני לומדת עלייך יותר, כך ההצעות הבאות יהיו מדויקות יותר! 💬`,
      { type: 'limit_reached', weeklyUsage: usage },
    );

    return NextResponse.json({
      success: true,
      phase: 'discovery',
      limitReached: true,
      weeklyUsage: usage,
    });
  }

  if (nextCandidate && nextCandidate.candidateUserId) {
    await AiChatService.updateConversationPhase(
      conversationId,
      'presenting',
      nextCandidate.candidateUserId,
      nextCandidate.candidateUserId,
    );

    await AiChatService.saveMessage(
      conversationId,
      'assistant',
      introMessage,
      { type: 'profile_card', candidateUserId: nextCandidate.candidateUserId },
    );

    // Get weekly usage for display
    const weeklyUsage = await WeeklyLimitService.getUsage(userId);

    return NextResponse.json({
      success: true,
      phase: 'presenting',
      candidateUserId: nextCandidate.candidateUserId,
      actionButtons: ACTION_BUTTONS,
      potentialMatchId: nextCandidate.potentialMatchId,
      candidateCounter: nextCandidate.candidateCounter,
      weeklyUsage: {
        used: weeklyUsage.used,
        limit: weeklyUsage.limit,
        remaining: weeklyUsage.remaining,
        resetsAt: weeklyUsage.resetsAt,
      },
    });
  }

  // No more candidates
  await AiChatService.saveMessage(
    conversationId,
    'assistant',
    'כרגע אין לי עוד התאמות חדשות להציע. בואו נמשיך לדבר כדי שאוכל למצוא לך התאמות טובות יותר בהמשך.',
    { type: 'no_more_candidates' },
  );

  return NextResponse.json({
    success: true,
    phase: 'discovery',
    noMoreCandidates: true,
  });
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
