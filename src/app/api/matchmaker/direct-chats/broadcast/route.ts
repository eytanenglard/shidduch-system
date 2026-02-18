// =============================================================================
// src/app/api/matchmaker/direct-chats/broadcast/route.ts
// =============================================================================
//
// POST — Send a direct message to multiple users at once
// Body: { content: string, userIds: string[] | 'all' }
//
// If userIds === 'all', sends to all registered candidates with profiles
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchmakerId = session.user.id;

    // Verify matchmaker/admin role
    const currentUser = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { role: true },
    });

    if (!currentUser || !['MATCHMAKER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content, userIds } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Determine target user IDs
    let targetUserIds: string[] = [];

    if (userIds === 'all') {
      // Fetch all registered candidates with profiles
      const allUsers = await prisma.user.findMany({
        where: {
          role: 'CANDIDATE',
          source: 'REGISTRATION',
          profile: { isNot: null },
        },
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return NextResponse.json(
        { error: 'userIds must be an array or "all"' },
        { status: 400 }
      );
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No eligible users found' },
        { status: 400 }
      );
    }

    // Create messages in batch using createMany
    const messageData = targetUserIds.map((userId) => ({
      senderId: matchmakerId,
      receiverId: userId,
      content: content.trim(),
    }));

    const result = await prisma.directMessage.createMany({
      data: messageData,
    });

    // Also ensure all these users have assignedMatchmakerId set
    // (auto-assign if they don't have one)
    await prisma.user.updateMany({
      where: {
        id: { in: targetUserIds },
        assignedMatchmakerId: null,
      },
      data: { assignedMatchmakerId: matchmakerId },
    });

    return NextResponse.json({
      success: true,
      sentCount: result.count,
      totalTargeted: targetUserIds.length,
    });
  } catch (error) {
    console.error('[matchmaker/direct-chats/broadcast] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}