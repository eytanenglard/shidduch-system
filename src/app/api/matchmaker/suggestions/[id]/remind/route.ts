// src/app/api/matchmaker/suggestions/[id]/remind/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { initNotificationService } from "@/components/matchmaker/suggestions/services/notification/initNotifications";

// Initialize the notification service
const notificationService = initNotificationService();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { partyType } = await req.json();

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
        { success: false, error: "You are not authorized to send reminders for this suggestion" },
        { status: 403 }
      );
    }
    
    // Define parties that will receive the reminder
    const notifyParties: ('first' | 'second')[] = [];
    let sentCount = 0;
    
    if (partyType === "first" || partyType === "both") {
      if (suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY) {
        notifyParties.push('first');
        sentCount++;
      }
    }
    
    if (partyType === "second" || partyType === "both") {
      if (suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) {
        notifyParties.push('second');
        sentCount++;
      }
    }
    
    // Construct reminder content
    const reminderContent = `זוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך. לצפייה בפרטי ההצעה ומענה, אנא לחץ/י על הקישור.`;
    
    // Check if we have applicable recipients
    if (sentCount === 0) {
      return NextResponse.json({
        success: false,
        error: "No applicable recipients for reminder in current status"
      }, { status: 400 });
    }

    // Update the last activity timestamp in the suggestion
    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: {
        lastActivity: new Date(),
      },
    });

    // Log the reminder to history
    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId,
        status: suggestion.status,
        notes: `תזכורת נשלחה ל${partyType === "first" ? "צד ראשון" : partyType === "second" ? "צד שני" : "שני הצדדים"} על ידי ${session.user.firstName} ${session.user.lastName}`,
      },
    });
    
    // רק לאחר העדכון בדאטהבייס - שלח את ההודעה
    await notificationService.handleSuggestionStatusChange(
      suggestion,
      {
        channels: ['email', 'whatsapp'],
        notifyParties,
        customMessage: reminderContent
      }
    );
    
    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
      recipientCount: sentCount
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}