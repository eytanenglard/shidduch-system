// =============================================================================
// 23. API Route — User Chat List (All Chats Summary)
// File: src/app/api/messages/chats/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface ChatSummary {
  id: string;
  type: 'direct' | 'suggestion';
  title: string;
  subtitle?: string;
  matchmakerName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageIsMine?: boolean;
  unreadCount: number;
  suggestionId?: string;
  status?: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
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
      const matchmakerName = `${user.assignedMatchmaker.firstName} ${user.assignedMatchmaker.lastName}`;

      // Get last direct message
      const lastDirectMsg = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: user.assignedMatchmakerId! },
            { senderId: user.assignedMatchmakerId!, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          content: true,
          createdAt: true,
          senderId: true,
        },
      });

      // Count unread direct messages
      const directUnread = await prisma.directMessage.count({
        where: {
          receiverId: userId,
          senderId: user.assignedMatchmakerId!,
          isRead: false,
        },
      });

      chats.push({
        id: 'direct',
        type: 'direct',
        title: matchmakerName,
        subtitle: 'שיחה כללית',
        matchmakerName,
        lastMessage: lastDirectMsg?.content,
        lastMessageTime: lastDirectMsg?.createdAt.toISOString(),
        lastMessageIsMine: lastDirectMsg?.senderId === userId,
        unreadCount: directUnread,
      });
    }

    // ==========================================
    // 2. Suggestion-based chats
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

    for (const suggestion of suggestions) {
      const isFirstParty = suggestion.firstPartyId === userId;
      const otherParty = isFirstParty
        ? suggestion.secondParty
        : suggestion.firstParty;
      const matchmakerName = `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`;

      // Get last message in this suggestion for this user
      const lastMsg = await prisma.suggestionMessage.findFirst({
        where: {
          suggestionId: suggestion.id,
          OR: [
            { senderId: userId, senderType: 'USER' },
            {
              senderType: 'MATCHMAKER',
              OR: [{ targetUserId: userId }, { targetUserId: null }],
            },
            { senderType: 'SYSTEM' },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          content: true,
          createdAt: true,
          senderId: true,
        },
      });

      // Count unread messages for this user in this suggestion
      const unreadCount = await prisma.suggestionMessage.count({
        where: {
          suggestionId: suggestion.id,
          isRead: false,
          NOT: { senderId: userId },
          OR: [
            { targetUserId: userId },
            { targetUserId: null },
            { senderType: 'SYSTEM' },
          ],
        },
      });

      chats.push({
        id: suggestion.id,
        type: 'suggestion',
        title: `${otherParty.firstName} ${otherParty.lastName}`,
        subtitle: matchmakerName,
        matchmakerName,
        lastMessage: lastMsg?.content,
        lastMessageTime: lastMsg?.createdAt.toISOString(),
        lastMessageIsMine: lastMsg?.senderId === userId,
        unreadCount,
        suggestionId: suggestion.id,
        status: suggestion.status,
      });
    }

    // Sort: direct first, then by last message time (newest first)
    chats.sort((a, b) => {
      if (a.type === 'direct' && b.type !== 'direct') return -1;
      if (a.type !== 'direct' && b.type === 'direct') return 1;
      const timeA = a.lastMessageTime
        ? new Date(a.lastMessageTime).getTime()
        : 0;
      const timeB = b.lastMessageTime
        ? new Date(b.lastMessageTime).getTime()
        : 0;
      return timeB - timeA;
    });

    const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

    return NextResponse.json({
      success: true,
      chats,
      totalUnread,
    });
  } catch (error) {
    console.error('[messages/chats] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}