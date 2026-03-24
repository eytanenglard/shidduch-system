// =============================================================================
// src/app/api/mobile/messages/search/route.ts
// =============================================================================
//
// OPTIONS + GET — Search across user's DirectMessage and SuggestionMessage
//
//   Query params:
//     q      — search term (required, min 1 char)
//     scope  — "all" | "direct" | "suggestion:{id}" (default: "all")
//     page   — page number (default: 1)
//     limit  — results per page (default: 20, max: 50)
//
// Mobile mirror of /api/messages/search with JWT auth.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET — Search messages
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const userId = auth.userId;
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('q')?.trim();
    if (!query || query.length < 1) {
      return corsError(req, 'Search query is required (q parameter)', 400);
    }

    const scope = searchParams.get('scope') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    // Determine which scopes to search
    const searchDirect = scope === 'all' || scope === 'direct';
    const searchSuggestion = scope === 'all' || scope.startsWith('suggestion');
    const specificSuggestionId = scope.startsWith('suggestion:')
      ? scope.replace('suggestion:', '')
      : null;

    // =========================================================================
    // 1. Search DirectMessage (user's conversations with assigned matchmaker)
    // =========================================================================
    let directResults: Array<{
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      createdAt: string;
      conversationId: string;
      conversationType: 'direct';
    }> = [];

    if (searchDirect) {
      const directMessages = await prisma.directMessage.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
          sender: {
            select: { id: true, firstName: true, lastName: true },
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      directResults = directMessages.map((msg) => {
        const isMine = msg.senderId === userId;
        const otherUser = isMine ? msg.receiver : msg.sender;
        const conversationPartnerId = isMine ? msg.receiverId : msg.senderId;

        return {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: isMine
            ? 'אני'
            : `${otherUser.firstName} ${otherUser.lastName}`,
          createdAt: msg.createdAt.toISOString(),
          conversationId: conversationPartnerId,
          conversationType: 'direct' as const,
        };
      });
    }

    // =========================================================================
    // 2. Search SuggestionMessage (suggestions where user is a party)
    // =========================================================================
    let suggestionResults: Array<{
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      createdAt: string;
      conversationId: string;
      conversationType: 'suggestion';
      suggestionContext?: string;
    }> = [];

    if (searchSuggestion) {
      // Build suggestion filter — user must be firstParty or secondParty
      const suggestionWhere: Record<string, unknown> = {
        content: { contains: query, mode: 'insensitive' },
        suggestion: {
          OR: [
            { firstPartyId: userId },
            { secondPartyId: userId },
          ],
        },
      };

      // If searching a specific suggestion, add its ID filter
      if (specificSuggestionId) {
        (suggestionWhere.suggestion as Record<string, unknown>).id = specificSuggestionId;
      }

      const suggestionMessages = await prisma.suggestionMessage.findMany({
        where: suggestionWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          senderId: true,
          senderType: true,
          createdAt: true,
          suggestionId: true,
          sender: {
            select: { id: true, firstName: true, lastName: true },
          },
          suggestion: {
            select: {
              id: true,
              firstParty: { select: { firstName: true, lastName: true } },
              secondParty: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      suggestionResults = suggestionMessages.map((msg) => {
        const firstPartyName = `${msg.suggestion.firstParty.firstName} ${msg.suggestion.firstParty.lastName}`;
        const secondPartyName = `${msg.suggestion.secondParty.firstName} ${msg.suggestion.secondParty.lastName}`;

        let senderName: string;
        if (msg.senderId === userId) {
          senderName = 'אני';
        } else {
          senderName = `${msg.sender.firstName} ${msg.sender.lastName}`;
        }

        return {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName,
          createdAt: msg.createdAt.toISOString(),
          conversationId: msg.suggestionId,
          conversationType: 'suggestion' as const,
          suggestionContext: `${firstPartyName} & ${secondPartyName}`,
        };
      });
    }

    // =========================================================================
    // 3. Merge, sort by recency, paginate
    // =========================================================================
    const allResults = [...directResults, ...suggestionResults].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalCount = allResults.length;
    const paginatedResults = allResults.slice(skip, skip + limit);

    return corsJson(req, {
      success: true,
      results: paginatedResults,
      totalCount,
      page,
      limit,
      hasMore: skip + limit < totalCount,
    });
  } catch (error) {
    console.error('[mobile/messages/search] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}
