// src/app/api/ai-chat/proactive/route.ts
// =============================================================================
// NeshamaTech - Proactive AI Chat Messages
// Triggered by cron or internal calls to send proactive bot messages
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AiChatService } from '@/lib/services/aiChatService';

const PENDING_REMINDER_HOURS = 24; // Send reminder after 24h without response
const MAX_PROACTIVE_PER_RUN = 20;

export async function POST(req: NextRequest) {
  try {
    // Verify cron/internal secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const reminderCutoff = new Date(now.getTime() - PENDING_REMINDER_HOURS * 60 * 60 * 1000);
    let sent = 0;

    // 1. Find pending suggestions older than 24h without a response
    const pendingSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        status: { in: ['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY'] },
        lastStatusChange: { lte: reminderCutoff },
      },
      take: MAX_PROACTIVE_PER_RUN,
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { language: true } },
        secondParty: { select: { language: true } },
      },
    });

    for (const suggestion of pendingSuggestions) {
      const targetUserId = suggestion.status === 'PENDING_FIRST_PARTY'
        ? suggestion.firstPartyId
        : suggestion.secondPartyId;
      const targetUser = suggestion.status === 'PENDING_FIRST_PARTY'
        ? suggestion.firstParty
        : suggestion.secondParty;
      const locale = (targetUser?.language === 'en' ? 'en' : 'he') as 'he' | 'en';

      // Check if we already sent a proactive message for this suggestion
      const existingProactive = await prisma.aiChatMessage.findFirst({
        where: {
          conversation: {
            userId: targetUserId,
            suggestionId: suggestion.id,
          },
          role: 'assistant',
          metadata: { path: ['proactive'], equals: true },
        },
      });

      if (existingProactive) continue;

      // Get or create conversation for this suggestion
      const conversation = await AiChatService.getOrCreateConversation(targetUserId, suggestion.id);

      // Generate proactive message
      const message = await AiChatService.getProactiveMessage(
        targetUserId,
        suggestion.id,
        locale,
        'pending_reminder',
      );

      // Save as assistant message with proactive flag
      await AiChatService.saveMessage(conversation.id, 'assistant', message, {
        proactive: true,
        trigger: 'pending_reminder',
      });

      sent++;
    }

    // 2. Send post-decline follow-ups
    const recentDeclines = await prisma.matchSuggestion.findMany({
      where: {
        status: { in: ['FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED'] },
        lastStatusChange: {
          gte: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Within last 2 hours
          lte: new Date(now.getTime() - 30 * 60 * 1000), // But at least 30 min ago
        },
      },
      take: MAX_PROACTIVE_PER_RUN,
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { language: true } },
        secondParty: { select: { language: true } },
      },
    });

    for (const suggestion of recentDeclines) {
      const declinerId = suggestion.status === 'FIRST_PARTY_DECLINED'
        ? suggestion.firstPartyId
        : suggestion.secondPartyId;
      const decliner = suggestion.status === 'FIRST_PARTY_DECLINED'
        ? suggestion.firstParty
        : suggestion.secondParty;
      const locale = (decliner?.language === 'en' ? 'en' : 'he') as 'he' | 'en';

      // Check if we already sent a proactive message
      const existingProactive = await prisma.aiChatMessage.findFirst({
        where: {
          conversation: { userId: declinerId, suggestionId: suggestion.id },
          role: 'assistant',
          metadata: { path: ['trigger'], equals: 'post_decline' },
        },
      });

      if (existingProactive) continue;

      const conversation = await AiChatService.getOrCreateConversation(declinerId, suggestion.id);
      const message = await AiChatService.getProactiveMessage(declinerId, suggestion.id, locale, 'post_decline');
      await AiChatService.saveMessage(conversation.id, 'assistant', message, {
        proactive: true,
        trigger: 'post_decline',
      });

      sent++;
    }

    // 3. Send post-approve encouragement
    const recentApprovals = await prisma.matchSuggestion.findMany({
      where: {
        status: { in: ['FIRST_PARTY_APPROVED', 'SECOND_PARTY_APPROVED'] },
        lastStatusChange: {
          gte: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          lte: new Date(now.getTime() - 15 * 60 * 1000), // At least 15 min ago
        },
      },
      take: MAX_PROACTIVE_PER_RUN,
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { language: true } },
        secondParty: { select: { language: true } },
      },
    });

    for (const suggestion of recentApprovals) {
      const approverId = suggestion.status === 'FIRST_PARTY_APPROVED'
        ? suggestion.firstPartyId
        : suggestion.secondPartyId;
      const approver = suggestion.status === 'FIRST_PARTY_APPROVED'
        ? suggestion.firstParty
        : suggestion.secondParty;
      const locale = (approver?.language === 'en' ? 'en' : 'he') as 'he' | 'en';

      const existingProactive = await prisma.aiChatMessage.findFirst({
        where: {
          conversation: { userId: approverId, suggestionId: suggestion.id },
          role: 'assistant',
          metadata: { path: ['trigger'], equals: 'post_approve' },
        },
      });

      if (existingProactive) continue;

      const conversation = await AiChatService.getOrCreateConversation(approverId, suggestion.id);
      const message = await AiChatService.getProactiveMessage(approverId, suggestion.id, locale, 'post_approve');
      await AiChatService.saveMessage(conversation.id, 'assistant', message, {
        proactive: true,
        trigger: 'post_approve',
      });

      sent++;
    }

    console.log(`[Proactive AI] Sent ${sent} proactive messages`);

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error('[Proactive AI] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
