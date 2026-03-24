// =============================================================================
// src/app/api/mobile/messages/[id]/pin/route.ts
// =============================================================================
//
// OPTIONS + PATCH — Toggle pin status on a message
//
// Query param: messageType=direct|suggestion
// Mobile mirror of /api/messages/[id]/pin with JWT auth.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { z } from 'zod';

const messageTypeSchema = z.enum(['direct', 'suggestion']);

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// PATCH — Toggle pin on a message
// ==========================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const { id: messageId } = await params;
    const userId = auth.userId;

    // Validate message type query param
    const messageTypeRaw = req.nextUrl.searchParams.get('messageType');
    const messageTypeParsed = messageTypeSchema.safeParse(messageTypeRaw);
    if (!messageTypeParsed.success) {
      return corsError(req, 'Invalid messageType. Must be "direct" or "suggestion".', 400);
    }
    const messageType = messageTypeParsed.data;

    if (messageType === 'direct') {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, receiverId: true, isPinned: true },
      });

      if (!message) {
        return corsError(req, 'Message not found', 404);
      }

      // Only sender or receiver can pin
      if (message.senderId !== userId && message.receiverId !== userId) {
        return corsError(req, 'Forbidden', 403);
      }

      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned },
      });

      return corsJson(req, {
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
        return corsError(req, 'Message not found', 404);
      }

      // Verify user has access to this suggestion
      const suggestion = await prisma.matchSuggestion.findUnique({
        where: { id: message.suggestionId },
        select: { firstPartyId: true, secondPartyId: true, matchmakerId: true },
      });

      if (!suggestion) {
        return corsError(req, 'Suggestion not found', 404);
      }

      const isParticipant =
        userId === suggestion.firstPartyId ||
        userId === suggestion.secondPartyId ||
        userId === suggestion.matchmakerId;

      if (!isParticipant) {
        return corsError(req, 'Forbidden', 403);
      }

      const updated = await prisma.suggestionMessage.update({
        where: { id: messageId },
        data: { isPinned: !message.isPinned },
      });

      return corsJson(req, {
        success: true,
        isPinned: updated.isPinned,
      });
    }
  } catch (error) {
    console.error('[mobile/messages/pin] PATCH error:', error);
    return corsError(req, 'Failed to toggle pin', 500);
  }
}
