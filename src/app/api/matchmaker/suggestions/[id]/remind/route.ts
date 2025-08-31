// src/app/api/matchmaker/suggestions/[id]/remind/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { initNotificationService } from "@/components/matchmaker/suggestions/services/notification/initNotifications";
import { EmailDictionary } from "@/types/dictionary";
import { getDictionary } from "@/lib/dictionaries";

// הפעלת שירות ההתראות
const notificationService = initNotificationService();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const suggestionId = params.id;
    const { partyType } = await req.json();

    const url = new URL(req.url);
    const locale: 'he' | 'en' = (url.searchParams.get('locale') === 'en') ? 'en' : 'he';
    
    console.log(`[API /remind] Received request with locale: '${locale}'`);

    const dictionary = await getDictionary(locale);
    const emailDict: EmailDictionary = dictionary.email;

    if (!emailDict || !emailDict.notifications?.customMessage?.reminderText) {
        throw new Error(`Email dictionary for locale '${locale}' is missing required notification templates.`);
    }

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true
      },
    });

    if (!suggestion) {
      return NextResponse.json({ success: false, error: "Suggestion not found" }, { status: 404 });
    }

    if (suggestion.matchmakerId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "You are not authorized to send reminders for this suggestion" }, { status: 403 });
    }
    
    const notifyParties: ('first' | 'second')[] = [];
    if ((partyType === "first" || partyType === "both") && suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY) {
      notifyParties.push('first');
    }
    if ((partyType === "second" || partyType === "both") && suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) {
      notifyParties.push('second');
    }
    
    if (notifyParties.length === 0) {
      return NextResponse.json({ success: false, error: "No applicable recipients for reminder in current status" }, { status: 400 });
    }

    // ============================ התיקון המרכזי כאן ============================
    // 1. קבל את תבנית הטקסט ישירות מ-reminderText.
    const reminderTemplateText = emailDict.notifications.customMessage.reminderText;
    
    // 2. בצע את ההחלפה הנדרשת של שם השדכן.
    const reminderContent = reminderTemplateText
        .replace('{{matchmakerName}}', `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`);
    // =========================================================================

    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: { lastActivity: new Date() },
    });

    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId,
        status: suggestion.status,
        notes: `תזכורת נשלחה ל${partyType === "first" ? "צד ראשון" : partyType === "second" ? "צד שני" : "שני הצדדים"} על ידי ${session.user.firstName} ${session.user.lastName}`,
      },
    });
    
    await notificationService.handleSuggestionStatusChange(
      suggestion,
      emailDict,
      {
        channels: ['email', 'whatsapp'],
        notifyParties,
        customMessage: reminderContent
      }
    );
    
    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
      recipientCount: notifyParties.length
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}