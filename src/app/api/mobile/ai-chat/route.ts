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
  suggestionId: z.string().optional(), // When set, chat is contextual to a specific suggestion
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

    const { message, locale, suggestionId } = parsed.data;

    // Get or create conversation
    const conversation = parsed.data.conversationId
      ? await (async () => {
          const existing = await prisma.aiChatConversation.findFirst({
            where: { id: parsed.data.conversationId, userId },
          });
          return existing || AiChatService.getOrCreateConversation(userId, suggestionId);
        })()
      : await AiChatService.getOrCreateConversation(userId, suggestionId);

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

    // Detect escalation intent
    const isEscalationRequest = AiChatService.detectEscalationIntent(message);

    // Build suggestion context if this is a suggestion-specific conversation
    const effectiveSuggestionId = suggestionId || conversation.suggestionId;

    // Detect action intent (approve/decline) for suggestion-specific chats
    const actionIntent = effectiveSuggestionId ? AiChatService.detectActionIntent(message) : null;
    let suggestionContext: string | undefined;
    if (effectiveSuggestionId) {
      suggestionContext = (await AiChatService.getSuggestionContext(effectiveSuggestionId, userId, locale)) || undefined;
    }

    // Build prompt and history
    const [systemPrompt, history, watchlistNames] = await Promise.all([
      AiChatService.buildSystemPrompt(userId, locale, suggestionContext),
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

          // Extract AI-generated suggestions from the response
          const { cleanedResponse, suggestions: aiSuggestions } = AiChatService.extractSuggestionsFromResponse(fullResponse);
          fullResponse = cleanedResponse;

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

          // Handle escalation: create suggestion message for matchmaker
          let escalated = false;
          if (isEscalationRequest && effectiveSuggestionId) {
            try {
              const result = await AiChatService.escalateToMatchmaker(
                conversation.id,
                effectiveSuggestionId,
                userId,
              );
              escalated = result.success;
            } catch (err) {
              console.error('[AiChat Mobile] Escalation error:', err);
            }
          }

          // Get available actions if user expressed action intent
          let actions: Awaited<ReturnType<typeof AiChatService.getAvailableActions>> = [];
          if (actionIntent && effectiveSuggestionId) {
            actions = await AiChatService.getAvailableActions(effectiveSuggestionId, userId);
          }

          // Use AI-generated suggestions if available, otherwise fall back to static ones
          let quickReplies: string[];
          if (aiSuggestions.length > 0) {
            quickReplies = aiSuggestions;
          } else {
            const messageCount = history.length + 1;
            let suggestionStatus: string | null = null;
            if (effectiveSuggestionId) {
              const sg = await prisma.matchSuggestion.findUnique({
                where: { id: effectiveSuggestionId },
                select: { status: true },
              });
              suggestionStatus = sg?.status || null;
            }
            quickReplies = AiChatService.getQuickReplies(
              locale, effectiveSuggestionId || null, suggestionStatus, messageCount,
            );
          }

          const doneData = JSON.stringify({
            type: 'done',
            conversationId: conversation.id,
            suggestionId: effectiveSuggestionId || undefined,
            hasSearchResults: searchResults.length > 0,
            searchResults: searchResults.length > 0 ? searchResults : undefined,
            escalated,
            actions: actions.length > 0 ? actions : undefined,
            quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          // Async: extract preferences if needed
          void AiChatService.shouldExtractPreferences(conversation.id).then((shouldExtract) => {
            if (shouldExtract) {
              return AiChatService.extractAndSavePreferences(userId, conversation.id);
            }
          }).catch((err) => {
            console.error('[AiChat Mobile] Preference extraction error:', err);
          });

          // Async: generate summary for matchmaker if meaningful conversation
          void AiChatService.generateAndSaveSummary(
            conversation.id,
            effectiveSuggestionId || null,
            userId,
          ).catch((err) => {
            console.error('[AiChat Mobile] Summary generation error:', err);
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
