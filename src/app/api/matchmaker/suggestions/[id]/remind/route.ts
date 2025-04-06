import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { initNotificationService } from "@/app/components/matchmaker/suggestions/services/notification/initNotifications";
import { NotificationContent } from "@/app/components/matchmaker/suggestions/services/notification/NotificationService";

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
    
    // Create reminder content based on suggestion status
    const subject = "תזכורת: הצעת שידוך ממתינה לתשובתך";
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const reviewUrl = `${baseUrl}/suggestions/${suggestionId}/review`;
    
    // Create list of messages to send
    let sentCount = 0;
    
    // Create appropriate content for the reminder based on suggestion status
    if (partyType === "first" || partyType === "both") {
      if (suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY) {
        const notificationContent: NotificationContent = {
          subject,
          body: `שלום ${suggestion.firstParty.firstName},\n\nזוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך.\n\nלצפייה בפרטי ההצעה: ${reviewUrl}\n\nבברכה,\nמערכת השידוכים`,
          htmlBody: `
            <div dir="rtl">
              <h2>שלום ${suggestion.firstParty.firstName},</h2>
              <p>זוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך.</p>
              <p>לצפייה בפרטי ההצעה ומענה: <a href="${reviewUrl}">לחץ כאן</a></p>
              <p>בברכה,<br>מערכת השידוכים</p>
            </div>
          `
        };
        
        // Send notification via multiple channels
        await notificationService.sendNotification(
          {
            email: suggestion.firstParty.email,
            phone: suggestion.firstParty.phone || undefined,
            name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
          },
          notificationContent,
          { channels: ['email', 'whatsapp'] }
        );
        
        sentCount++;
      }
    }
    
    if (partyType === "second" || partyType === "both") {
      if (suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) {
        const notificationContent: NotificationContent = {
          subject,
          body: `שלום ${suggestion.secondParty.firstName},\n\nזוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך.\n\nלצפייה בפרטי ההצעה: ${reviewUrl}\n\nבברכה,\nמערכת השידוכים`,
          htmlBody: `
            <div dir="rtl">
              <h2>שלום ${suggestion.secondParty.firstName},</h2>
              <p>זוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך.</p>
              <p>לצפייה בפרטי ההצעה ומענה: <a href="${reviewUrl}">לחץ כאן</a></p>
              <p>בברכה,<br>מערכת השידוכים</p>
            </div>
          `
        };
        
        // Send notification via multiple channels
        await notificationService.sendNotification(
          {
            email: suggestion.secondParty.email,
            phone: suggestion.secondParty.phone || undefined,
            name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
          },
          notificationContent,
          { channels: ['email', 'whatsapp'] }
        );
        
        sentCount++;
      }
    }
    
    // Check if at least one message was sent
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
        status: suggestion.status, // Don't change status, just log the reminder
        notes: `תזכורת נשלחה ל${partyType === "first" ? "צד ראשון" : partyType === "second" ? "צד שני" : "שני הצדדים"} על ידי ${session.user.firstName} ${session.user.lastName}`,
      },
    });

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