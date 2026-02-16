import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { notifyChatMessage } from '@/lib/pushNotifications';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: suggestionId } = await context.params;

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        matchmakerId: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { firstName: true, lastName: true } },
        secondParty: { select: { firstName: true, lastName: true } },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Not your suggestion' },
        { status: 403 }
      );
    }

    const messages = await prisma.suggestionMessage.findMany({
      where: { suggestionId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const unreadCount = await prisma.suggestionMessage.count({
      where: {
        suggestionId,
        senderType: 'USER',
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderType: m.senderType.toLowerCase(),
        senderName: `${m.sender.firstName} ${m.sender.lastName}`,
        targetUserId: m.targetUserId, // ✅ חדש
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        isFirstParty: m.senderId === suggestion.firstPartyId,
        isSecondParty: m.senderId === suggestion.secondPartyId,
      })),
      unreadCount,
      parties: {
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
    console.error('[Matchmaker Chat GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: suggestionId } = await context.params;
    const { content, targetUserId } = await req.json(); // ✅ חדש: targetUserId

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // ✅ חדש: חובה לציין למי ההודעה
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      );
    }

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        matchmakerId: true,
        firstPartyId: true,
        secondPartyId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Not your suggestion' },
        { status: 403 }
      );
    }

    // ✅ חדש: וידוא שה-targetUserId הוא אחד הצדדים
    if (
      targetUserId !== suggestion.firstPartyId &&
      targetUserId !== suggestion.secondPartyId
    ) {
      return NextResponse.json(
        { error: 'targetUserId must be one of the suggestion parties' },
        { status: 400 }
      );
    }

    const message = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        senderId: session.user.id,
        senderType: 'MATCHMAKER',
        targetUserId, // ✅ חדש
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: { lastActivity: new Date() },
    });

    // ✅ תיקון: Push notification רק לצד הנכון
    const matchmakerName = `${message.sender.firstName} ${message.sender.lastName}`.trim();

    notifyChatMessage({
      recipientUserIds: [targetUserId], // ✅ רק הנמען!
      senderName: matchmakerName || 'השדכן/ית',
      messagePreview: content,
      suggestionId,
    }).catch((err) => console.error('[chat] Push notification error:', err));

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: message.senderType.toLowerCase(),
        senderName: matchmakerName,
        targetUserId: message.targetUserId, // ✅ חדש
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Matchmaker Chat POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: suggestionId } = await context.params;

    const result = await prisma.suggestionMessage.updateMany({
      where: {
        suggestionId,
        senderType: 'USER',
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error) {
    console.error('[Matchmaker Chat PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}