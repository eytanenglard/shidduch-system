// =============================================================================
// src/app/api/mobile/messages/typing/route.ts
// =============================================================================
//
// OPTIONS + POST — Send typing indicator via Redis pub/sub
//
// Body: { conversationId, conversationType: 'direct' | 'suggestion' }
// Mobile mirror of /api/messages/typing with JWT auth.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { publishTypingIndicator } from '@/lib/chatPubSub';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { z } from 'zod';

const typingSchema = z.object({
  conversationId: z.string(),
  conversationType: z.enum(['direct', 'suggestion']),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// POST — Send typing indicator
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const body = await req.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid data', 400);
    }

    const { conversationId, conversationType } = parsed.data;
    const userId = auth.userId;

    // Get user name for the typing indicator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, role: true },
    });

    if (!user) return corsJson(req, { success: true });

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    // Determine the recipient based on conversation type
    if (conversationType === 'direct') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { assignedMatchmakerId: true, role: true },
      });

      if (!dbUser) return corsJson(req, { success: true });

      // If user is a candidate, notify matchmaker. If matchmaker, notify the user.
      const recipientId =
        dbUser.role === 'CANDIDATE'
          ? dbUser.assignedMatchmakerId
          : conversationId; // conversationId is the userId for direct chats

      if (recipientId) {
        await publishTypingIndicator(
          `direct:${conversationId}`,
          userId,
          userName,
          recipientId
        );
      }
    } else if (conversationType === 'suggestion') {
      // For suggestion chats, notify the matchmaker (if user) or the target user (if matchmaker)
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: conversationId },
        select: { matchmakerId: true, firstPartyId: true, secondPartyId: true },
      });

      if (!suggestion) return corsJson(req, { success: true });

      if (userId === suggestion.matchmakerId) {
        // Matchmaker is typing — notify both parties
        await Promise.all([
          publishTypingIndicator(`suggestion:${conversationId}`, userId, userName, suggestion.firstPartyId),
          publishTypingIndicator(`suggestion:${conversationId}`, userId, userName, suggestion.secondPartyId),
        ]);
      } else {
        // User is typing — notify matchmaker
        await publishTypingIndicator(
          `suggestion:${conversationId}`,
          userId,
          userName,
          suggestion.matchmakerId
        );
      }
    }

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[mobile/messages/typing] Error:', error);
    return corsError(req, 'Failed', 500);
  }
}
