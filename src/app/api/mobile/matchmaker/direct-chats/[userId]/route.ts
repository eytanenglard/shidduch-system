// =============================================================================
// src/app/api/mobile/matchmaker/direct-chats/[userId]/route.ts
// =============================================================================
//
// GET   — fetch direct messages with specific user
// POST  — send a direct message to user (+ push notification)
// PATCH — mark messages as read
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
import { pushDirectMessage } from '@/lib/sendPushNotification';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET — fetch messages with specific user
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const matchmakerId = auth.userId;
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

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderId === matchmakerId ? 'matchmaker' : 'user',
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
    }));

    return corsJson(req, {
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
    console.error('[mobile/matchmaker/direct-chats/userId] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// POST — send message to user + push notification
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const matchmakerId = auth.userId;
    const { userId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return corsError(req, 'Message content required', 400);
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: matchmakerId,
        receiverId: userId,
        content: content.trim(),
      },
    });

    // Get matchmaker name for push notification
    const matchmaker = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { firstName: true, lastName: true },
    });
    const matchmakerName = matchmaker
      ? `${matchmaker.firstName} ${matchmaker.lastName}`
      : 'השדכן/ית שלך';

    // Send push notification (non-blocking)
    pushDirectMessage(userId, matchmakerName, content.trim()).catch(
      console.error
    );

    return corsJson(req, {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: 'matchmaker',
        isRead: false,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[mobile/matchmaker/direct-chats/userId] POST error:', error);
    return corsError(req, 'Internal server error', 500);
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
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const matchmakerId = auth.userId;
    const { userId } = await params;

    await prisma.directMessage.updateMany({
      where: {
        senderId: userId,
        receiverId: matchmakerId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return corsJson(req, { success: true });
  } catch (error) {
    console.error(
      '[mobile/matchmaker/direct-chats/userId] PATCH error:',
      error
    );
    return corsError(req, 'Internal server error', 500);
  }
}