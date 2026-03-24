// =============================================================================
// src/app/api/matchmaker/direct-chats/[userId]/route.ts
// =============================================================================
//
// GET  — fetch direct messages with specific user
// POST — send a direct message to user
// PATCH — mark messages as read
// =============================================================================
import { pushDirectMessage } from '@/lib/sendPushNotification';
import { publishNewMessage } from '@/lib/chatPubSub';
import { checkMessageRateLimit } from '@/lib/messageRateLimit';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';

// ==========================================
// GET — fetch messages with specific user
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchmakerId = session.user.id;
    const { userId } = await params;

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: matchmakerId, receiverId: userId },
          { senderId: userId, receiverId: matchmakerId },
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

    // Get user info
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderId === matchmakerId ? 'matchmaker' : 'user',
      senderName:
        msg.senderId === matchmakerId
          ? session.user.name || 'שדכן/ית'
          : `${targetUser?.firstName || ''} ${targetUser?.lastName || ''}`.trim(),
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
      isMine: msg.senderId === matchmakerId,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      user: targetUser
        ? {
            id: userId,
            name: `${targetUser.firstName} ${targetUser.lastName}`,
          }
        : null,
    });
  } catch (error) {
    console.error('[matchmaker/direct-chats/userId] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST — send message to user
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchmakerId = session.user.id;

    const rateCheck = checkMessageRateLimit(matchmakerId, session.user.role);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter || 10) } }
      );
    }

    const { userId } = await params;
    const { content: rawContent } = await req.json();

    if (!rawContent?.trim()) {
      return NextResponse.json(
        { error: 'Message content required' },
        { status: 400 }
      );
    }

    // Sanitize user-provided message content
    const content = sanitizeText(rawContent, 5000);

    const message = await prisma.directMessage.create({
      data: {
        senderId: matchmakerId,
        receiverId: userId,
        content,
      },
    });
  // Send push notification (non-blocking)
  pushDirectMessage(userId, session.user.name || 'השדכן/ית שלך', content)
    .catch(console.error);

  // SSE: Publish real-time event to user
  publishNewMessage(userId, {
    id: message.id,
    content: message.content,
    senderType: 'matchmaker',
    senderId: matchmakerId,
    senderName: session.user.name || '',
    conversationId: matchmakerId,
    conversationType: 'direct',
  }).catch(console.error);
    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: 'matchmaker',
        senderName: session.user.name || 'שדכן/ית',
        isRead: false,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    });
  } catch (error) {
    console.error('[matchmaker/direct-chats/userId] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH — mark messages as read
// ==========================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchmakerId = session.user.id;
    const { userId } = await params;

    await prisma.directMessage.updateMany({
      where: {
        senderId: userId,
        receiverId: matchmakerId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[matchmaker/direct-chats/userId] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}