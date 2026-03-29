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
  suggestionId: z.string().optional(), // When set, chat is contextual to a specific suggestion
  locale: z.enum(['he', 'en']).default('he'),
  requestType: z.enum(['default', 'profile_summary']).optional(), // Enhanced context modes
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

    const { message, locale, suggestionId, requestType } = parsed.data;

    // Get or create conversation
    const conversation = parsed.data.conversationId
      ? await (async () => {
          const existing = await (await import('@/lib/prisma')).default.aiChatConversation.findFirst({
            where: { id: parsed.data.conversationId, userId },
          });
          return existing || AiChatService.getOrCreateConversation(userId, suggestionId);
        })()
      : await AiChatService.getOrCreateConversation(userId, suggestionId);

    // Save user message
    await AiChatService.saveMessage(conversation.id, 'user', message);

    const effectiveSuggestionId = suggestionId || conversation.suggestionId;
    const conversationPhase = conversation.phase || 'discovery';
    const isGeneralChat = !effectiveSuggestionId; // General chat = smart assistant with phases

    // Detect search intent (user explicitly asks to search, or agrees to AI's suggestion)
    const isSearchRequest = AiChatService.detectSearchIntent(message);

    // === Build context based on conversation type ===

    let suggestionContext: string | undefined;
    let candidateContext: string | undefined;
    let searchContext: string | undefined;
    let searchResults: Awaited<ReturnType<typeof AiChatService.searchMatches>> = [];

    // Check for cached summary before expensive AI call
    let cachedSummary: string | null = null;

    if (effectiveSuggestionId) {
      // Deep profile summary mode — load comprehensive profile data
      if (requestType === 'profile_summary') {
        // Try cache first
        cachedSummary = await AiChatService.getCachedSummary(effectiveSuggestionId, userId);
        if (!cachedSummary) {
          suggestionContext = (await AiChatService.buildDeepProfileContext(effectiveSuggestionId, userId, locale)) || undefined;
        }
      }
      // Fallback to standard suggestion context
      if (!suggestionContext && !cachedSummary) {
        suggestionContext = (await AiChatService.getSuggestionContext(effectiveSuggestionId, userId, locale)) || undefined;
      }
    } else if (conversationPhase === 'presenting' || conversationPhase === 'discussing') {
      // General chat with a candidate being presented
      if (conversation.currentCandidateUserId) {
        candidateContext = (await AiChatService.buildCandidateContext(
          conversation.currentCandidateUserId, userId, locale,
        )) || undefined;
      }
    }

    // Handle search in general chat (old anonymous search for suggestion-specific chats)
    if (isSearchRequest && effectiveSuggestionId) {
      searchResults = await AiChatService.searchMatches(userId);
      searchContext = AiChatService.formatSearchResultsForAI(searchResults);
    }

    // Detect show profile intent (user asks to see profile card again)
    const isShowProfileRequest = isGeneralChat
      && (conversationPhase === 'presenting' || conversationPhase === 'discussing')
      && conversation.currentCandidateUserId
      && AiChatService.detectShowProfileIntent(message);

    // Detect escalation intent
    const isEscalationRequest = AiChatService.detectEscalationIntent(message);

    // Detect action intent (approve/decline) for suggestion-specific chats
    const actionIntent = effectiveSuggestionId ? AiChatService.detectActionIntent(message) : null;

    // Build system prompt (phase-aware for general chat)
    const phase = isGeneralChat ? conversationPhase : undefined;
    const contextForPrompt = suggestionContext || candidateContext;

    const [systemPrompt, history, watchlistNames] = await Promise.all([
      AiChatService.buildSystemPrompt(userId, locale, contextForPrompt, phase),
      AiChatService.buildConversationHistory(conversation.id),
      AiChatService.getWatchlistNames(userId),
    ]);

    // If we have a cached summary, serve it directly without AI call
    if (cachedSummary) {
      const encoder = new TextEncoder();
      const cachedStream = new ReadableStream({
        async start(controller) {
          try {
            // Save as assistant message
            await AiChatService.saveMessage(conversation.id, 'assistant', cachedSummary!);

            // Stream the cached response in a single chunk
            const data = JSON.stringify({ type: 'chunk', content: cachedSummary });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // Quick replies for cached response
            const quickReplies = locale === 'he'
              ? ['מה המשותף בינינו?', 'ספר/י לי עוד', 'יש לי שאלות']
              : ['What do we have in common?', 'Tell me more', 'I have questions'];

            const doneData = JSON.stringify({
              type: 'done',
              conversationId: conversation.id,
              suggestionId: effectiveSuggestionId || undefined,
              quickReplies,
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          } catch (err) {
            console.error('[AiChat] Cache stream error:', err);
            const errorData = JSON.stringify({ type: 'error', error: 'Failed to serve cached response' });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(cachedStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Stream response
    const encoder = new TextEncoder();
    let fullResponse = '';
    const isProfileSummaryRequest = requestType === 'profile_summary';

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

          // Extract AI-generated suggestions from the response
          const { cleanedResponse, suggestions: aiSuggestions } = AiChatService.extractSuggestionsFromResponse(fullResponse);
          fullResponse = cleanedResponse;

          // Save assistant message (cleaned, without suggestion tags)
          const msgMetadata: Record<string, unknown> = {};
          if (searchResults.length > 0) {
            msgMetadata.matchSearchResults = searchResults.map((r) => r.id);
            msgMetadata.toolUsed = 'search';
          }

          await AiChatService.saveMessage(
            conversation.id,
            'assistant',
            fullResponse,
            Object.keys(msgMetadata).length > 0 ? msgMetadata : undefined,
          );

          // Cache profile summary for future requests
          if (isProfileSummaryRequest && effectiveSuggestionId && fullResponse.length > 100) {
            void AiChatService.cacheSummary(effectiveSuggestionId, userId, fullResponse);
          }

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
              console.error('[AiChat] Escalation error:', err);
            }
          }

          // Get available actions if user expressed action intent
          let actions: Awaited<ReturnType<typeof AiChatService.getAvailableActions>> = [];
          if (actionIntent && effectiveSuggestionId) {
            actions = await AiChatService.getAvailableActions(effectiveSuggestionId, userId);
          }

          // === Handle search trigger for general chat ===
          let nextCandidate: Awaited<ReturnType<typeof AiChatService.getNextCandidate>> = null;
          if (isGeneralChat && isSearchRequest && conversationPhase === 'discovery') {
            nextCandidate = await AiChatService.getNextCandidate(userId, conversation.id);
            if (nextCandidate) {
              await AiChatService.updateConversationPhase(
                conversation.id,
                'presenting',
                nextCandidate.candidateUserId,
                nextCandidate.candidateUserId,
              );

              // Save a profile_card message with match reasoning as intro text
              const introText = nextCandidate.shortReasoning
                ? (locale === 'he'
                  ? `מצאתי מישהו/י שיכול/ה להתאים לך — ${nextCandidate.shortReasoning}`
                  : `I found someone who could be a great match — ${nextCandidate.shortReasoning}`)
                : (locale === 'he' ? 'מצאתי מישהו/י שיכול/ה להתאים לך:' : 'I found someone who could be a great match:');

              await AiChatService.saveMessage(
                conversation.id,
                'assistant',
                introText,
                {
                  type: 'profile_card',
                  candidateUserId: nextCandidate.candidateUserId,
                },
              );
            }
          }

          // Use AI-generated suggestions if available, otherwise fall back to static ones
          let quickReplies: string[];
          if (aiSuggestions.length > 0) {
            quickReplies = aiSuggestions;
          } else {
            const messageCount = history.length + 1;
            let suggestionStatus: string | null = null;
            if (effectiveSuggestionId) {
              const sg = await (await import('@/lib/prisma')).default.matchSuggestion.findUnique({
                where: { id: effectiveSuggestionId },
                select: { status: true },
              });
              suggestionStatus = sg?.status || null;
            }
            quickReplies = AiChatService.getQuickReplies(
              locale, effectiveSuggestionId || null, suggestionStatus, messageCount,
            );
          }

          // Re-show profile card if user explicitly asked for it
          const showProfileCardAgain = isShowProfileRequest && conversation.currentCandidateUserId;
          if (showProfileCardAgain) {
            await AiChatService.saveMessage(
              conversation.id,
              'assistant',
              '',
              { type: 'profile_card', candidateUserId: conversation.currentCandidateUserId },
            );
          }

          // Determine if we should show action buttons (new candidate OR re-showing profile)
          const shouldShowActionButtons = nextCandidate || showProfileCardAgain;
          const actionButtonsCandidateId = nextCandidate?.candidateUserId || (showProfileCardAgain ? conversation.currentCandidateUserId : undefined);

          // Send done event
          const doneData = JSON.stringify({
            type: 'done',
            conversationId: conversation.id,
            suggestionId: effectiveSuggestionId || undefined,
            // Phase info for general chat
            phase: isGeneralChat ? (nextCandidate ? 'presenting' : conversationPhase) : undefined,
            candidateUserId: nextCandidate?.candidateUserId || conversation.currentCandidateUserId || undefined,
            // Legacy search results (for suggestion-specific chats)
            hasSearchResults: searchResults.length > 0,
            searchResults: searchResults.length > 0 ? searchResults : undefined,
            escalated,
            actions: actions.length > 0 ? actions : undefined,
            quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
            // Re-show profile card when user asked for it
            showProfileCard: showProfileCardAgain ? true : undefined,
            // Action buttons for presenting phase
            actionButtons: shouldShowActionButtons ? [
              { type: 'interested', label: { he: 'מעוניין/ת', en: 'Interested' } },
              { type: 'not_for_me', label: { he: 'לא מתאים', en: 'Not for me' } },
              { type: 'tell_me_more', label: { he: 'ספר/י לי עוד', en: 'Tell me more' } },
              { type: 'next_candidate', label: { he: 'הבא/ה', en: 'Next' } },
            ] : undefined,
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

          // Async: generate summary for matchmaker if meaningful conversation
          void AiChatService.generateAndSaveSummary(
            conversation.id,
            effectiveSuggestionId || null,
            userId,
          ).catch((err) => {
            console.error('[AiChat] Summary generation error:', err);
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
