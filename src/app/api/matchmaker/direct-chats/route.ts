// FILE A: src/app/api/matchmaker/direct-chats/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchmakerId = session.user.id;

    // Verify user is a matchmaker
    const matchmaker = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { role: true },
    });

    if (matchmaker?.role !== 'MATCHMAKER' && matchmaker?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all unique users who have direct messages with this matchmaker
    const sentMessages = await prisma.directMessage.findMany({
      where: { receiverId: matchmakerId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const receivedMessages = await prisma.directMessage.findMany({
      where: { senderId: matchmakerId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    // Also get all assigned users (they should always appear even with 0 messages)
    const assignedUsers = await prisma.user.findMany({
      where: { assignedMatchmakerId: matchmakerId },
      select: { id: true, firstName: true, lastName: true },
    });

    const userIdSet = new Set<string>();
    sentMessages.forEach((m) => userIdSet.add(m.senderId));
    receivedMessages.forEach((m) => userIdSet.add(m.receiverId));
    assignedUsers.forEach((u) => userIdSet.add(u.id));

    const userIds = Array.from(userIdSet);

    // Fetch user details + last message + unread count for each
    const chatSummaries = await Promise.all(
      userIds.map(async (uid) => {
        const user = await prisma.user.findUnique({
          where: { id: uid },
          select: { id: true, firstName: true, lastName: true },
        });

        if (!user) return null;

        const lastMsg = await prisma.directMessage.findFirst({
          where: {
            OR: [
              { senderId: uid, receiverId: matchmakerId },
              { senderId: matchmakerId, receiverId: uid },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            senderId: true,
          },
        });

        const unreadCount = await prisma.directMessage.count({
          where: {
            senderId: uid,
            receiverId: matchmakerId,
            isRead: false,
          },
        });

        return {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.createdAt.toISOString(),
          lastMessageIsMine: lastMsg?.senderId === matchmakerId,
          unreadCount,
        };
      })
    );

    // Filter nulls and sort by unread then last message time
    const validSummaries = chatSummaries
      .filter(Boolean)
      .sort((a, b) => {
        if (a!.unreadCount !== b!.unreadCount)
          return b!.unreadCount - a!.unreadCount;
        const timeA = a!.lastMessageTime
          ? new Date(a!.lastMessageTime).getTime()
          : 0;
        const timeB = b!.lastMessageTime
          ? new Date(b!.lastMessageTime).getTime()
          : 0;
        return timeB - timeA;
      });

    const totalUnread = validSummaries.reduce(
      (sum, s) => sum + (s?.unreadCount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      chats: validSummaries,
      totalUnread,
    });
  } catch (error) {
    console.error('[matchmaker/direct-chats] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
