// =============================================================================
// src/app/api/mobile/matchmaker/chat/summaries/route.ts
// =============================================================================
//
// Unified inbox summaries for matchmaker on mobile.
// Returns both suggestion-based chats and direct chats in a single call.
//
// This mirrors /api/matchmaker/chat/summaries but uses JWT auth (mobile).
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
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
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const matchmakerId = auth.userId;

    // =========================================================================
    // 1. Active suggestions with names + last messages
    // =========================================================================
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        matchmakerId,
        category: { not: 'HISTORY' },
      },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: {
          select: { id: true, firstName: true, lastName: true },
        },
        secondParty: {
          select: { id: true, firstName: true, lastName: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            content: true,
            createdAt: true,
            senderType: true,
            senderId: true,
            targetUserId: true,
          },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });

    // =========================================================================
    // 2. Unread counts per suggestion
    // =========================================================================
    const unreadCounts = await prisma.suggestionMessage.groupBy({
      by: ['suggestionId'],
      where: {
        senderType: 'USER',
        isRead: false,
        suggestion: { matchmakerId },
      },
      _count: { id: true },
    });

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.suggestionId, u._count.id])
    );

    // =========================================================================
    // 3. Direct chats
    // =========================================================================
    const [sentTo, receivedFrom] = await Promise.all([
      prisma.directMessage.findMany({
        where: { senderId: matchmakerId },
        select: { receiverId: true },
        distinct: ['receiverId'],
      }),
      prisma.directMessage.findMany({
        where: { receiverId: matchmakerId },
        select: { senderId: true },
        distinct: ['senderId'],
      }),
    ]);

    const directUserIds = [
      ...new Set([
        ...sentTo.map((m) => m.receiverId),
        ...receivedFrom.map((m) => m.senderId),
      ]),
    ];

    let directChatSummaries: Array<{
      userId: string;
      name: string;
      lastMessage?: string;
      lastMessageTime?: string;
      lastMessageIsMine?: boolean;
      unreadCount: number;
    }> = [];

    if (directUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: directUserIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const directUnread = await prisma.directMessage.groupBy({
        by: ['senderId'],
        where: {
          receiverId: matchmakerId,
          senderId: { in: directUserIds },
          isRead: false,
        },
        _count: { id: true },
      });
      const directUnreadMap = new Map(
        directUnread.map((u) => [u.senderId, u._count.id])
      );

      const lastMessages = await Promise.all(
        directUserIds.map(async (uid) => {
          const msg = await prisma.directMessage.findFirst({
            where: {
              OR: [
                { senderId: uid, receiverId: matchmakerId },
                { senderId: matchmakerId, receiverId: uid },
              ],
            },
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true, senderId: true },
          });
          return { userId: uid, msg };
        })
      );

      directChatSummaries = lastMessages
        .filter((lm) => lm.msg !== null)
        .map((lm) => {
          const user = userMap.get(lm.userId);
          return {
            userId: lm.userId,
            name: user
              ? `${user.firstName} ${user.lastName}`
              : 'Unknown',
            lastMessage: lm.msg!.content,
            lastMessageTime: lm.msg!.createdAt.toISOString(),
            lastMessageIsMine: lm.msg!.senderId === matchmakerId,
            unreadCount: directUnreadMap.get(lm.userId) || 0,
          };
        })
        .sort((a, b) => {
          if (a.unreadCount !== b.unreadCount)
            return b.unreadCount - a.unreadCount;
          const timeA = a.lastMessageTime
            ? new Date(a.lastMessageTime).getTime()
            : 0;
          const timeB = b.lastMessageTime
            ? new Date(b.lastMessageTime).getTime()
            : 0;
          return timeB - timeA;
        });
    }

    // =========================================================================
    // Build response
    // =========================================================================
    const suggestionSummaries = suggestions.map((s) => {
      const firstId = s.firstPartyId;
      const secondId = s.secondPartyId;

      const firstMsg = s.messages.find(
        (m) =>
          (m.senderType === 'USER' && m.senderId === firstId) ||
          (m.senderType === 'MATCHMAKER' &&
            (m.targetUserId === firstId || !m.targetUserId))
      );

      const secondMsg = s.messages.find(
        (m) =>
          (m.senderType === 'USER' && m.senderId === secondId) ||
          (m.senderType === 'MATCHMAKER' &&
            (m.targetUserId === secondId || !m.targetUserId))
      );

      return {
        suggestionId: s.id,
        status: s.status,
        totalUnread: unreadMap.get(s.id) || 0,
        firstParty: {
          id: firstId,
          name: `${s.firstParty.firstName} ${s.firstParty.lastName}`,
          lastMessage: firstMsg?.content,
          lastMessageTime: firstMsg?.createdAt?.toISOString(),
          lastMessageSenderType: firstMsg?.senderType?.toLowerCase(),
          unreadCount: 0,
        },
        secondParty: {
          id: secondId,
          name: `${s.secondParty.firstName} ${s.secondParty.lastName}`,
          lastMessage: secondMsg?.content,
          lastMessageTime: secondMsg?.createdAt?.toISOString(),
          lastMessageSenderType: secondMsg?.senderType?.toLowerCase(),
          unreadCount: 0,
        },
      };
    });

    suggestionSummaries.sort((a, b) => b.totalUnread - a.totalUnread);

    const totalSuggestionUnread = suggestionSummaries.reduce(
      (sum, s) => sum + s.totalUnread,
      0
    );
    const totalDirectUnread = directChatSummaries.reduce(
      (sum, dc) => sum + dc.unreadCount,
      0
    );

    return corsJson(req, {
      success: true,
      suggestions: suggestionSummaries,
      directChats: directChatSummaries,
      totalUnread: totalSuggestionUnread + totalDirectUnread,
    });
  } catch (error) {
    console.error('[mobile/matchmaker/chat/summaries] Error:', error);
    return corsError(req, 'Failed to fetch chat summaries', 500);
  }
}