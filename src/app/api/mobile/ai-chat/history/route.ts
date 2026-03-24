// src/app/api/mobile/ai-chat/history/route.ts
// Mobile endpoint for AI Chat history

import { NextRequest } from 'next/server';
import { verifyMobileToken, corsJson, corsError, corsOptions } from '@/lib/mobile-auth';
import { AiChatService } from '@/lib/services/aiChatService';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401, 'AUTH_REQUIRED');
    }

    const userId = auth.userId;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const before = searchParams.get('before') || undefined;
    const suggestionId = searchParams.get('suggestionId') || undefined;

    const conversation = await AiChatService.getOrCreateConversation(userId, suggestionId);
    const messages = await AiChatService.getConversationHistory(
      conversation.id,
      limit,
      before,
    );

    return corsJson(req, {
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
    console.error('[AiChat Mobile History] Error:', error);
    return corsError(req, error instanceof Error ? error.message : 'Internal error', 500, 'INTERNAL_ERROR');
  }
}
