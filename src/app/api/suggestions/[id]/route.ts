// src/app/api/suggestions/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Helper function to include all necessary fields for a party
const partySelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profile: true,
  images: {
    select: {
      id: true,
      url: true,
      isMain: true,
    },
    orderBy: { isMain: "desc" as const },
  },
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const suggestionId = params.id;
  // --- לוג 1: התחלת טיפול בבקשה ---
  console.log(`[API GET /suggestions/${suggestionId}] Request received.`);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // --- לוג 2: שגיאת אימות ---
      console.warn(`[API GET /suggestions/${suggestionId}] Unauthorized access attempt: No session or user ID.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- לוג 3: פרטי משתמש מאומת ---
    console.log(`[API GET /suggestions/${suggestionId}] User authenticated: ID=${session.user.id}, Role=${session.user.role}`);

    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        matchmaker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        firstParty: { select: partySelect },
        secondParty: { select: partySelect },
        statusHistory: {
          orderBy: { createdAt: "desc" as const },
        },
      },
    });

    if (!suggestion) {
      // --- לוג 4: הצעה לא נמצאה ---
      console.warn(`[API GET /suggestions/${suggestionId}] Suggestion not found in database.`);
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // --- לוג 5: הצעה נמצאה בהצלחה ---
    console.log(`[API GET /suggestions/${suggestionId}] Found suggestion. Status: ${suggestion.status}, Matchmaker: ${suggestion.matchmakerId}`);

    // Authorization check: User must be one of the parties or the matchmaker or an admin
    const isAuthorized =
      session.user.id === suggestion.firstPartyId ||
      session.user.id === suggestion.secondPartyId ||
      session.user.id === suggestion.matchmakerId ||
      session.user.role === UserRole.ADMIN;

    if (!isAuthorized) {
      // --- לוג 6: שגיאת הרשאה ---
      console.warn(`[API GET /suggestions/${suggestionId}] Forbidden access. User ${session.user.id} is not a party, the matchmaker, or an admin.`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // --- לוג 7: הרשאה תקינה ---
    console.log(`[API GET /suggestions/${suggestionId}] User ${session.user.id} is authorized to view.`);

    // Fetch the questionnaire for the "other" party
    const targetPartyId =
      suggestion.firstPartyId === session.user.id
        ? suggestion.secondPartyId
        : suggestion.firstPartyId;

    // --- לוג 8: שליפת שאלון עבור הצד השני ---
    console.log(`[API GET /suggestions/${suggestionId}] Fetching questionnaire for targetPartyId: ${targetPartyId}.`);

    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: { userId: targetPartyId },
      orderBy: { createdAt: 'desc' }
    });

    // --- לוג 9: תוצאת שליפת השאלון ---
    if (questionnaireResponse) {
        console.log(`[API GET /suggestions/${suggestionId}] Found questionnaire for targetPartyId: ${targetPartyId}. Questionnaire ID: ${questionnaireResponse.id}`);
    } else {
        console.warn(`[API GET /suggestions/${suggestionId}] No questionnaire found for targetPartyId: ${targetPartyId}.`);
    }

    // Combine all data into a single response object
    const fullSuggestionData = {
      ...suggestion,
      secondPartyQuestionnaire: questionnaireResponse || null, // Naming this consistently
    };

    // --- לוג 10: סיכום המידע לפני שליחה ---
    console.log(`[API GET /suggestions/${suggestionId}] Preparing to send final data. Suggestion ID: ${fullSuggestionData.id}, Status: ${fullSuggestionData.status}, Questionnaire present: ${!!fullSuggestionData.secondPartyQuestionnaire}`);
    // אם תרצה לראות את כל האובייקט, תוכל להסיר את ההערה מהשורה הבאה, אך שים לב שהפלט יהיה ארוך מאוד
    // console.log(`[API GET /suggestions/${suggestionId}] Full data object:`, JSON.stringify(fullSuggestionData, null, 2));


    return NextResponse.json({
      success: true,
      suggestion: fullSuggestionData,
    });
  } catch (error) {
    // --- לוג 11: טיפול בשגיאות כלליות ---
    console.error(`[API GET /suggestions/${suggestionId}] Critical error fetching suggestion:`, error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}