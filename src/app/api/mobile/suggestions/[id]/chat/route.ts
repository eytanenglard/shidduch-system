// =============================================================================
// 21. API Route — User Suggestion Chat (Web)
// File: src/app/api/suggestions/[id]/chat/route.ts
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyMatchmakerNewMessage } from '@/lib/pushNotifications';

// ==========================================
// GET — Fetch messages
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await params;
    const userId = session.user.id;

    // Verify user is party to this suggestion
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
        matchmaker: {
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
            : session.user.name || 'אני',
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
    });
  } catch (error) {
    console.error('[user/suggestion-chat] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST — Send message
// ==========================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await params;
    const userId = session.user.id;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const userName = session.user.name || 'מועמד/ת';

    const message = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        content: content.trim(),
        senderId: userId,
        senderType: 'USER',
        targetUserId: suggestion.matchmakerId,
      },
    });

    // Push notification to matchmaker (fire and forget)
    if (suggestion.matchmakerId) {
      notifyMatchmakerNewMessage({
        matchmakerUserId: suggestion.matchmakerId,
        senderName: userName,
        messagePreview: content.trim(),
        suggestionId,
      }).catch((err) =>
        console.error('[user/suggestion-chat] Push error:', err)
      );
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: message.senderType,
        senderName: userName,
        isRead: false,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    });
  } catch (error) {
    console.error('[user/suggestion-chat] POST error:', error);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await params;
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
    console.error('[user/suggestion-chat] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}