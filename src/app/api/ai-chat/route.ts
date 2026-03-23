// src/app/api/ai-chat/route.ts
// =============================================================================
// NeshamaTech - AI Chat Bot API (Streaming)
// Main endpoint for the AI chat assistant in the suggestions page
// =============================================================================

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { AiChatService } from '@/lib/services/aiChatService';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiting: 30 messages/hour per user
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
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  conversationId: z.string().optional(),
  locale: z.enum(['he', 'en']).default('he'),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.user.id;

    // Rate limiting
    if (ratelimit) {
      const { success } = await ratelimit.limit(`ai-chat:${userId}`);
      if (!success) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse input
    const body = await req.json();
    const parsed = chatInputSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { message, locale } = parsed.data;

    // Get or create conversation
    const conversation = parsed.data.conversationId
      ? await (async () => {
          const existing = await (await import('@/lib/prisma')).default.aiChatConversation.findFirst({
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

    // Build system prompt and conversation history
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
            // Exclude the last message (which is the current one we just saved)
            history.slice(0, -1),
            message,
            searchContext,
          );

          for await (const chunk of generator) {
            const sanitized = AiChatService.sanitizeAiResponse(chunk, watchlistNames);
            fullResponse += sanitized;

            // SSE format
            const data = JSON.stringify({ type: 'chunk', content: sanitized });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Save assistant message
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

          // Send done event with conversationId
          const doneData = JSON.stringify({
            type: 'done',
            conversationId: conversation.id,
            hasSearchResults: searchResults.length > 0,
            searchResults: searchResults.length > 0 ? searchResults : undefined,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          // Async: extract preferences if needed
          void AiChatService.shouldExtractPreferences(conversation.id).then((shouldExtract) => {
            if (shouldExtract) {
              return AiChatService.extractAndSavePreferences(userId, conversation.id);
            }
          }).catch((err) => {
            console.error('[AiChat] Preference extraction error:', err);
          });

        } catch (err) {
          console.error('[AiChat] Stream error:', err);
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Failed to generate response',
          });
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
      },
    });
  } catch (error) {
    console.error('[AiChat API] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
