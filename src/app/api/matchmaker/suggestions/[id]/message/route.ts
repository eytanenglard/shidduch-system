import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";
import { EmailService } from "@/app/components/matchmaker/new/services/email/EmailService";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // וידוא משתמש מחובר
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // וידוא הרשאות שדכן
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = params.id;
    const { partyType, messageType, content } = await req.json();

    // וידוא קיום ההצעה
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

    // וידוא שדכן בעל הרשאות לשליחת הודעות להצעה
    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to send messages for this suggestion" },
        { status: 403 }
      );
    }

    // יצירת רשימת נמענים
    const recipients: string[] = [];
    if (partyType === "first" || partyType === "both") {
      recipients.push(suggestion.firstParty.email);
    }
    if (partyType === "second" || partyType === "both") {
      recipients.push(suggestion.secondParty.email);
    }

    // בניית כותרת ההודעה
    let subject = "";
    switch (messageType) {
      case "reminder":
        subject = "תזכורת: הצעת שידוך ממתינה לתשובתך";
        break;
      case "update":
        subject = "עדכון בהצעת שידוך";
        break;
      default:
        subject = "הודעה חדשה בנוגע להצעת שידוך";
    }

    // יצירת תוכן HTML להודעה
    const htmlContent = `
      <div dir="rtl">
        <h2>שלום,</h2>
        <p>${content}</p>
        <p>לצפייה בפרטי ההצעה: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/suggestions/${suggestionId}/review">לחץ כאן</a></p>
        <p>בברכה,<br>${session.user.firstName} ${session.user.lastName}</p>
      </div>
    `;

    // שליחת אימייל לכל הנמענים
    const emailService = EmailService.getInstance();
    for (const recipient of recipients) {
      await emailService.sendEmail({
        to: recipient,
        subject,
        html: htmlContent,
      });
    }

    // רישום ההודעה במערכת
    await prisma.$transaction(async (tx) => {
      try {
        // עדכון שדה lastActivity בהצעה
        await tx.matchSuggestion.update({
          where: { id: suggestionId },
          data: {
            lastActivity: new Date(),
          },
        });
        
        // הוספת רשומה להיסטוריית הסטטוס
        await tx.suggestionStatusHistory.create({
          data: {
            suggestionId,
            status: suggestion.status as MatchSuggestionStatus, // Explicitly cast to ensure correct type
            notes: `הודעה נשלחה מאת השדכן: ${messageType} - ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          },
        });
      } catch (txError) {
        console.error("Transaction error:", txError);
        throw txError;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      recipients: recipients.length
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}