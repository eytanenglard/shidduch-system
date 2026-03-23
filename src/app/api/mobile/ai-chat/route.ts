// src/app/api/mobile/ai-chat/route.ts
// Mobile endpoint for AI Chat Bot (streaming)

import { NextRequest } from 'next/server';
import { verifyMobileToken, corsError, corsOptions } from '@/lib/mobile-auth';
import { z } from 'zod';
import { AiChatService } from '@/lib/services/aiChatService';
import prisma from '@/lib/prisma';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
  });
}

const chatInputSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  locale: z.enum(['he', 'en']).default('he'),
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401, 'AUTH_REQUIRED');
    }

    const userId = auth.userId;

    // Rate limiting
    if (ratelimit) {
      const { success } = await ratelimit.limit(`ai-chat-mobile:${userId}`);
      if (!success) {
        return corsError(req, 'Rate limit exceeded', 429, 'RATE_LIMIT');
      }
    }

    const body = await req.json();
    const parsed = chatInputSchema.safeParse(body);
    if (!parsed.success) {
      return corsError(req, 'Invalid input', 400, 'VALIDATION_ERROR');
    }

    const { message, locale } = parsed.data;

    // Get or create conversation
    const conversation = parsed.data.conversationId
      ? await (async () => {
          const existing = await prisma.aiChatConversation.findFirst({
            where: { id: parsed.data.conversationId, userId },
          });
          return existing || AiChatService.getOrCreateConversation(userId);
        })()
      : await AiChatService.getOrCreateConversation(userId);

    // Save user message
    await AiChatService.saveMessage(conversation.id, 'user', message);

    // Detect search intent
    const isSearchRequest = AiChatService.detectSearchIntent(message);
    let searchContext: string | undefined;
    let searchResults: Awaited<ReturnType<typeof AiChatService.searchMatches>> = [];

    if (isSearchRequest) {
      searchResults = await AiChatService.searchMatches(userId);
      searchContext = AiChatService.formatSearchResultsForAI(searchResults);
    }

    // Build prompt and history
    const [systemPrompt, history, watchlistNames] = await Promise.all([
      AiChatService.buildSystemPrompt(userId, locale),
      AiChatService.buildConversationHistory(conversation.id),
      AiChatService.getWatchlistNames(userId),
    ]);

    // Stream response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = AiChatService.streamResponse(
            systemPrompt,
            history.slice(0, -1),
            message,
            searchContext,
          );

          for await (const chunk of generator) {
            const sanitized = AiChatService.sanitizeAiResponse(chunk, watchlistNames);
            fullResponse += sanitized;
            const data = JSON.stringify({ type: 'chunk', content: sanitized });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          const metadata: Record<string, unknown> = {};
          if (searchResults.length > 0) {
            metadata.matchSearchResults = searchResults.map((r) => r.id);
            metadata.toolUsed = 'search';
          }

          await AiChatService.saveMessage(
            conversation.id,
            'assistant',
            fullResponse,
            Object.keys(metadata).length > 0 ? metadata : undefined,
          );

          const doneData = JSON.stringify({
            type: 'done',
            conversationId: conversation.id,
            hasSearchResults: searchResults.length > 0,
            searchResults: searchResults.length > 0 ? searchResults : undefined,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          void AiChatService.shouldExtractPreferences(conversation.id).then((shouldExtract) => {
            if (shouldExtract) {
              return AiChatService.extractAndSavePreferences(userId, conversation.id);
            }
          }).catch((err) => {
            console.error('[AiChat Mobile] Preference extraction error:', err);
          });

        } catch (err) {
          console.error('[AiChat Mobile] Stream error:', err);
          const errorData = JSON.stringify({ type: 'error', error: 'Failed to generate response' });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[AiChat Mobile] Error:', error);
    return corsError(req, error instanceof Error ? error.message : 'Internal error', 500, 'INTERNAL_ERROR');
  }
}
