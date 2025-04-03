import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
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
    const { partyType } = await req.json();

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

    // וידוא שדכן בעל הרשאות לשליחת תזכורות להצעה
    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to send reminders for this suggestion" },
        { status: 403 }
      );
    }
    
    // בניית תוכן התזכורת בהתאם לסטטוס ההצעה
    const subject = "תזכורת: הצעת שידוך ממתינה לתשובתך";
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const reviewUrl = `${baseUrl}/suggestions/${suggestionId}/review`;
    
    // יצירת רשימת הודעות לשליחה
    let sentCount = 0;
    
    // התאמת תוכן למצב ההצעה
    if (partyType === "first" || partyType === "both") {
      if (suggestion.status === MatchSuggestionStatus.PENDING_FIRST_PARTY) {
        const emailService = EmailService.getInstance();
        const htmlContent = `
          <div dir="rtl">
            <h2>שלום ${suggestion.firstParty.firstName},</h2>
            <p>זוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך.</p>
            <p>לצפייה בפרטי ההצעה ומענה: <a href="${reviewUrl}">לחץ כאן</a></p>
            <p>בברכה,<br>מערכת השידוכים</p>
          </div>
        `;
        
        await emailService.sendEmail({
          to: suggestion.firstParty.email,
          subject,
          html: htmlContent
        });
        
        sentCount++;
      }
    }
    
    if (partyType === "second" || partyType === "both") {
      if (suggestion.status === MatchSuggestionStatus.PENDING_SECOND_PARTY) {
        const emailService = EmailService.getInstance();
        const htmlContent = `
          <div dir="rtl">
            <h2>שלום ${suggestion.secondParty.firstName},</h2>
            <p>זוהי תזכורת ידידותית שהצעת שידוך מאת ${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName} ממתינה לתשובתך.</p>
            <p>לצפייה בפרטי ההצעה ומענה: <a href="${reviewUrl}">לחץ כאן</a></p>
            <p>בברכה,<br>מערכת השידוכים</p>
          </div>
        `;
        
        await emailService.sendEmail({
          to: suggestion.secondParty.email,
          subject,
          html: htmlContent
        });
        
        sentCount++;
      }
    }
    
    // בדיקה שנשלח לפחות אימייל אחד
    if (sentCount === 0) {
      return NextResponse.json({
        success: false,
        error: "No applicable recipients for reminder in current status"
      }, { status: 400 });
    }

    // עדכון הפעילות האחרונה בהצעה
    await prisma.matchSuggestion.update({
      where: { id: suggestionId },
      data: {
        lastActivity: new Date(),
      },
    });

    // רישום התזכורת בהיסטוריה
    await prisma.suggestionStatusHistory.create({
      data: {
        suggestionId,
        status: suggestion.status, // לא משנים סטטוס, רק מתעדים תזכורת
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