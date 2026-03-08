// =============================================================================
// src/app/api/mobile/matchmaker/suggestions/[id]/chat/route.ts
// =============================================================================
//
// Suggestion-level chat for matchmaker on mobile.
// GET   — fetch all messages for a suggestion
// POST  — send a message (optionally targeted to a specific party) + push
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
import { pushSuggestionMessage } from '@/lib/sendPushNotification';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// GET — Fetch messages for a suggestion
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const { id: suggestionId } = await params;
    const matchmakerId = auth.userId;

    const suggestion = await prisma.matchSuggestion.findFirst({
      where: { id: suggestionId, matchmakerId },
      include: {
        firstParty: {
          select: { id: true, firstName: true, lastName: true },
        },
        secondParty: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404);
    }

    // Optional query param: ?party=first|second to filter messages
    const url = new URL(req.url);
    const partyFilter = url.searchParams.get('party'); // 'first' | 'second' | null

    let whereClause: any = { suggestionId };

    if (partyFilter === 'first') {
      whereClause = {
        suggestionId,
        OR: [
          { senderId: suggestion.firstPartyId, senderType: 'USER' },
          {
            senderType: 'MATCHMAKER',
            OR: [
              { targetUserId: suggestion.firstPartyId },
              { targetUserId: null },
            ],
          },
          { senderType: 'SYSTEM' },
        ],
      };
    } else if (partyFilter === 'second') {
      whereClause = {
        suggestionId,
        OR: [
          { senderId: suggestion.secondPartyId, senderType: 'USER' },
          {
            senderType: 'MATCHMAKER',
            OR: [
              { targetUserId: suggestion.secondPartyId },
              { targetUserId: null },
            ],
          },
          { senderType: 'SYSTEM' },
        ],
      };
    }
    // If no partyFilter, matchmaker sees ALL messages

    const messages = await prisma.suggestionMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderId: true,
        senderType: true,
        targetUserId: true,
        isRead: true,
        createdAt: true,
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderType: msg.senderType.toLowerCase(),
      targetUserId: msg.targetUserId,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
      // Identify sender name
      senderName:
        msg.senderId === matchmakerId
          ? 'שדכן/ית'
          : msg.senderId === suggestion.firstPartyId
            ? `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
            : msg.senderId === suggestion.secondPartyId
              ? `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
              : 'מערכת',
    }));

    return corsJson(req, {
      success: true,
      messages: formattedMessages,
      suggestion: {
        id: suggestion.id,
        status: suggestion.status,
        firstParty: {
          id: suggestion.firstPartyId,
          name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
        },
        secondParty: {
          id: suggestion.secondPartyId,
          name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
        },
      },
    });
  } catch (error) {
    console.error('[mobile/matchmaker/suggestions/chat] GET error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// POST — Send a message + push notification
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const { id: suggestionId } = await params;
    const matchmakerId = auth.userId;
    const { content, targetUserId } = await req.json();

    if (!content?.trim()) {
      return corsError(req, 'Message content required', 400);
    }

    const suggestion = await prisma.matchSuggestion.findFirst({
      where: { id: suggestionId, matchmakerId },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
      },
    });

    if (!suggestion) {
      return corsError(req, 'Suggestion not found', 404);
    }

    // Validate targetUserId if provided
    if (
      targetUserId &&
      targetUserId !== suggestion.firstPartyId &&
      targetUserId !== suggestion.secondPartyId
    ) {
      return corsError(req, 'Invalid target user', 400);
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.suggestionMessage.create({
        data: {
          suggestionId,
          content: content.trim(),
          senderId: matchmakerId,
          senderType: 'MATCHMAKER',
          targetUserId: targetUserId || null,
        },
      });

      await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: { lastActivity: new Date() },
      });

      return msg;
    });

    // Get matchmaker name for push
    const matchmaker = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { firstName: true, lastName: true },
    });
    const matchmakerName = matchmaker
      ? `${matchmaker.firstName} ${matchmaker.lastName}`
      : 'השדכן/ית שלך';

    // Send push notification(s) - non-blocking
    if (targetUserId) {
      // Targeted to one party
      pushSuggestionMessage(
        targetUserId,
        matchmakerName,
        content.trim(),
        suggestionId
      ).catch(console.error);
    } else {
      // Broadcast to both parties
      pushSuggestionMessage(
        suggestion.firstPartyId,
        matchmakerName,
        content.trim(),
        suggestionId
      ).catch(console.error);
      pushSuggestionMessage(
        suggestion.secondPartyId,
        matchmakerName,
        content.trim(),
        suggestionId
      ).catch(console.error);
    }

    return corsJson(req, {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: 'matchmaker',
        targetUserId: message.targetUserId,
        isRead: false,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[mobile/matchmaker/suggestions/chat] POST error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}

// ==========================================
// PATCH — Mark messages as read
// ==========================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    const { id: suggestionId } = await params;
    const matchmakerId = auth.userId;

    await prisma.suggestionMessage.updateMany({
      where: {
        suggestionId,
        isRead: false,
        senderType: 'USER',
      },
      data: { isRead: true },
    });

    return corsJson(req, { success: true });
  } catch (error) {
    console.error('[mobile/matchmaker/suggestions/chat] PATCH error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}