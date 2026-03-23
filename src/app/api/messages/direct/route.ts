// =============================================================================
// File 22: User Direct Messages API
// Path: src/app/api/messages/direct/route.ts
// =============================================================================
//
// GET   — Fetch direct messages with assigned matchmaker
// POST  — Send a direct message to assigned matchmaker
// PATCH — Mark direct messages as read
// =============================================================================
import { pushUserMessageToMatchmaker } from '@/lib/sendPushNotification';
import { publishNewMessage } from '@/lib/chatPubSub';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';
import { z } from 'zod';

const directMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message must be 5000 characters or less'),
});

// ==========================================
// GET — Fetch messages with assigned matchmaker
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get assigned matchmaker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        assignedMatchmakerId: true,
        assignedMatchmaker: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!user?.assignedMatchmaker) {
      return NextResponse.json({
        success: true,
        messages: [],
        matchmaker: null,
      });
    }

    const matchmakerId = user.assignedMatchmakerId!;
    const matchmakerName = `${user.assignedMatchmaker.firstName} ${user.assignedMatchmaker.lastName}`;

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
      senderName: msg.senderId === userId
        ? session.user.name || 'אני'
        : matchmakerName,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
      isMine: msg.senderId === userId,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      matchmaker: {
        id: matchmakerId,
        name: matchmakerName,
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
// POST — Send message to assigned matchmaker
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const validation = directMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content: rawContent } = validation.data;

    // Sanitize user-provided message content
    const content = sanitizeText(rawContent, 5000);

    // Get assigned matchmaker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedMatchmakerId: true },
    });

    if (!user?.assignedMatchmakerId) {
      return NextResponse.json(
        { error: 'No assigned matchmaker' },
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
   // User sent direct message → push to matchmaker
   pushUserMessageToMatchmaker(
     user.assignedMatchmakerId!,
     session.user.name || 'יוזר',
     content.trim(),
     { isDirect: true }
   ).catch(console.error);

   // SSE: Publish real-time event to matchmaker
   publishNewMessage(user.assignedMatchmakerId!, {
     id: message.id,
     content: message.content,
     senderType: 'user',
     senderId: userId,
     senderName: session.user.name || '',
     conversationId: userId,
     conversationType: 'direct',
   }).catch(console.error);
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

    // Mark all messages FROM matchmaker TO user as read
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedMatchmakerId: true },
    });

    if (!user?.assignedMatchmakerId) {
      return NextResponse.json({ success: true });
    }

    await prisma.directMessage.updateMany({
      where: {
        senderId: user.assignedMatchmakerId,
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