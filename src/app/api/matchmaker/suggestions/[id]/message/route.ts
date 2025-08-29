// src/app/api/matchmaker/suggestions/[id]/message/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";
import { initNotificationService } from "@/components/matchmaker/suggestions/services/notification/initNotifications";

// Initialize the notification service
const notificationService = initNotificationService();


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Apply rate limiting: 30 messages/reminders per matchmaker per hour (costly notifications)
  const rateLimitResponse = await applyRateLimit(req, { requests: 30, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const session = await getServerSession(authOptions);
    
    // Verify user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify matchmaker permissions
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = params.id;
    const { partyType, messageType, content } = await req.json();

    // Verify suggestion exists
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify matchmaker permissions for this suggestion
    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to send messages for this suggestion" },
        { status: 403 }
      );
    }

    // Define which parties will receive the message
    const notifyParties: ('first' | 'second')[] = [];
    
    if (partyType === "first" || partyType === "both") {
      notifyParties.push('first');
    }
    
    if (partyType === "second" || partyType === "both") {
      notifyParties.push('second');
    }

     console.log(`Message request received for suggestion ${suggestionId}, will be handled through transactions`);

    // Log the message in the system
    await prisma.$transaction(async (tx) => {
      try {
        // Update the lastActivity field in the suggestion
        await tx.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            lastActivity: new Date(),
          },
        });
        
        // Add a record to the status history
        await tx.suggestionStatusHistory.create({
          data: {
            suggestionId,
            status: suggestion.status as MatchSuggestionStatus,
            notes: `הודעה נשלחה מאת השדכן: ${messageType} - ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          },
        });
    
        // שליחת ההודעה רק אחרי העדכון בדאטהבייס
        await notificationService.handleSuggestionStatusChange(
          suggestion, 
          {
            channels: ['email', 'whatsapp'],
            notifyParties,
            customMessage: content
          }
        );
      } catch (txError) {
        console.error("Transaction error:", txError);
        throw txError;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Messages sent successfully",
      recipients: notifyParties
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}