// src/app/api/ai-chat/history/route.ts
// =============================================================================
// NeshamaTech - AI Chat History API
// Returns conversation history for the current user
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AiChatService } from '@/lib/services/aiChatService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const before = searchParams.get('before') || undefined;

    // Get or create conversation
    const conversation = await AiChatService.getOrCreateConversation(userId);

    // Get messages
    const messages = await AiChatService.getConversationHistory(
      conversation.id,
      limit,
      before,
    );

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      title: conversation.title,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[AiChat History] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
