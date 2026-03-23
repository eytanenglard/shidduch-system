// =============================================================================
// Message Reactions API
// Path: src/app/api/messages/[id]/reactions/route.ts
// =============================================================================
//
// POST   — Add a reaction to a message
// DELETE — Remove a reaction from a message
//
// Query param: messageType=direct|suggestion
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Zod schemas
const addReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

const removeReactionSchema = z.object({
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

// ==========================================
// POST — Add reaction to a message
// ==========================================
export async function POST(
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

    // Validate body
    const body = await req.json();
    const parsed = addReactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { emoji } = parsed.data;

    // Validate emoji is in allowed list
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Emoji not allowed' },
        { status: 400 }
      );
    }

    if (messageType === 'direct') {
      // Fetch the direct message — verify user is sender or receiver
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, receiverId: true, reactions: true },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      if (message.senderId !== userId && message.receiverId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Build updated reactions array
      const existingReactions = (message.reactions as Reaction[] | null) || [];
      // Check if user already reacted with this emoji
      const alreadyReacted = existingReactions.some(
        (r) => r.emoji === emoji && r.userId === userId
      );
      if (alreadyReacted) {
        return NextResponse.json({ error: 'Already reacted with this emoji' }, { status: 409 });
      }

      const updatedReactions: Reaction[] = [
        ...existingReactions,
        { emoji, userId, createdAt: new Date().toISOString() },
      ];

      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: { reactions: updatedReactions as unknown as Prisma.InputJsonValue },
      });

      return NextResponse.json({ success: true, reactions: updated.reactions });
    } else {
      // suggestion message
      const message = await prisma.suggestionMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, suggestionId: true, reactions: true },
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

      const existingReactions = (message.reactions as Reaction[] | null) || [];
      const alreadyReacted = existingReactions.some(
        (r) => r.emoji === emoji && r.userId === userId
      );
      if (alreadyReacted) {
        return NextResponse.json({ error: 'Already reacted with this emoji' }, { status: 409 });
      }

      const updatedReactions: Reaction[] = [
        ...existingReactions,
        { emoji, userId, createdAt: new Date().toISOString() },
      ];

      const updated = await prisma.suggestionMessage.update({
        where: { id: messageId },
        data: { reactions: updatedReactions as unknown as Prisma.InputJsonValue },
      });

      return NextResponse.json({ success: true, reactions: updated.reactions });
    }
  } catch (error) {
    console.error('[Reactions] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
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

    // Validate body
    const body = await req.json();
    const parsed = removeReactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { emoji } = parsed.data;

    if (messageType === 'direct') {
      const message = await prisma.directMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, receiverId: true, reactions: true },
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      if (message.senderId !== userId && message.receiverId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

      return NextResponse.json({ success: true, reactions: updated.reactions });
    } else {
      const message = await prisma.suggestionMessage.findUnique({
        where: { id: messageId },
        select: { id: true, senderId: true, suggestionId: true, reactions: true },
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

      return NextResponse.json({ success: true, reactions: updated.reactions });
    }
  } catch (error) {
    console.error('[Reactions] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
