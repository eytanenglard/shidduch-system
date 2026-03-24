// src/app/api/ai-chat/rate/route.ts
// =============================================================================
// Rate an AI chat message (thumbs up/down)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const rateSchema = z.object({
  messageId: z.string(),
  rating: z.enum(['up', 'down']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = rateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { messageId, rating } = parsed.data;

    // Verify the message belongs to the user's conversation
    const message = await prisma.aiChatMessage.findFirst({
      where: {
        id: messageId,
        role: 'assistant',
        conversation: { userId: session.user.id },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update message metadata with rating
    const existingMetadata = (message.metadata as Record<string, unknown>) || {};
    await prisma.aiChatMessage.update({
      where: { id: messageId },
      data: {
        metadata: {
          ...existingMetadata,
          userRating: rating,
          ratedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error('[AiChat Rate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
