// src/app/api/mobile/suggestions/[id]/chat/route.ts
// =============================================================================
// Mobile Chat API - Fixed Authentication (Token based instead of Session)
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyMatchmakerNewMessage } from '@/lib/pushNotifications';
import { 
  verifyMobileToken, 
  corsJson, 
  corsError, 
  corsOptions 
} from "@/lib/mobile-auth";

// Handle CORS Preflight
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET — Fetch messages
// ==========================================
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;
    
    // 1. Verify Mobile Token instead of Server Session
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const userId = auth.userId;

    // Verify user is party to this suggestion
    const suggestion = await prisma.matchSuggestion.findFirst({
      where: {
        id: suggestionId,
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
      },
      include: {
        matchmaker: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404);
    }

    const isFirstParty = suggestion.firstPartyId === userId;

    // Fetch messages relevant to this user
    const messages = await prisma.suggestionMessage.findMany({
      where: {
        suggestionId,
        OR: [
          { senderId: userId, senderType: 'USER' },
          {
            senderType: 'MATCHMAKER',
            OR: [
              { targetUserId: userId },
              { targetUserId: null },
            ],
          },
          { senderType: 'SYSTEM' },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderId: true,
        senderType: true,
        isRead: true,
        createdAt: true,
        targetUserId: true,
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderType,
      senderName:
        msg.senderType === 'MATCHMAKER'
          ? `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          : msg.senderType === 'SYSTEM'
            ? 'מערכת'
            : 'אני', // באפליקציה, הודעות שלי הן תמיד "אני"
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
      isMine: msg.senderId === userId,
    }));

    return corsJson(req, {
      success: true,
      messages: formattedMessages,
      matchmaker: {
        id: suggestion.matchmaker.id,
        name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`,
      },
      isFirstParty,
    });
  } catch (error) {
    console.error('[mobile/suggestion-chat] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// POST — Send message
// ==========================================
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    // 1. Verify Mobile Token
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const userId = auth.userId;
    const { content } = await req.json();

    if (!content?.trim()) {
      return corsError(req, 'Message content is required', 400);
    }

    const suggestion = await prisma.matchSuggestion.findFirst({
      where: {
        id: suggestionId,
        OR: [{ firstPartyId: userId }, { secondPartyId: userId }],
      },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404);
    }

    // Get user details for notification (optional but good for push)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });

    const userName = user ? `${user.firstName} ${user.lastName}` : 'מועמד/ת';

    const message = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        content: content.trim(),
        senderId: userId,
        senderType: 'USER',
        targetUserId: suggestion.matchmakerId,
      },
    });

    // Push notification to matchmaker
    if (suggestion.matchmakerId) {
      notifyMatchmakerNewMessage({
        matchmakerUserId: suggestion.matchmakerId,
        senderName: userName,
        messagePreview: content.trim(),
        suggestionId,
      }).catch((err) =>
        console.error('[mobile/suggestion-chat] Push error:', err)
      );
    }

    return corsJson(req, {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: message.senderType,
        senderName: 'אני',
        isRead: false,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    });
  } catch (error) {
    console.error('[mobile/suggestion-chat] POST error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// PATCH — Mark messages as read
// ==========================================
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    // 1. Verify Mobile Token
    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, 'Unauthorized', 401);
    }

    const userId = auth.userId;

    await prisma.suggestionMessage.updateMany({
      where: {
        suggestionId,
        isRead: false,
        NOT: { senderId: userId },
        OR: [
          { targetUserId: userId },
          { targetUserId: null },
          { senderType: 'SYSTEM' },
        ],
      },
      data: { isRead: true },
    });

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[mobile/suggestion-chat] PATCH error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}