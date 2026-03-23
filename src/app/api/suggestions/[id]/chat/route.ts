// src/app/api/suggestions/[id]/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';
import { pushSuggestionMessage, pushUserMessageToMatchmaker } from '@/lib/sendPushNotification';
import { publishNewMessage } from '@/lib/chatPubSub';

// ==========================================
// GET — Fetch messages for a suggestion chat
// ==========================================
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user is party to this suggestion
    const suggestion = await prisma.matchSuggestion.findFirst({
      where: {
        id: suggestionId,
        OR: [
          { firstPartyId: userId },
          { secondPartyId: userId },
          { matchmakerId: userId },
        ],
      },
      include: {
        matchmaker: {
          select: { id: true, firstName: true, lastName: true },
        },
        firstParty: {
          select: { id: true, firstName: true, lastName: true },
        },
        secondParty: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const isMatchmaker = suggestion.matchmakerId === userId;
    const isFirstParty = suggestion.firstPartyId === userId;

    // Fetch messages relevant to this user
    const whereClause = isMatchmaker
      ? { suggestionId } // Matchmaker sees all messages
      : {
          suggestionId,
          OR: [
            { senderId: userId, senderType: 'USER' as const },
            {
              senderType: 'MATCHMAKER' as const,
              OR: [{ targetUserId: userId }, { targetUserId: null }],
            },
            { senderType: 'SYSTEM' as const },
          ],
        };

    const messages = await prisma.suggestionMessage.findMany({
      where: whereClause,
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
      senderType: msg.senderType.toLowerCase(),
      senderName:
        msg.senderType === 'MATCHMAKER'
          ? `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
          : msg.senderType === 'SYSTEM'
            ? 'System'
            : msg.senderId === userId
              ? ''
              : msg.senderId === suggestion.firstParty.id
                ? `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
                : `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
      isRead: msg.isRead,
      createdAt: msg.createdAt.toISOString(),
      isMine: msg.senderId === userId,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      matchmaker: {
        id: suggestion.matchmaker.id,
        name: `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`,
      },
      isFirstParty,
      isMatchmaker,
    });
  } catch (error) {
    console.error('[suggestions/chat] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST — Send a message
// ==========================================
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { content: rawContent } = await req.json();

    if (!rawContent?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Sanitize user-provided message content
    const content = sanitizeText(rawContent, 5000);

    const suggestion = await prisma.matchSuggestion.findFirst({
      where: {
        id: suggestionId,
        OR: [
          { firstPartyId: userId },
          { secondPartyId: userId },
          { matchmakerId: userId },
        ],
      },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const isMatchmaker = suggestion.matchmakerId === userId;
    const senderType = isMatchmaker ? 'MATCHMAKER' : 'USER';

    // If matchmaker sends, targetUserId can be specified; otherwise it goes to matchmaker
    const targetUserId = isMatchmaker
      ? null // Matchmaker messages visible to both parties (or specify per-party)
      : suggestion.matchmakerId;

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.suggestionMessage.create({
        data: {
          suggestionId,
          content: content.trim(),
          senderId: userId,
          senderType,
          targetUserId,
        },
      });

      await tx.matchSuggestion.update({
        where: { id: suggestionId },
        data: { lastActivity: new Date() },
      });

      return msg;
    });

      if (isMatchmaker) {
     // Matchmaker sent message → push to target user(s)
     if (targetUserId) {
       pushSuggestionMessage(
         targetUserId,
         session.user.name || 'השדכן/ית',
         content.trim(),
         suggestionId
       ).catch(console.error);
     } else {
       // Broadcast - push to both parties
       pushSuggestionMessage(
         suggestion.firstPartyId,
         session.user.name || 'השדכן/ית',
         content.trim(),
         suggestionId
       ).catch(console.error);
       pushSuggestionMessage(
         suggestion.secondPartyId,
         session.user.name || 'השדכן/ית',
         content.trim(),
         suggestionId
      ).catch(console.error);
     }
   } else {
    // User sent message → push to matchmaker
    pushUserMessageToMatchmaker(
      suggestion.matchmakerId,
      session.user.name || 'יוזר',
      content.trim(),
      { suggestionId }
     ).catch(console.error);
   }

    // SSE: Publish real-time events
    const ssePayload = {
      id: message.id,
      content: message.content,
      senderType: message.senderType.toLowerCase(),
      senderId: userId,
      senderName: session.user.name || '',
      conversationId: suggestionId,
      conversationType: 'suggestion' as const,
    };

    if (isMatchmaker) {
      if (targetUserId) {
        publishNewMessage(targetUserId, ssePayload).catch(console.error);
      } else {
        publishNewMessage(suggestion.firstPartyId, ssePayload).catch(console.error);
        publishNewMessage(suggestion.secondPartyId, ssePayload).catch(console.error);
      }
    } else {
      publishNewMessage(suggestion.matchmakerId, ssePayload).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: message.senderType.toLowerCase(),
        senderName: '',
        isRead: false,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    });
  } catch (error) {
    console.error('[suggestions/chat] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[suggestions/chat] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}