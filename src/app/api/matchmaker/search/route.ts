// =============================================================================
// Matchmaker Message Search API
// Path: src/app/api/matchmaker/search/route.ts
// =============================================================================
//
// GET — Search across all conversations the matchmaker is part of
//   Query params:
//     q      — search term (required, min 1 char)
//     scope  — "all" | "direct" | "suggestion:{id}" (default: "all")
//     userId — filter to a specific user's conversations (optional)
//     page   — page number (default: 1)
//     limit  — results per page (default: 20, max: 50)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const matchmakerId = session.user.id;
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('q')?.trim();
    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: 'Search query is required (q parameter)' },
        { status: 400 }
      );
    }

    const scope = searchParams.get('scope') || 'all';
    const filterUserId = searchParams.get('userId') || null;
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
    // 1. Search DirectMessage (matchmaker's direct conversations)
    // =========================================================================
    let directResults: Array<{
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      createdAt: string;
      conversationId: string;
      conversationType: 'direct';
      candidateName: string;
    }> = [];

    if (searchDirect) {
      // Build the direct message filter
      const directWhere: Record<string, unknown> = {
        content: { contains: query, mode: 'insensitive' },
        OR: [
          { senderId: matchmakerId },
          { receiverId: matchmakerId },
        ],
      };

      // If filtering by specific user, restrict to conversations with that user
      if (filterUserId) {
        directWhere.OR = [
          { senderId: matchmakerId, receiverId: filterUserId },
          { senderId: filterUserId, receiverId: matchmakerId },
        ];
      }

      const directMessages = await prisma.directMessage.findMany({
        where: directWhere,
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
        const isMine = msg.senderId === matchmakerId;
        const otherUser = isMine ? msg.receiver : msg.sender;
        const candidateId = isMine ? msg.receiverId : msg.senderId;
        const candidateName = `${otherUser.firstName} ${otherUser.lastName}`;

        return {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: isMine
            ? (session.user.name || 'Matchmaker')
            : candidateName,
          createdAt: msg.createdAt.toISOString(),
          conversationId: candidateId,
          conversationType: 'direct' as const,
          candidateName,
        };
      });
    }

    // =========================================================================
    // 2. Search SuggestionMessage (suggestions managed by this matchmaker)
    // =========================================================================
    let suggestionResults: Array<{
      id: string;
      content: string;
      senderId: string;
      senderName: string;
      senderType: string;
      createdAt: string;
      conversationId: string;
      conversationType: 'suggestion';
      suggestionContext: string;
      candidateName?: string;
    }> = [];

    if (searchSuggestion) {
      // Build the suggestion message filter
      const suggestionFilter: Record<string, unknown> = {
        matchmakerId,
      };

      if (specificSuggestionId) {
        suggestionFilter.id = specificSuggestionId;
      }

      // If filtering by specific user, only include suggestions involving that user
      if (filterUserId) {
        suggestionFilter.OR = [
          { firstPartyId: filterUserId },
          { secondPartyId: filterUserId },
        ];
      }

      const suggestionWhere: Record<string, unknown> = {
        content: { contains: query, mode: 'insensitive' },
        suggestion: suggestionFilter,
      };

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
              firstParty: { select: { id: true, firstName: true, lastName: true } },
              secondParty: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      suggestionResults = suggestionMessages.map((msg) => {
        const firstPartyName = `${msg.suggestion.firstParty.firstName} ${msg.suggestion.firstParty.lastName}`;
        const secondPartyName = `${msg.suggestion.secondParty.firstName} ${msg.suggestion.secondParty.lastName}`;
        const senderName = msg.senderId === matchmakerId
          ? (session.user.name || 'Matchmaker')
          : `${msg.sender.firstName} ${msg.sender.lastName}`;

        // If filtering by user, show the candidate name for context
        const candidateName = filterUserId
          ? (msg.suggestion.firstParty.id === filterUserId ? firstPartyName : secondPartyName)
          : undefined;

        return {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName,
          senderType: msg.senderType,
          createdAt: msg.createdAt.toISOString(),
          conversationId: msg.suggestionId,
          conversationType: 'suggestion' as const,
          suggestionContext: `${firstPartyName} & ${secondPartyName}`,
          candidateName,
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

    return NextResponse.json({
      success: true,
      results: paginatedResults,
      totalCount,
      page,
      limit,
      hasMore: skip + limit < totalCount,
    });
  } catch (error) {
    console.error('[matchmaker/search] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
