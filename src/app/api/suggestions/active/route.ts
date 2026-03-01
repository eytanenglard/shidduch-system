// src/app/api/suggestions/active/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatAnswers, KEY_MAPPING, FormattedAnswersType } from '@/lib/questionnaireFormatter';
import type { ExtendedMatchSuggestion, PartyInfo, QuestionnaireResponse } from "@/types/suggestions";
import type {  WorldId } from "@/types/next-auth";
export const dynamic = 'force-dynamic';
// --- טיפוסים חזקים ומדויקים לתהליך העיבוד ---
type ProcessedQuestionnaireResponse = Omit<QuestionnaireResponse, 'valuesAnswers' | 'personalityAnswers' | 'relationshipAnswers' | 'partnerAnswers' | 'religionAnswers'> & {
  formattedAnswers: FormattedAnswersType;
};

type ProcessedPartyInfo = Omit<PartyInfo, 'questionnaireResponses'> & {
  questionnaireResponses?: ProcessedQuestionnaireResponse[];
};

type SuggestionWithFormattedData = Omit<ExtendedMatchSuggestion, 'firstParty' | 'secondParty'> & {
  firstParty: ProcessedPartyInfo;
  secondParty: ProcessedPartyInfo;
};

// הטיפוס שמגיע מ-Prisma. שימו לב ש-questionnaireResponses הוא מהסוג הגולמי.
type PartyInfoFromPrisma = Omit<PartyInfo, 'questionnaireResponses'> & {
  questionnaireResponses?: QuestionnaireResponse[];
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { firstPartyId: session.user.id, status: { in: ["PENDING_FIRST_PARTY", "FIRST_PARTY_APPROVED", "PENDING_SECOND_PARTY", "SECOND_PARTY_APPROVED", "CONTACT_DETAILS_SHARED"] } },
          { secondPartyId: session.user.id, status: { in: ["PENDING_SECOND_PARTY", "SECOND_PARTY_APPROVED", "CONTACT_DETAILS_SHARED"] } },
        ],
      },
      include: {
        statusHistory: { orderBy: { createdAt: 'desc' } },
        matchmaker: { select: { firstName: true, lastName: true } },
        firstParty: {
          include: { profile: true, images: true, questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        secondParty: {
          include: { profile: true, images: true, questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // --- עיבוד נתונים עם טיפוסים חזקים (ללא any) ---
    const suggestionsWithFormattedQuestionnaires: SuggestionWithFormattedData[] = activeSuggestions.map((suggestion) => {
        
        // הפונקציה הזו מקבלת את הטיפוס הגולמי מפריזמה ומחזירה את הטיפוס המעובד
        const formatPartyQuestionnaire = (party: PartyInfoFromPrisma): ProcessedPartyInfo => {
            const { questionnaireResponses, ...restOfParty } = party;

            if (questionnaireResponses && questionnaireResponses.length > 0) {
                const qr = questionnaireResponses[0];
                const formattedAnswers: Partial<FormattedAnswersType> = {};

                (Object.keys(KEY_MAPPING) as WorldId[]).forEach(worldKey => {
                    const dbKey = KEY_MAPPING[worldKey];
                    // גישה בטוחה יותר לשדה דינמי
                    const answersJson = qr[dbKey];
                    formattedAnswers[worldKey] = formatAnswers(answersJson);
                });
                
                // הסרת השדות הגולמיים ויצירת האובייקט המעובד
                const { valuesAnswers, personalityAnswers, relationshipAnswers, partnerAnswers, religionAnswers, ...restOfQr } = qr;
                const processedQr: ProcessedQuestionnaireResponse = {
                    ...restOfQr,
                    formattedAnswers: formattedAnswers as FormattedAnswersType,
                };
                
                return { ...restOfParty, questionnaireResponses: [processedQr] };
            }
            // אם אין שאלון, מחזירים את שאר המידע על המשתמש
            return restOfParty;
        };

        return {
            ...suggestion,
            firstParty: formatPartyQuestionnaire(suggestion.firstParty),
            secondParty: formatPartyQuestionnaire(suggestion.secondParty),
        };
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestionsWithFormattedQuestionnaires,
    });
    
  } catch (error) {
    console.error("Error fetching active suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}