// src/app/api/suggestions/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { MatchSuggestionStatus, MatchSuggestion, UserRole } from "@prisma/client";
// שירות מרכזי שמטפל בלוגיקה, כולל קריאה לשירות המעבר
import { suggestionService } from "@/components/matchmaker/suggestions/services/suggestions/SuggestionService";
import { getDictionary } from "@/lib/dictionaries";
import { EmailDictionary } from "@/types/dictionary";

// סכמת ולידציה לגוף הבקשה
const statusUpdateSchema = z.object({
  status: z.enum([
    "DRAFT", "PENDING_FIRST_PARTY", "FIRST_PARTY_APPROVED", "FIRST_PARTY_DECLINED", 
    "PENDING_SECOND_PARTY", "SECOND_PARTY_APPROVED", "SECOND_PARTY_DECLINED", 
    "AWAITING_MATCHMAKER_APPROVAL", "CONTACT_DETAILS_SHARED", "AWAITING_FIRST_DATE_FEEDBACK", 
    "THINKING_AFTER_DATE", "PROCEEDING_TO_SECOND_DATE", "ENDED_AFTER_FIRST_DATE", 
    "MEETING_PENDING", "MEETING_SCHEDULED", "MATCH_APPROVED", "MATCH_DECLINED", 
    "DATING", "ENGAGED", "MARRIED", "EXPIRED", "CLOSED", "CANCELLED"
  ] as const),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  meetingDate: z.string().optional(),
  customMessage: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1. חילוץ פרמטרים ואימות סשן
    const suggestionId = context.params.id;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. טעינת המילון בהתבסס על שפת המשתמש
    const url = new URL(req.url);
    const locale: 'he' | 'en' = (url.searchParams.get('locale') === 'en') ? 'en' : 'he';
    
    console.log(`[API /status PATCH] Suggestion ID: ${suggestionId}, Locale: '${locale}'`);

    const dictionary = await getDictionary(locale);
    const emailDict: EmailDictionary = dictionary.email;

    if (!emailDict) {
        throw new Error(`Email dictionary for locale '${locale}' could not be loaded.`);
    }

    // 3. קריאה ואימות של גוף הבקשה
    const body = await req.json();
    const validatedData = statusUpdateSchema.parse(body);
      
    // 4. שליפת ההצעה הנוכחית מה-DB
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // 5. בדיקות הרשאה ולוגיקה עסקית
    // (לדוגמה: בדיקת הצעות פעילות אחרות של המועמד)
    const isCandidateApproval =
      session.user.role === UserRole.CANDIDATE &&
      (validatedData.status === MatchSuggestionStatus.FIRST_PARTY_APPROVED ||
       validatedData.status === MatchSuggestionStatus.SECOND_PARTY_APPROVED);

    if (isCandidateApproval) {
      // כאן תוכל להוסיף את הלוגיקה לבדיקת הצעות פעילות אחרות...
    }
    
    // וידוא שהמשתמש הנוכחי קשור להצעה
    if (
      suggestion.firstPartyId !== userId &&
      suggestion.secondPartyId !== userId &&
      suggestion.matchmakerId !== userId
    ) {
      return NextResponse.json({ error: "Unauthorized to update this suggestion" }, { status: 403 });
    }

    // 6. קריאה מתוקנת לשירות המרכזי עם כל הפרמטרים הנדרשים
    let updatedSuggestion = await suggestionService.updateSuggestionStatus(
      suggestionId,
      validatedData.status,
      userId,
      emailDict, // <-- העברת המילון
      validatedData.notes
    );
    
    // 7. טיפול בפעולות משניות (כמו מעבר סטטוס אוטומטי)
    const secondaryAction = determineSecondaryAction(suggestion.status, validatedData.status);
    if (secondaryAction) {
      try {
        console.log(`[API /status PATCH] Triggering secondary action: ${secondaryAction}`);
        // גם כאן, קריאה מתוקנת לשירות עם כל הפרמטרים
        updatedSuggestion = await suggestionService.updateSuggestionStatus(
          updatedSuggestion.id,
          secondaryAction,
          userId, // או משתמש מערכת, תלוי בלוגיקה
          emailDict, // <-- העברת המילון
          `Automatic transition after ${validatedData.status}`
        );
      } catch (secondaryActionError) {
        console.warn("Warning: Secondary status transition failed:", secondaryActionError);
      }
    }

    // 8. עדכון פרופילים במקרה הצורך (למשל, אירוסין/נישואין)
    await updateProfilesIfNeeded(validatedData.status, suggestion);

    // 9. החזרת תשובת הצלחה
    return NextResponse.json({
      success: true,
      suggestion: updatedSuggestion,
    });

  } catch (error) {
    console.error("Error processing request in status/route.ts:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ======================= פונקציות עזר (נשארות ללא שינוי) =======================

/**
 * קובעת אם נדרשת פעולת המשך אוטומטית לאחר שינוי סטטוס.
 */
function determineSecondaryAction(
  currentStatus: MatchSuggestionStatus,
  newStatus: MatchSuggestionStatus
): MatchSuggestionStatus | null {
  const automaticTransitions: Partial<Record<MatchSuggestionStatus, MatchSuggestionStatus>> = {
    FIRST_PARTY_APPROVED: MatchSuggestionStatus.PENDING_SECOND_PARTY,
    SECOND_PARTY_APPROVED: MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
    FIRST_PARTY_DECLINED: MatchSuggestionStatus.CLOSED,
    SECOND_PARTY_DECLINED: MatchSuggestionStatus.CLOSED,
  };
  return automaticTransitions[newStatus] || null;
}


/**
 * מעדכן את סטטוס הזמינות בפרופילים של המועמדים במקרה הצורך.
 */
async function updateProfilesIfNeeded(
  newStatus: MatchSuggestionStatus,
  suggestion: MatchSuggestion,
) {
  if (newStatus === "ENGAGED" || newStatus === "MARRIED") {
    const availabilityStatus = newStatus === "ENGAGED" ? "ENGAGED" : "MARRIED";
    await Promise.all([
      prisma.profile.update({
        where: { userId: suggestion.firstPartyId },
        data: { availabilityStatus, availabilityNote: `Status changed to ${newStatus} on ${new Date().toISOString().split('T')[0]}`, availabilityUpdatedAt: new Date() }
      }),
      prisma.profile.update({
        where: { userId: suggestion.secondPartyId },
        data: { availabilityStatus, availabilityNote: `Status changed to ${newStatus} on ${new Date().toISOString().split('T')[0]}`, availabilityUpdatedAt: new Date() }
      })
    ]);
  }
  
  if (newStatus === "DATING") {
    await Promise.all([
      prisma.profile.update({
        where: { userId: suggestion.firstPartyId },
        data: { availabilityStatus: "DATING", availabilityNote: "Currently in a dating process", availabilityUpdatedAt: new Date() }
      }),
      prisma.profile.update({
        where: { userId: suggestion.secondPartyId },
        data: { availabilityStatus: "DATING", availabilityNote: "Currently in a dating process", availabilityUpdatedAt: new Date() }
      })
    ]);
  }
}