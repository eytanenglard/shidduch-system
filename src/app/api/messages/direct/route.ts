// =============================================================================
// 22. API Route — Direct Messages (General Chat)
// File: src/app/api/messages/direct/route.ts
// =============================================================================
//
// General chat between user and their assigned matchmaker.
// Not tied to any specific suggestion.
//
// GET  — fetch direct messages with assigned matchmaker
// POST — send a direct message to assigned matchmaker
// PATCH — mark direct messages as read
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyMatchmakerNewMessage } from '@/lib/pushNotifications';

// ==========================================
// GET — Fetch direct messages
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's assigned matchmaker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        assignedMatchmakerId: true,
        assignedMatchmaker: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user?.assignedMatchmakerId || !user.assignedMatchmaker) {
      return NextResponse.json({
        success: true,
        messages: [],
        matchmaker: null,
        noMatchmaker: true,
      });
    }

    const matchmakerId = user.assignedMatchmakerId;

    // Fetch all direct messages between user and matchmaker
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: matchmakerId },
          { senderId: matchmakerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderId: true,
        isRead: true,
        createdAt: true,
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderId === userId ? 'user' : 'matchmaker',
      senderName:
        msg.senderId === userId
          ? session.user.name || 'אני'
          : `${user.assignedMatchmaker!.firstName} ${user.assignedMatchmaker!.lastName}`,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
      isMine: msg.senderId === userId,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      matchmaker: {
        id: user.assignedMatchmaker.id,
        name: `${user.assignedMatchmaker.firstName} ${user.assignedMatchmaker.lastName}`,
      },
    });
  } catch (error) {
    console.error('[messages/direct] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST — Send direct message
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Get assigned matchmaker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedMatchmakerId: true },
    });

    if (!user?.assignedMatchmakerId) {
      return NextResponse.json(
        { error: 'No assigned matchmaker found' },
        { status: 400 }
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: userId,
        receiverId: user.assignedMatchmakerId,
        content: content.trim(),
      },
    });

    // Push notification to matchmaker
    notifyMatchmakerNewMessage({
      matchmakerUserId: user.assignedMatchmakerId,
      senderName: session.user.name || 'מועמד/ת',
      messagePreview: content.trim(),
      suggestionId: 'direct', // special marker for direct messages
    }).catch((err) => console.error('[messages/direct] Push error:', err));

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: 'user',
        senderName: session.user.name || 'אני',
        isRead: false,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    });
  } catch (error) {
    console.error('[messages/direct] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH — Mark messages as read
// ==========================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Mark all messages FROM matchmaker TO this user as read
    await prisma.directMessage.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[messages/direct] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
