// src/app/api/matchmaker/suggestions/[id]/remind/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { notificationService } from "@/components/matchmaker/suggestions/services/notification/NotificationService";
import { getDictionary } from "@/lib/dictionaries";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const params = await props.params;
    const suggestionId = params.id;
    const { partyType } = await req.json();

    // ========================= טעינת המילונים =========================
    const [dictHe, dictEn] = await Promise.all([
      getDictionary('he'),
      getDictionary('en')
    ]);

    const dictionaries = {
      he: dictHe.email,
      en: dictEn.email
    };
    // =================================================================

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

    const notifyParties: ('first' | 'second')[] = [];
    if ((partyType === "first" || partyType === "both") && suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY) {
      notifyParties.push('first');
    }
    if ((partyType === "second" || partyType === "both") && suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) {
      notifyParties.push('second');
    }
    
    if (notifyParties.length === 0) {
      return NextResponse.json({ success: false, error: "No applicable recipients for reminder" }, { status: 400 });
    }

    // שימוש בטקסט התזכורת מהמילון העברי כברירת מחדל לטקסט ההיסטוריה
    // אך ההתראה עצמה תיבנה לפי השפה של המשתמש בתוך השירות
    const reminderTemplateText = dictHe.email.notifications.customMessage.reminderText;
    const reminderContent = reminderTemplateText
        .replace('{{matchmakerName}}', `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`);

    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: { lastActivity: new Date() },
    });

    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId,
        status: suggestion.status,
        notes: `תזכורת נשלחה ל${partyType === "first" ? "צד ראשון" : partyType === "second" ? "צד שני" : "שני הצדדים"}`,
      },
    });
    
    const languagePrefs = {
        firstParty: (suggestion.firstParty as any).language || 'he',
        secondParty: (suggestion.secondParty as any).language || 'he',
        matchmaker: (suggestion.matchmaker as any).language || 'he',
    };

    await notificationService.handleSuggestionStatusChange(
      suggestion,
      dictionaries, // העברת המילונים
      {
        channels: ['email', 'whatsapp'],
        notifyParties,
        customMessage: reminderContent // הודעה זו תוצג כ-Fallback או תוספת
      },
      languagePrefs
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