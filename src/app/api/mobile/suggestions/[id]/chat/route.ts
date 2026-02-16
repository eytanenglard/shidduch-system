// app/api/mobile/suggestions/[id]/chat/route.ts
// ==========================================
// NeshamaTech - Mobile Chat API
// GET: Fetch messages for a suggestion
// POST: Send a new message from user to matchmaker
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMobileToken } from "@/lib/mobile-auth"; // adjust to your auth utility

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const user = await verifyMobileToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const suggestionId = params.id;

    // 2. Verify user is part of this suggestion
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
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const isParty =
      suggestion.firstPartyId === user.id ||
      suggestion.secondPartyId === user.id;

    if (!isParty) {
      return NextResponse.json(
        { success: false, error: "Not authorized to view this chat" },
        { status: 403 }
      );
    }

    // 3. Fetch messages - user sees only their messages + matchmaker messages
    // (not messages between matchmaker and the OTHER party)
    const messages = await prisma.suggestionMessage.findMany({
      where: {
        suggestionId,
        OR: [
          { senderId: user.id }, // Messages sent by this user
          {
            senderType: "MATCHMAKER", // Messages from matchmaker
            // Note: matchmaker messages to both parties are visible
            // If you want to separate, add a targetUserId field
          },
          { senderType: "SYSTEM" }, // System messages
        ],
      },
      orderBy: { createdAt: "asc" },
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
        senderType: m.senderType.toLowerCase(), // 'user' | 'matchmaker' | 'system'
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Mobile Chat GET] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const user = await verifyMobileToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const suggestionId = params.id;
    const { content } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    // 2. Verify user is part of this suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        id: true,
        firstPartyId: true,
        secondPartyId: true,
        matchmakerId: true,
        matchmaker: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const isParty =
      suggestion.firstPartyId === user.id ||
      suggestion.secondPartyId === user.id;

    if (!isParty) {
      return NextResponse.json(
        { success: false, error: "Not authorized to send messages here" },
        { status: 403 }
      );
    }

    // 3. Create the message
    const message = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        senderId: user.id,
        senderType: "USER",
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

    // 4. Update suggestion lastActivity
    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: { lastActivity: new Date() },
    });

    // 5. (Optional) Send push notification to matchmaker
    // TODO: Implement push notification to matchmaker
    // You can use your existing notification system here:
    // await sendPushToMatchmaker(suggestion.matchmakerId, {
    //   title: `הודעה חדשה מ${user.firstName}`,
    //   body: content.trim().substring(0, 100),
    //   data: { type: 'CHAT_MESSAGE', suggestionId },
    // });

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        senderType: message.senderType.toLowerCase(),
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Mobile Chat POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
