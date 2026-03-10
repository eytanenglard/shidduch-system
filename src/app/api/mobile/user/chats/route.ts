// =============================================================================
// src/app/api/mobile/user/chats/route.ts
// =============================================================================
//
// GET — Returns all chat threads for the current user (mobile JWT auth):
//   1. Direct chat with assigned matchmaker
//   2. Per-suggestion chats (for each active suggestion)
//
// Mirror of /api/messages/chats but with JWT auth for mobile.
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

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const userId = auth.userId;

    interface ChatSummary {
      id: string;
      type: 'direct' | 'suggestion';
      title: string;
      subtitle?: string;
      matchmakerName: string;
      matchmakerId?: string;
      lastMessage?: string;
      lastMessageTime?: string;
      lastMessageIsMine?: boolean;
      unreadCount: number;
      suggestionId?: string;
      status?: string;
      otherPartyName?: string;
    }

    const chats: ChatSummary[] = [];

    // ==========================================
    // 1. Direct chat with assigned matchmaker
    // ==========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        assignedMatchmakerId: true,
        assignedMatchmaker: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (user?.assignedMatchmaker) {
      const matchmakerId = user.assignedMatchmakerId!;
      const matchmakerName = `${user.assignedMatchmaker.firstName} ${user.assignedMatchmaker.lastName}`;

      const lastDirectMsg = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: matchmakerId },
            { senderId: matchmakerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, senderId: true, isBroadcast: true },
      });

      const directUnread = await prisma.directMessage.count({
        where: {
          receiverId: userId,
          senderId: matchmakerId,
          isRead: false,
        },
      });

      chats.push({
        id: 'direct',
        type: 'direct',
        title: matchmakerName,
        subtitle: 'שיחה כללית עם השדכן/ית',
        matchmakerName,
        matchmakerId,
        lastMessage: lastDirectMsg?.content,
        lastMessageTime: lastDirectMsg?.createdAt.toISOString(),
        lastMessageIsMine: lastDirectMsg?.senderId === userId,
        unreadCount: directUnread,
      });
    }

    // ==========================================
    // 2. Suggestion-based chats (batched queries)
    // ==========================================
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
        status: {
          notIn: [
            'FIRST_PARTY_DECLINED',
            'SECOND_PARTY_DECLINED',
            'MATCH_DECLINED',
            'CANCELLED',
            'CLOSED',
            'EXPIRED',
            'ENDED_AFTER_FIRST_DATE',
          ],
        },
      },
      include: {
        firstParty: { select: { firstName: true, lastName: true } },
        secondParty: { select: { firstName: true, lastName: true } },
        matchmaker: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (suggestions.length > 0) {
      const suggestionIds = suggestions.map((s) => s.id);

      // Batch: last message per suggestion
      const lastMessages = await prisma.$queryRaw<
        Array<{
          suggestionId: string;
          content: string;
          createdAt: Date;
          senderId: string;
        }>
      >`
        SELECT DISTINCT ON ("suggestionId")
          "suggestionId", "content", "createdAt", "senderId"
        FROM "SuggestionMessage"
        WHERE "suggestionId" = ANY(${suggestionIds})
          AND (
            ("senderId" = ${userId} AND "senderType" = 'USER')
            OR ("senderType" = 'MATCHMAKER' AND ("targetUserId" = ${userId} OR "targetUserId" IS NULL))
            OR "senderType" = 'SYSTEM'
          )
        ORDER BY "suggestionId", "createdAt" DESC
      `;

      // Batch: unread count per suggestion
      const unreadCounts = await prisma.$queryRaw<
        Array<{ suggestionId: string; count: bigint }>
      >`
        SELECT "suggestionId", COUNT(*) as count
        FROM "SuggestionMessage"
        WHERE "suggestionId" = ANY(${suggestionIds})
          AND "isRead" = false
          AND "senderId" != ${userId}
          AND (
            "targetUserId" = ${userId}
            OR "targetUserId" IS NULL
            OR "senderType" = 'SYSTEM'
          )
        GROUP BY "suggestionId"
      `;

      const lastMsgMap = new Map(
        lastMessages.map((m) => [m.suggestionId, m])
      );
      const unreadMap = new Map(
        unreadCounts.map((u) => [u.suggestionId, Number(u.count)])
      );

      for (const suggestion of suggestions) {
        const isFirstParty = suggestion.firstPartyId === userId;
        const otherParty = isFirstParty
          ? suggestion.secondParty
          : suggestion.firstParty;
        const matchmakerName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;
        const lastMsg = lastMsgMap.get(suggestion.id);
        const unreadCount = unreadMap.get(suggestion.id) || 0;

        chats.push({
          id: suggestion.id,
          type: 'suggestion',
          title: `הצעה: ${otherParty.firstName} ${otherParty.lastName}`,
          subtitle: `שדכן/ית: ${matchmakerName}`,
          matchmakerName,
          matchmakerId: suggestion.matchmaker.id,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.createdAt.toISOString(),
          lastMessageIsMine: lastMsg?.senderId === userId,
          unreadCount,
          suggestionId: suggestion.id,
          status: suggestion.status,
          otherPartyName: `${otherParty.firstName} ${otherParty.lastName}`,
        });
      }
    }

    // Sort: unread first, then by last message time
    chats.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      // Direct chat second priority
      if (a.type === 'direct' && b.type !== 'direct') return -1;
      if (a.type !== 'direct' && b.type === 'direct') return 1;
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

    return corsJson(req, {
      success: true,
      chats,
      totalUnread,
    });
  } catch (error) {
    console.error('[mobile/user/chats] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}