// app/api/matchmaker/suggestions/[id]/chat/route.ts
// ==========================================
// NeshamaTech - Matchmaker Chat API (Web Dashboard)
// GET: Fetch all messages for a suggestion (matchmaker sees all)
// POST: Send a message from matchmaker to a party
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: suggestionId } = await context.params;

    // Verify suggestion exists and belongs to this matchmaker
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
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Not your suggestion" },
        { status: 403 }
      );
    }

    // Matchmaker sees ALL messages for this suggestion
    const messages = await prisma.suggestionMessage.findMany({
      where: { suggestionId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    // Count unread (messages from users that matchmaker hasn't read)
    const unreadCount = await prisma.suggestionMessage.count({
      where: {
        suggestionId,
        senderType: "USER",
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
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        // Help matchmaker identify which party sent this
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
    console.error("[Matchmaker Chat GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: suggestionId } = await context.params;
    const { content } = await req.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      select: { id: true, matchmakerId: true },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Not your suggestion" },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.suggestionMessage.create({
      data: {
        suggestionId,
        senderId: session.user.id,
        senderType: "MATCHMAKER",
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Update suggestion lastActivity
    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: { lastActivity: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderType: message.senderType.toLowerCase(),
        senderName: `${message.sender.firstName} ${message.sender.lastName}`,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Matchmaker Chat POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read (matchmaker reads user messages)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: suggestionId } = await context.params;

    // Mark user messages as read
    const result = await prisma.suggestionMessage.updateMany({
      where: {
        suggestionId,
        senderType: "USER",
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error) {
    console.error("[Matchmaker Chat PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}