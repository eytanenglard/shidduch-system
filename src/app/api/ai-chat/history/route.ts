// src/app/api/ai-chat/history/route.ts
// =============================================================================
// NeshamaTech - AI Chat History API
// Returns conversation history for the current user
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AiChatService } from '@/lib/services/aiChatService';

interface FormattedMessage {
  id: string;
  role: string;
  content: string;
  metadata: unknown;
  createdAt: string;
}

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
    const suggestionId = searchParams.get('suggestionId') || undefined;

    // Get or create conversation (optionally for a specific suggestion)
    const conversation = await AiChatService.getOrCreateConversation(userId, suggestionId);

    // Get AI chat messages
    const messages = await AiChatService.getConversationHistory(
      conversation.id,
      limit,
      before,
    );

    let allMessages: FormattedMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      metadata: m.metadata,
      createdAt: m.createdAt.toISOString(),
    }));

    // For suggestion-specific chats, also include matchmaker messages from SuggestionMessage
    if (suggestionId) {
      const matchmakerMessages = await prisma.suggestionMessage.findMany({
        where: {
          suggestionId,
          senderType: 'MATCHMAKER',
          targetUserId: userId,
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: { select: { firstName: true } },
        },
      });

      if (matchmakerMessages.length > 0) {
        const matchmakerFormatted: FormattedMessage[] = matchmakerMessages.map((m) => ({
          id: `mm-${m.id}`,
          role: 'matchmaker',
          content: m.content,
          metadata: { source: 'matchmaker', senderName: m.sender.firstName },
          createdAt: m.createdAt.toISOString(),
        }));

        // Merge and sort by createdAt
        allMessages = [...allMessages, ...matchmakerFormatted]
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      title: conversation.title,
      messages: allMessages,
      // Smart assistant phase data
      phase: conversation.phase || 'discovery',
      currentCandidateUserId: conversation.currentCandidateUserId || null,
    });
  } catch (error) {
    console.error('[AiChat History] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
