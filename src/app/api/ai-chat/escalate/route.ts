// src/app/api/ai-chat/escalate/route.ts
// =============================================================================
// NeshamaTech - Escalate AI Chat to Matchmaker
// Transfers conversation context to the matchmaker via suggestion chat
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { AiChatService } from '@/lib/services/aiChatService';

const escalateSchema = z.object({
  conversationId: z.string(),
  suggestionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = escalateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await AiChatService.escalateToMatchmaker(
      parsed.data.conversationId,
      parsed.data.suggestionId,
      session.user.id,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to escalate conversation' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[AiChat Escalate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
