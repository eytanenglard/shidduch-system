// =============================================================================
// src/app/api/matchmaker/chat/summaries/route.ts
// =============================================================================
//
// 🆕 ENDPOINT חדש - מחליף 3 endpoints + N קריאות לולאה
//
// מה שהיה:
//   1. GET /api/matchmaker/suggestions        (טוען פרופילים מלאים, תמונות, הכל!)
//   2. GET /api/matchmaker/chat/unread         (unread counts)
//   3. GET /api/matchmaker/direct-chats        (N+1 בפני עצמו!)
//   4. GET /api/matchmaker/suggestions/:id/chat × N  (לולאת lastMessage)
//   = ~53+ queries לדף אחד
//
// מה שיש עכשיו:
//   1. GET /api/matchmaker/chat/summaries      (הכל בקריאה אחת)
//   = 4-5 queries בלבד
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

    // =========================================================================
    // Query 1: הצעות פעילות עם שמות + הודעות אחרונות (JOIN אחד!)
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
        // 🔥 טוען את 20 ההודעות האחרונות - מספיק למצוא lastMessage לכל צד
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
    // Query 2: Unread counts לכל הצעה (groupBy יעיל)
    // =========================================================================
    const unreadCounts = await prisma.suggestionMessage.groupBy({
      by: ['suggestionId'],
      where: {
        senderType: 'USER',
        isRead: false,
        suggestion: {
          matchmakerId,
        },
      },
      _count: { id: true },
    });

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.suggestionId, u._count.id])
    );

    // =========================================================================
    // Query 3+4: Direct chats - הודעה אחרונה + unread count
    // (במקום N+1 שהיה ב-direct-chats/route.ts)
    // =========================================================================

    // מצא את כל המשתמשים שיש איתם הודעות ישירות
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

    // טען users + lastMessage + unreadCount בקריאות מינימליות
    let directChatSummaries: Array<{
      userId: string;
      name: string;
      lastMessage?: string;
      lastMessageTime?: string;
      lastMessageIsMine?: boolean;
      unreadCount: number;
    }> = [];

    if (directUserIds.length > 0) {
      // Query: כל היוזרים
      const users = await prisma.user.findMany({
        where: { id: { in: directUserIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      // Query: unread count per user (groupBy!)
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

      // Query: הודעה אחרונה per user — שאילתה אחת לכל המשתמשים
      const allDirectMessages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: matchmakerId, receiverId: { in: directUserIds } },
            { senderId: { in: directUserIds }, receiverId: matchmakerId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, senderId: true, receiverId: true },
      });

      // Group by user — לוקח את ההודעה הראשונה (האחרונה) לכל משתמש
      const lastMsgMap = new Map<string, { content: string; createdAt: Date; senderId: string }>();
      for (const msg of allDirectMessages) {
        const uid = msg.senderId === matchmakerId ? msg.receiverId : msg.senderId;
        if (!lastMsgMap.has(uid)) {
          lastMsgMap.set(uid, msg);
        }
      }

      directChatSummaries = directUserIds
        .filter((uid) => lastMsgMap.has(uid))
        .map((uid) => {
          const user = userMap.get(uid);
          const lm = lastMsgMap.get(uid)!;
          return {
            userId: uid,
            name: user
              ? `${user.firstName} ${user.lastName}`
              : 'Unknown',
            lastMessage: lm.content,
            lastMessageTime: lm.createdAt.toISOString(),
            lastMessageIsMine: lm.senderId === matchmakerId,
            unreadCount: directUnreadMap.get(uid) || 0,
          };
        })
        .sort((a, b) => {
          // unread קודם, אחרי זה לפי זמן
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
    // בנה את ה-response הסופי
    // =========================================================================
    const suggestionSummaries = suggestions.map((s) => {
      const firstId = s.firstPartyId;
      const secondId = s.secondPartyId;

      // מצא הודעה אחרונה לצד א' (הודעה שנשלחה ממנו או אליו)
      const firstMsg = s.messages.find(
        (m) =>
          (m.senderType === 'USER' && m.senderId === firstId) ||
          (m.senderType === 'MATCHMAKER' &&
            (m.targetUserId === firstId || !m.targetUserId))
      );

      // מצא הודעה אחרונה לצד ב'
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
          unreadCount: 0, // TODO: per-party unread אם צריך
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

    // מיון: unread קודם
    suggestionSummaries.sort((a, b) => b.totalUnread - a.totalUnread);

    const totalSuggestionUnread = suggestionSummaries.reduce(
      (sum, s) => sum + s.totalUnread,
      0
    );
    const totalDirectUnread = directChatSummaries.reduce(
      (sum, dc) => sum + dc.unreadCount,
      0
    );

    return NextResponse.json({
      success: true,
      suggestions: suggestionSummaries,
      directChats: directChatSummaries,
      totalUnread: totalSuggestionUnread + totalDirectUnread,
    });
  } catch (error) {
    console.error('[matchmaker/chat/summaries] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat summaries' },
      { status: 500 }
    );
  }
}