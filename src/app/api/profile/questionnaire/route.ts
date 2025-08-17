// src/app/api/profile/questionnaire/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { updateUserAiProfile } from '@/lib/services/profileAiService';

// --- ייבואים מרכזיים ---
import type { FormattedAnswer } from '@/types/next-auth';
import type { Question } from '@/components/questionnaire/types/types';
import { personalityQuestions } from '@/components/questionnaire/questions/personality/personalityQuestions';
import { valuesQuestions } from '@/components/questionnaire/questions/values/valuesQuestions';
import { relationshipQuestions } from '@/components/questionnaire/questions/relationship/relationshipQuestions';
import { partnerQuestions } from '@/components/questionnaire/questions/partner/partnerQuestions';
import { religionQuestions } from '@/components/questionnaire/questions/religion/religionQuestions';

// --- איחוד כל השאלות למקור מידע אחד ---
const allQuestions: Question[] = [
  ...personalityQuestions,
  ...valuesQuestions,
  ...relationshipQuestions,
  ...partnerQuestions,
  ...religionQuestions,
];
const questionsMap = new Map(allQuestions.map(q => [q.id, q]));

// --- הגדרות וטיפוסים פנימיים ---
type WorldKey =
  | 'values'
  | 'personality'
  | 'relationship'
  | 'partner'
  | 'religion';

type DbWorldKey =
  | 'valuesAnswers'
  | 'personalityAnswers'
  | 'relationshipAnswers'
  | 'partnerAnswers'
  | 'religionAnswers';

const KEY_MAPPING: Record<WorldKey, DbWorldKey> = {
  values: 'valuesAnswers',
  personality: 'personalityAnswers',
  relationship: 'relationshipAnswers',
  partner: 'partnerAnswers',
  religion: 'religionAnswers',
};

type JsonAnswerData = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible: boolean;
};

interface UpdateData {
  type: 'answer' | 'visibility';
  value?: Prisma.JsonValue;
  isVisible?: boolean;
}


// --- פונקציות עזר לעיבוד נתונים ---

/**
 * יוצרת טקסט תצוגה פשוט מכל סוג של ערך תשובה.
 */
function createDisplayText(rawValue: Prisma.JsonValue | null): string {
    if (rawValue === null || rawValue === undefined) return 'לא נענה';
    if (typeof rawValue === 'string' || typeof rawValue === 'number') return String(rawValue);
    if (Array.isArray(rawValue)) return rawValue.join(', ');
    if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        return Object.entries(rawValue)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
    }
    return 'תשובה מורכבת';
}

/**
 * Type guard שמוודא שאובייקט JSON הוא אובייקט תשובה תקין.
 */
function isValidAnswerObject(
  item: Prisma.JsonValue
): item is Prisma.JsonObject & {
  questionId: string | number;
  value: Prisma.JsonValue;
  answeredAt: string | number;
  isVisible?: boolean;
} {
  return (
    typeof item === 'object' &&
    item !== null &&
    'questionId' in item &&
    'value' in item &&
    item.value !== undefined &&
    'answeredAt' in item
  );
}

/**
 * ממירה בבטחה את שדה ה-JSON ממסד הנתונים למערך של אובייקטי תשובות.
 */
function safeParseJson(value: Prisma.JsonValue | null): JsonAnswerData[] {
  if (Array.isArray(value)) {
    return value.filter(isValidAnswerObject).map((item) => ({
      questionId: String(item.questionId),
      value: item.value,
      answeredAt: String(item.answeredAt),
      isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
    }));
  }
  return [];
}

/**
 * הפונקציה המרכזית: מקבלת את התשובות הגולמיות ומחזירה מערך מעוצב עם כל המידע הנדרש לקליינט.
 */
function formatAnswers(answersJson: Prisma.JsonValue | null): FormattedAnswer[] {
  const parsedAnswers = safeParseJson(answersJson);

  return parsedAnswers.map((answer) => {
    const fullQuestion = questionsMap.get(answer.questionId);

    // מקרה קצה: אם לא מצאנו את השאלה במפה, נייצר תשובה בסיסית כדי למנוע קריסה
    if (!fullQuestion) {
      console.warn(`Question with ID "${answer.questionId}" not found in questionsMap.`);
      return {
        questionId: answer.questionId,
        question: `שאלה לא ידועה (${answer.questionId})`,
        questionType: 'unknown',
        rawValue: answer.value,
        displayText: createDisplayText(answer.value),
        isVisible: answer.isVisible,
        answeredAt: new Date(answer.answeredAt).toISOString(),
      };
    }

    // יצירת האובייקט המלא עם כל השדות החדשים
    return {
      questionId: answer.questionId,
      question: fullQuestion.question,
      questionType: fullQuestion.type,
      rawValue: answer.value,
      displayText: createDisplayText(answer.value),
      isVisible: answer.isVisible,
      answeredAt: new Date(answer.answeredAt).toISOString(),
    };
  }).sort((a, b) => a.questionId.localeCompare(b.questionId));
}

// --- API Endpoints ---

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
       return NextResponse.json({
          success: true,
          questionnaireResponse: null
       });
    }

    // שימוש בפונקציה המעודכנת לעיצוב הנתונים
    const formattedAnswers: Partial<Record<WorldKey, FormattedAnswer[]>> = {};
    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach(worldKey => {
       const dbKey = KEY_MAPPING[worldKey];
       formattedAnswers[worldKey] = formatAnswers(questionnaireResponse[dbKey]);
    });

    const formattedResponse = {
      ...questionnaireResponse,
      formattedAnswers: formattedAnswers
    };

    // בדיקת הרשאות צפייה
    const performingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!performingUser) {
      return NextResponse.json({ success: false, error: 'Performing user not found' }, { status: 404 });
    }

    const viewerIsAdminOrMatchmaker = performingUser.role === 'ADMIN' || performingUser.role === 'MATCHMAKER';

    // סינון תשובות נסתרות אם הצופה אינו שדכן/אדמין או בעל הפרופיל
    if (!viewerIsAdminOrMatchmaker && userId !== session.user.id) {
        Object.keys(formattedResponse.formattedAnswers).forEach((worldKey) => {
            const key = worldKey as WorldKey;
            if (formattedResponse.formattedAnswers[key]) {
                formattedResponse.formattedAnswers[key] =
                  formattedResponse.formattedAnswers[key]!.filter(answer => answer.isVisible !== false);
            }
        });
    }

    return NextResponse.json({
      success: true,
      questionnaireResponse: formattedResponse
    });

  } catch (error) {
    console.error('Error in GET /api/profile/questionnaire:', error);
    return NextResponse.json({ success: false, error: "Failed to fetch questionnaire" }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
   try {
     const session = await getServerSession(authOptions);
     if (!session?.user?.id) {
       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
     }
     const userId = session.user.id;

     const body = await req.json();
     
     const { worldKey, questionId, value } = body as {
       worldKey: WorldKey;
       questionId: string;
       value: UpdateData;
     };

     if (!worldKey || !questionId || !value || !value.type) {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
     }

     if (!KEY_MAPPING[worldKey]) {
         return NextResponse.json({ success: false, error: "Invalid world key" }, { status: 400 });
     }

     const dbKey = KEY_MAPPING[worldKey];

     const questionnaire = await prisma.questionnaireResponse.findFirst({
       where: { userId: session.user.id },
       orderBy: { createdAt: 'desc' }
     });

     if (!questionnaire) {
       return NextResponse.json({ success: false, error: "שאלון לא נמצא" }, { status: 404 });
     }

     const currentAnswers = safeParseJson(questionnaire[dbKey]);
     const existingAnswerIndex = currentAnswers.findIndex((a) => a.questionId === questionId);
     const existingAnswer = existingAnswerIndex !== -1 ? currentAnswers[existingAnswerIndex] : null;

     let updatedAnswer: JsonAnswerData;

     if (value.type === 'visibility') {
        if (!existingAnswer) {
          return NextResponse.json({ success: false, error: "לא נמצאה תשובה לעדכון נראות" }, { status: 404 });
        }
        if (typeof value.isVisible !== 'boolean') {
             return NextResponse.json({ success: false, error: "ערך נראות לא תקין" }, { status: 400 });
        }
        updatedAnswer = {
          ...existingAnswer,
          isVisible: value.isVisible,
          answeredAt: new Date().toISOString()
        };
     } else if (value.type === 'answer') {
       if (value.value === undefined) {
            return NextResponse.json({ success: false, error: "ערך תשובה חסר" }, { status: 400 });
       }
       updatedAnswer = {
         questionId,
         value: value.value,
         isVisible: existingAnswer?.isVisible ?? true,
         answeredAt: new Date().toISOString()
       };
     } else {
         return NextResponse.json({ success: false, error: "סוג עדכון לא תקין" }, { status: 400 });
     }

     const updatedAnswers = [...currentAnswers];
     if (existingAnswerIndex !== -1) {
         updatedAnswers[existingAnswerIndex] = updatedAnswer;
     } else if (value.type === 'answer') {
         updatedAnswers.push(updatedAnswer);
     }

     const updated = await prisma.questionnaireResponse.update({
       where: { id: questionnaire.id },
       data: {
         [dbKey]: updatedAnswers as Prisma.JsonValue,
         lastSaved: new Date()
       }
     });

     updateUserAiProfile(userId).catch(err => {
        console.error(`[AI Profile Trigger - Questionnaire Update] Failed to update AI profile in the background for user ${userId}:`, err);
     });

    // לאחר העדכון, נשתמש שוב בפונקציה המעודכנת כדי לשלוח חזרה את הנתונים המלאים
    const formattedAnswers: Partial<Record<WorldKey, FormattedAnswer[]>> = {};
    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach(key => {
       const currentDbKey = KEY_MAPPING[key];
        formattedAnswers[key] = formatAnswers(updated[currentDbKey]);
    });

     const formattedResponse = {
       ...updated,
       formattedAnswers: formattedAnswers
     };

     return NextResponse.json({
       success: true,
       data: formattedResponse
     });

   } catch (error) {
       console.error('FATAL Error in PATCH /api/profile/questionnaire:', error);
       if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return NextResponse.json({ success: false, error: "שגיאת מסד נתונים" }, { status: 500 });
       }
       if (error instanceof SyntaxError && error.message.includes("JSON")) {
           return NextResponse.json({ success: false, error: "גוף הבקשה אינו JSON תקין" }, { status: 400 });
       }
       if (error instanceof Error) {
         return NextResponse.json({ success: false, error: error.message }, { status: 500 });
       }
       return NextResponse.json({ success: false, error: "שגיאה בעדכון השאלון" }, { status: 500 });
   }
}