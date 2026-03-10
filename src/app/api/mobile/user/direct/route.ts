// =============================================================================
// src/app/api/mobile/user/direct/route.ts
// =============================================================================
//
// GET   — Fetch direct messages with assigned matchmaker
// POST  — Send a direct message to assigned matchmaker (+ push)
// PATCH — Mark messages as read
//
// Mobile mirror of /api/messages/direct with JWT auth.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { pushUserMessageToMatchmaker } from '@/lib/sendPushNotification';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET — Fetch messages with assigned matchmaker
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const userId = auth.userId;

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
      return corsJson(req, {
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
        isBroadcast: true,
        createdAt: true,
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderId === userId ? 'user' : 'matchmaker',
      isRead: msg.isRead,
      isBroadcast: msg.isBroadcast || false,
      createdAt: msg.createdAt.toISOString(),
    }));

    return corsJson(req, {
      success: true,
      messages: formattedMessages,
      matchmaker: {
        id: matchmakerId,
        name: matchmakerName,
      },
    });
  } catch (error) {
    console.error('[mobile/user/direct] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// POST — Send message to assigned matchmaker
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const userId = auth.userId;
    const { content } = await req.json();

    if (!content?.trim()) {
      return corsError(req, 'Message content required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        assignedMatchmakerId: true,
      },
    });

    if (!user?.assignedMatchmakerId) {
      return corsError(req, 'No assigned matchmaker', 400);
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: userId,
        receiverId: user.assignedMatchmakerId,
        content: content.trim(),
      },
    });

    // Push to matchmaker (non-blocking)
    const userName = `${user.firstName} ${user.lastName}`;
    pushUserMessageToMatchmaker(
      user.assignedMatchmakerId,
      userName,
      content.trim(),
      { isDirect: true }
    ).catch(console.error);

    return corsJson(req, {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: 'user',
        isRead: false,
        isBroadcast: false,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[mobile/user/direct] POST error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// PATCH — Mark matchmaker messages as read
// ==========================================
export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const userId = auth.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { assignedMatchmakerId: true },
    });

    if (!user?.assignedMatchmakerId) {
      return corsJson(req, { success: true });
    }

    await prisma.directMessage.updateMany({
      where: {
        senderId: user.assignedMatchmakerId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[mobile/user/direct] PATCH error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}