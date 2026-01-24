// src/app/api/profile/questionnaire/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { Locale } from '../../../../../i18n-config';

import { formatAnswers, KEY_MAPPING } from '@/lib/questionnaireFormatter';
import type { FormattedAnswersType } from '@/lib/questionnaireFormatter';
import type { WorldId, UpdateValue } from '@/types/next-auth';
import { formatQuestionnaireForDisplay } from '@/lib/services/questionnaireService';

type JsonAnswerData = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible: boolean;
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // קביעת שפת הצופה מה-URL או מה-headers (כאן נשתמש בברירת מחדל)
    const url = new URL(req.url);
    const viewerLocale = (url.searchParams.get('locale') as Locale) || 'he';
    const targetUserId = url.searchParams.get('userId') || session.user.id;
const isOwnProfile = session.user.id === targetUserId;
const hasElevatedPermissions = 
    session.user.role === UserRole.ADMIN || 
    session.user.role === UserRole.MATCHMAKER;
const canViewAllAnswers = isOwnProfile || hasElevatedPermissions;
console.log(`---[ SERVER LOG | API questionnaire GET ]--- שליפת שאלון עבור: ${targetUserId}, צופה: ${session.user.id}, תפקיד צופה: ${session.user.role}, יכול לראות הכל: ${canViewAllAnswers}`);

console.log(`---[ SERVER LOG | API questionnaire GET ]--- שליפת שאלון עבור משתמש: ${targetUserId}, שפת צפייה: ${viewerLocale}, האם בעל הפרופיל: ${isOwnProfile}`);


    const rawQuestionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });

    if (!rawQuestionnaire) {
              console.warn('---[ SERVER LOG | API questionnaire GET ]--- לא נמצא שאלון עבור המשתמש.');

      return NextResponse.json({ success: false, message: 'No questionnaire found' }, { status: 404 });
    }
    console.log('---[ SERVER LOG | API questionnaire GET ]--- נתוני שאלון גולמיים מה-DB:', JSON.stringify(rawQuestionnaire, null, 2));

    // שימוש בפונקציית העיצוב החדשה
const formattedQuestionnaire = await formatQuestionnaireForDisplay(
  rawQuestionnaire,
  viewerLocale,
  canViewAllAnswers  // <-- הוספת הפרמטר החדש
);    console.log('---[ DEBUG 4: FINAL API RESPONSE ]--- Data being sent to client:', JSON.stringify(formattedQuestionnaire.formattedAnswers, null, 2));
    console.log('---[ SERVER LOG | API questionnaire GET ]--- נתונים מעובדים שמוחזרים לקליינט:', JSON.stringify(formattedQuestionnaire, null, 2));

    return NextResponse.json({
      success: true,
      questionnaireResponse: formattedQuestionnaire,
    });
  } catch (error) {
    console.error('Error fetching formatted questionnaire:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
 
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
     
   const { worldKey: rawWorldKey, questionId, value } = body as {
  worldKey: string;  // שינוי מ-WorldId ל-string
  questionId: string;
  value: UpdateValue;
};

// נורמליזציה ל-UPPERCASE
const worldKey = rawWorldKey?.toUpperCase() as WorldId;

if (!worldKey || !questionId || !value || !value.type || !KEY_MAPPING[worldKey]) {
   return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
}

     const dbKey = KEY_MAPPING[worldKey];

     const questionnaire = await prisma.questionnaireResponse.findFirst({
       where: { userId: session.user.id },
       orderBy: { createdAt: 'desc' }
     });

     if (!questionnaire) {
       return NextResponse.json({ success: false, error: "שאלון לא נמצא" }, { status: 404 });
     }

     const currentAnswersJson = questionnaire[dbKey];
     const currentAnswers = Array.isArray(currentAnswersJson) ? currentAnswersJson as unknown as JsonAnswerData[] : [];

     let updatedAnswers: JsonAnswerData[];

     if (value.type === 'delete') {
       // לוגיקה למחיקת התשובה
       updatedAnswers = currentAnswers.filter(a => a.questionId !== questionId);
     } else {
       // לוגיקה קיימת לעדכון או הוספת תשובה
       const existingAnswerIndex = currentAnswers.findIndex((a) => a.questionId === questionId);
       const existingAnswer = existingAnswerIndex !== -1 ? currentAnswers[existingAnswerIndex] : null;

       let updatedAnswer: JsonAnswerData;

       if (value.type === 'visibility') {
          if (!existingAnswer) return NextResponse.json({ success: false, error: "לא נמצאה תשובה לעדכון נראות" }, { status: 404 });
          if (typeof value.isVisible !== 'boolean') return NextResponse.json({ success: false, error: "ערך נראות לא תקין" }, { status: 400 });
          updatedAnswer = { ...existingAnswer, isVisible: value.isVisible, answeredAt: new Date().toISOString() };
       } else if (value.type === 'answer') {
         if (value.value === undefined) return NextResponse.json({ success: false, error: "ערך תשובה חסר" }, { status: 400 });
         updatedAnswer = {
           questionId,
           value: value.value as Prisma.JsonValue,
           isVisible: existingAnswer?.isVisible ?? true,
           answeredAt: new Date().toISOString()
         };
       } else {
           return NextResponse.json({ success: false, error: "סוג עדכון לא תקין" }, { status: 400 });
       }

       updatedAnswers = [...currentAnswers];
       if (existingAnswerIndex !== -1) {
           updatedAnswers[existingAnswerIndex] = updatedAnswer;
       } else if (value.type === 'answer') {
           updatedAnswers.push(updatedAnswer);
       }
     }

     const updated = await prisma.questionnaireResponse.update({
       where: { id: questionnaire.id },
       data: {
         [dbKey]: updatedAnswers as Prisma.JsonValue,
         lastSaved: new Date()
       }
     });

     await prisma.profile.update({
       where: { userId },
       data: { needsAiProfileUpdate: true }
     });
await prisma.user.update({
  where: { id: userId },
  data: { updatedAt: new Date() }
});
    const formattedAnswers: Partial<FormattedAnswersType> = {};
    (Object.keys(KEY_MAPPING) as WorldId[]).forEach(key => {
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