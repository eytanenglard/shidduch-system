// =============================================================================
// src/app/api/mobile/messages/[id]/reactions/route.ts
// =============================================================================
//
// OPTIONS + POST   — Add a reaction to a message
// OPTIONS + DELETE — Remove a reaction from a message
//
// Query param: messageType=direct|suggestion
// Mobile mirror of /api/messages/[id]/reactions with JWT auth.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { z } from 'zod';

// Zod schemas
const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

const messageTypeSchema = z.enum(['direct', 'suggestion']);

// Allowed emojis
const ALLOWED_EMOJIS = ['❤️', '👍', '😊', '😂', '🙏'];

interface Reaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// POST — Add reaction to a message
// ==========================================
export async function POST(
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

    // Validate body
    const body = await req.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid input', 400);
    }

    const { emoji } = parsed.data;

    // Validate emoji is in allowed list
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return corsError(req, 'Emoji not allowed', 400);
    }

    if (messageType === 'direct') {
      // Fetch the direct message — verify user is sender or receiver
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, receiverId: true, reactions: true },
      });

      if (!message) {
        return corsError(req, 'Message not found', 404);
      }

      if (message.senderId !== userId && message.receiverId !== userId) {
        return corsError(req, 'Forbidden', 403);
      }

      // Build updated reactions array
      const existingReactions = (message.reactions as Reaction[] | null) || [];
      const alreadyReacted = existingReactions.some(
        (r) => r.emoji === emoji && r.userId === userId
      );
      if (alreadyReacted) {
        return corsError(req, 'Already reacted with this emoji', 409);
      }

      const updatedReactions: Reaction[] = [
        ...existingReactions,
        { emoji, userId, createdAt: new Date().toISOString() },
      ];

      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: { reactions: updatedReactions as unknown as Prisma.InputJsonValue },
      });

      return corsJson(req, { success: true, reactions: updated.reactions });
    } else {
      // suggestion message
      const message = await prisma.suggestionMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, suggestionId: true, reactions: true },
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

      const existingReactions = (message.reactions as Reaction[] | null) || [];
      const alreadyReacted = existingReactions.some(
        (r) => r.emoji === emoji && r.userId === userId
      );
      if (alreadyReacted) {
        return corsError(req, 'Already reacted with this emoji', 409);
      }

      const updatedReactions: Reaction[] = [
        ...existingReactions,
        { emoji, userId, createdAt: new Date().toISOString() },
      ];

      const updated = await prisma.suggestionMessage.update({
        where: { id: messageId },
        data: { reactions: updatedReactions as unknown as Prisma.InputJsonValue },
      });

      return corsJson(req, { success: true, reactions: updated.reactions });
    }
  } catch (error) {
    console.error('[mobile/messages/reactions] POST error:', error);
    return corsError(req, 'Failed to add reaction', 500);
  }
}

// ==========================================
// DELETE — Remove reaction from a message
// ==========================================
export async function DELETE(
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

    // Validate body
    const body = await req.json();
    const parsed = reactionSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid input', 400);
    }

    const { emoji } = parsed.data;

    if (messageType === 'direct') {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, receiverId: true, reactions: true },
      });

      if (!message) {
        return corsError(req, 'Message not found', 404);
      }

      if (message.senderId !== userId && message.receiverId !== userId) {
        return corsError(req, 'Forbidden', 403);
      }

      const existingReactions = (message.reactions as Reaction[] | null) || [];
      const updatedReactions = existingReactions.filter(
        (r) => !(r.emoji === emoji && r.userId === userId)
      );

      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: {
          reactions: updatedReactions.length > 0
            ? (updatedReactions as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      return corsJson(req, { success: true, reactions: updated.reactions });
    } else {
      const message = await prisma.suggestionMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, suggestionId: true, reactions: true },
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

      const existingReactions = (message.reactions as Reaction[] | null) || [];
      const updatedReactions = existingReactions.filter(
        (r) => !(r.emoji === emoji && r.userId === userId)
      );

      const updated = await prisma.suggestionMessage.update({
        where: { id: messageId },
        data: {
          reactions: updatedReactions.length > 0
            ? (updatedReactions as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      return corsJson(req, { success: true, reactions: updated.reactions });
    }
  } catch (error) {
    console.error('[mobile/messages/reactions] DELETE error:', error);
    return corsError(req, 'Failed to remove reaction', 500);
  }
}
