import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { valuesQuestions } from "@/components/questionnaire/questions/values/valuesQuestions";
import { personalityQuestions } from "@/components/questionnaire/questions/personality/personalityQuestions";
import { relationshipQuestions } from "@/components/questionnaire/questions/relationship/relationshipQuestions";
import { partnerQuestions } from "@/components/questionnaire/questions/partner/partnerQuestions";
import { religionQuestions } from "@/components/questionnaire/questions/religion/religionQuestions";


// Combine all questions into a single array
// --- UPDATED allQuestions ARRAY ---
const allQuestions = [
  ...valuesQuestions,
  ...personalityQuestions,
  ...relationshipQuestions,
  ...partnerQuestions,
  ...religionQuestions // Use the consolidated religion questions array
];
// --- END UPDATED allQuestions ARRAY ---

// Define key types
type WorldKey = 'values' | 'personality' | 'relationship' | 'partner' | 'religion';
type DbWorldKey = 'valuesAnswers' | 'personalityAnswers' | 'relationshipAnswers' | 'partnerAnswers' | 'religionAnswers';

// Key mapping utility
const KEY_MAPPING: Record<WorldKey, DbWorldKey> = {
  values: 'valuesAnswers',
  personality: 'personalityAnswers',
  relationship: 'relationshipAnswers',
  partner: 'partnerAnswers',
  religion: 'religionAnswers'
};

function getDbKey(worldKey: WorldKey): DbWorldKey {
  return KEY_MAPPING[worldKey];
}

type JsonAnswerData = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible?: boolean;
}

interface UpdateData {
  type: 'answer' | 'visibility';
  value?: string;
  isVisible?: boolean;
}

interface FormattedAnswer {
  questionId: string;
  question: string;
  value: Prisma.JsonValue;
  displayText: string;
  answeredAt: string;
  category?: string;
  isVisible?: boolean;
}

type FormattedAnswersType = Record<WorldKey, FormattedAnswer[]>;

const valueTranslations: Record<string, string> = {
  'combat': 'קרבי',
  'intelligence': 'אינטליגנציה',
  'stable': 'יציב',
  'yes': 'כן',
  'no': 'לא',
  'religious': 'דתי',
  'traditional': 'מסורתי',
  'secular': 'חילוני',
  'male': 'גבר',
  'female': 'אישה',
  'both': 'שניהם',
  'high': 'גבוהה',
  'medium': 'בינונית',
  'low': 'נמוכה'
  // Add other translations as needed based on your actual values
};

function getQuestionLabel(questionId: string): string {
  // Find question in the *updated* allQuestions array
  const question = allQuestions.find(q => q.id === questionId);
  return question?.question || questionId;
}

function getQuestionCategory(questionId: string): string {
  // Find question in the *updated* allQuestions array
  const question = allQuestions.find(q => q.id === questionId);
  // Ensure category exists, fallback to worldId or empty string if needed
  return question?.category || question?.worldId.toLowerCase() || '';
}


function formatValue(value: Prisma.JsonValue): string {
  if (typeof value === 'boolean') {
    return value ? 'כן' : 'לא';
  }

  if (Array.isArray(value)) {
    // Map each value in the array using translations or the value itself
    return value.map(v => valueTranslations[String(v)] || String(v)).join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    // Basic stringification for objects, consider more specific formatting if needed
    return JSON.stringify(value);
  }

  // Handle strings and numbers
  const stringValue = String(value);
  return valueTranslations[stringValue] || stringValue;
}

// Type guard to check if a value is a valid answer object
function isValidAnswerObject(item: Prisma.JsonValue): item is Prisma.JsonObject & {
  questionId: string | number;
  value: Prisma.JsonValue;
  answeredAt: string | number;
  isVisible?: boolean;
} {
  return typeof item === 'object' &&
         item !== null &&
         'questionId' in item &&
         'value' in item &&
         item.value !== undefined && // Ensure value exists
         'answeredAt' in item;
}

function safeParseJson(value: Prisma.JsonValue | null): JsonAnswerData[] {
   if (Array.isArray(value)) {
     return value
       .filter(isValidAnswerObject) // Use the type guard
       .map(item => ({
         questionId: String(item.questionId),
         value: item.value,
         answeredAt: String(item.answeredAt),
         isVisible: Boolean(item.isVisible ?? true) // Default isVisible to true if missing
       }));
   }
   // If value is not an array or null/undefined, return empty array
   return [];
}

function formatAnswers(answers: Prisma.JsonValue | null): FormattedAnswer[] {
  const parsedAnswers = safeParseJson(answers);

  return parsedAnswers.map(answer => {
    const displayText = formatValue(answer.value);
    const category = getQuestionCategory(answer.questionId);

    return {
      questionId: answer.questionId,
      question: getQuestionLabel(answer.questionId),
      value: answer.value,
      displayText,
      category, // Include category if needed elsewhere
      isVisible: answer.isVisible,
      answeredAt: new Date(answer.answeredAt).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    };
  }).sort((a, b) => a.questionId.localeCompare(b.questionId)); // Sort for consistency
}


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!questionnaireResponse) {
       // Return success but with null data if no questionnaire found
       return NextResponse.json({
          success: true,
          questionnaireResponse: null
       });
    }

    // Create formatted answers with correct typing
    const formattedAnswers: Partial<FormattedAnswersType> = {};

    // Iterate through the world keys defined in KEY_MAPPING
    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach(worldKey => {
       const dbKey = getDbKey(worldKey);
       // Check if the key exists on the response before formatting
       if (questionnaireResponse[dbKey]) {
           formattedAnswers[worldKey] = formatAnswers(questionnaireResponse[dbKey]);
       } else {
           formattedAnswers[worldKey] = []; // Initialize with empty array if no data
       }
    });

    // Explicitly cast formattedAnswers to the full type
    const completeFormattedAnswers = formattedAnswers as FormattedAnswersType;

    const formattedResponse = {
      ...questionnaireResponse,
      formattedAnswers: completeFormattedAnswers
    };

    // Filter out non-visible answers if viewing another user's profile
    if (userId !== session.user.id) {
       Object.keys(formattedResponse.formattedAnswers).forEach((worldKey) => {
           const key = worldKey as WorldKey;
           // Ensure the key exists before filtering
           if (formattedResponse.formattedAnswers[key]) {
               formattedResponse.formattedAnswers[key] =
                 formattedResponse.formattedAnswers[key].filter(answer => answer.isVisible !== false);
           }
       });
    }

    return NextResponse.json({
      success: true,
      questionnaireResponse: formattedResponse
    });

  } catch (error) {
    console.error('Error in GET /api/questionnaire:', error); // Log the actual error
    return NextResponse.json({ success: false, error: "Failed to fetch questionnaire" }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
   try {
     const session = await getServerSession(authOptions);
     if (!session?.user?.id) {
       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
     }

     const body = await req.json();
     const { worldKey, questionId, value } = body as {
       worldKey: WorldKey;
       questionId: string;
       value: UpdateData; // value is now { type: 'answer'|'visibility', value?: string, isVisible?: boolean }
     };

     // Validate input
     if (!worldKey || !questionId || !value || !value.type) {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
     }
     if (!KEY_MAPPING[worldKey]) {
         return NextResponse.json({ success: false, error: "Invalid world key" }, { status: 400 });
     }


     const dbKey = getDbKey(worldKey);

     const questionnaire = await prisma.questionnaireResponse.findFirst({
       where: { userId: session.user.id },
       orderBy: { createdAt: 'desc' } // Get the latest questionnaire for the user
     });

     if (!questionnaire) {
       return NextResponse.json({ success: false, error: "שאלון לא נמצא" }, { status: 404 });
     }

     const currentAnswers = safeParseJson(questionnaire[dbKey]);
     const existingAnswerIndex = currentAnswers.findIndex((a) => a.questionId === questionId);
     const existingAnswer = existingAnswerIndex !== -1 ? currentAnswers[existingAnswerIndex] : null;

     let updatedAnswer: JsonAnswerData;

     if (value.type === 'visibility') {
        // Handle visibility update
        if (!existingAnswer) {
          // Cannot update visibility for a non-existent answer
          return NextResponse.json({ success: false, error: "לא נמצאה תשובה לעדכון נראות" }, { status: 404 });
        }
        if (typeof value.isVisible !== 'boolean') {
             return NextResponse.json({ success: false, error: "ערך נראות לא תקין" }, { status: 400 });
        }
        updatedAnswer = {
          ...existingAnswer,
          isVisible: value.isVisible,
          answeredAt: new Date().toISOString() // Update timestamp on visibility change too
        };
     } else if (value.type === 'answer') {
       // Handle answer update
       // Validate the actual answer value if needed (basic check here)
       if (value.value === undefined) {
            return NextResponse.json({ success: false, error: "ערך תשובה חסר" }, { status: 400 });
       }
       updatedAnswer = {
         questionId,
         value: value.value as Prisma.JsonValue, // Cast the value appropriately
         isVisible: existingAnswer?.isVisible ?? true, // Preserve existing visibility or default to true
         answeredAt: new Date().toISOString()
       };
     } else {
         return NextResponse.json({ success: false, error: "סוג עדכון לא תקין" }, { status: 400 });
     }

     // Create the updated answers array
     const updatedAnswers = [...currentAnswers]; // Create a mutable copy
     if (existingAnswerIndex !== -1) {
         updatedAnswers[existingAnswerIndex] = updatedAnswer; // Replace existing
     } else if (value.type === 'answer') { // Only add if it's an answer update and didn't exist
         updatedAnswers.push(updatedAnswer); // Add new answer
     }

     const updated = await prisma.questionnaireResponse.update({
       where: { id: questionnaire.id },
       data: {
         [dbKey]: updatedAnswers as Prisma.JsonValue, // Ensure the array is treated as JSON
         lastSaved: new Date()
       }
     });

     // --- Reformat response after update ---
     const formattedAnswers: Partial<FormattedAnswersType> = {};
     (Object.keys(KEY_MAPPING) as WorldKey[]).forEach(key => {
       const currentDbKey = getDbKey(key);
       // Check if the key exists on the updated response before formatting
        if (updated[currentDbKey]) {
            formattedAnswers[key] = formatAnswers(updated[currentDbKey]);
        } else {
            formattedAnswers[key] = []; // Initialize with empty array if no data
        }
     });

     const completeFormattedAnswers = formattedAnswers as FormattedAnswersType;

     const formattedResponse = {
       ...updated,
       formattedAnswers: completeFormattedAnswers
     };
     // --- End Reformat response ---


     return NextResponse.json({
       success: true,
       data: formattedResponse // Return the updated and formatted data
     });

   } catch (error) {
       console.error('Error in PATCH /api/questionnaire:', error);
       if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific Prisma errors if needed
            return NextResponse.json({ success: false, error: "שגיאת מסד נתונים" }, { status: 500 });
       }
       if (error instanceof Error) {
         // Return specific error messages if thrown explicitly
         return NextResponse.json({ success: false, error: error.message }, { status: 500 });
       }
       return NextResponse.json({ success: false, error: "שגיאה בעדכון השאלון" }, { status: 500 });
   }
}
