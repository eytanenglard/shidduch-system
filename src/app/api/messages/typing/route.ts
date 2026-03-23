// =============================================================================
// src/app/api/messages/typing/route.ts
// =============================================================================
// POST: Set typing indicator in Redis with short TTL.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { publishTypingIndicator } from '@/lib/chatPubSub';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const typingSchema = z.object({
  conversationId: z.string(),
  conversationType: z.enum(['direct', 'suggestion']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = typingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { conversationId, conversationType } = parsed.data;
    const userId = session.user.id;
    const userName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim();

    // Determine the recipient based on conversation type
    if (conversationType === 'direct') {
      // For direct chats, find the other party
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { assignedMatchmakerId: true, role: true },
      });

      if (!user) return NextResponse.json({ success: true });

      // If user is a candidate, notify matchmaker. If matchmaker, notify the user.
      const recipientId =
        user.role === 'CANDIDATE'
          ? user.assignedMatchmakerId
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

      if (!suggestion) return NextResponse.json({ success: true });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[messages/typing] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
