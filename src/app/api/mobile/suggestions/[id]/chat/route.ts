import { notifyMatchmakerNewMessage } from '@/lib/pushNotifications';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyMobileToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: suggestionId } = await context.params;

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const isParty =
      suggestion.firstPartyId === user.userId ||
      suggestion.secondPartyId === user.userId;

    if (!isParty) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this chat' },
        { status: 403 }
      );
    }

    // ✅ תיקון: סינון הודעות - רואה רק מה שמיועד לו
    const messages = await prisma.suggestionMessage.findMany({
      where: {
        suggestionId,
        OR: [
          // הודעות שהמועמד עצמו שלח
          { senderId: user.userId },
          // הודעות מהשדכן שמיועדות ספציפית למועמד הזה
          {
            senderType: 'MATCHMAKER',
            targetUserId: user.userId,
          },
          // הודעות ישנות מהשדכן בלי targetUserId (תאימות לאחור)
          {
            senderType: 'MATCHMAKER',
            targetUserId: null,
          },
          // הודעות מערכת
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
      },
    });

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        ...m,
        senderType: m.senderType.toLowerCase(),
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[Mobile Chat GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyMobileToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: suggestionId } = await context.params;
    const { content } = await req.json();

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const isParty =
      suggestion.firstPartyId === user.userId ||
      suggestion.secondPartyId === user.userId;

    if (!isParty) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to send messages here' },
        { status: 403 }
      );
    }

    // ✅ הודעה מהמועמד - targetUserId הוא השדכן (אופציונלי, בעיקר לעקביות)
    const message = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        senderId: user.userId,
        senderType: 'USER',
        targetUserId: suggestion.matchmakerId, // ההודעה מיועדת לשדכן
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        senderType: true,
        isRead: true,
        createdAt: true,
      },
    });

    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: { lastActivity: new Date() },
    });

    // Push notification לשדכן
    if (suggestion.matchmakerId) {
      const senderUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { firstName: true, lastName: true },
      });

      notifyMatchmakerNewMessage({
        matchmakerUserId: suggestion.matchmakerId,
        senderName: senderUser
          ? `${senderUser.firstName} ${senderUser.lastName}`.trim()
          : 'מועמד/ת',
        messagePreview: content,
        suggestionId,
      }).catch((err) =>
        console.error('[chat] Matchmaker push error:', err)
      );
    }

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        senderType: message.senderType.toLowerCase(),
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Mobile Chat POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}