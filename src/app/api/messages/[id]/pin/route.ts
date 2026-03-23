// =============================================================================
// Message Pin Toggle API
// Path: src/app/api/messages/[id]/pin/route.ts
// =============================================================================
//
// PATCH — Toggle pin status on a message
//
// Query param: messageType=direct|suggestion
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const messageTypeSchema = z.enum(['direct', 'suggestion']);

// ==========================================
// PATCH — Toggle pin on a message
// ==========================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;
    const userId = session.user.id;

    // Validate message type query param
    const messageTypeRaw = req.nextUrl.searchParams.get('messageType');
    const messageTypeParsed = messageTypeSchema.safeParse(messageTypeRaw);
    if (!messageTypeParsed.success) {
      return NextResponse.json(
        { error: 'Invalid messageType. Must be "direct" or "suggestion".' },
        { status: 400 }
      );
    }
    const messageType = messageTypeParsed.data;

    if (messageType === 'direct') {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, receiverId: true, isPinned: true },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Only sender or receiver can pin
      if (message.senderId !== userId && message.receiverId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned },
      });

      return NextResponse.json({
        success: true,
        isPinned: updated.isPinned,
      });
    } else {
      // suggestion message
      const message = await prisma.suggestionMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, suggestionId: true, isPinned: true },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Verify user has access to this suggestion
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: message.suggestionId },
        select: { firstPartyId: true, secondPartyId: true, matchmakerId: true },
      });

      if (!suggestion) {
        return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
      }

      const isParticipant =
        userId === suggestion.firstPartyId ||
        userId === suggestion.secondPartyId ||
        userId === suggestion.matchmakerId;

      if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updated = await prisma.suggestionMessage.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned },
      });

      return NextResponse.json({
        success: true,
        isPinned: updated.isPinned,
      });
    }
  } catch (error) {
    console.error('[Pin] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    );
  }
}
