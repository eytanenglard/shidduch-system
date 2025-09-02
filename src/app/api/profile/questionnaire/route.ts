// src/app/api/profile/questionnaire/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';

import { formatAnswers, KEY_MAPPING } from '@/lib/questionnaireFormatter';
import type { DbWorldKey, FormattedAnswersType } from '@/lib/questionnaireFormatter';
import type { WorldId, UpdateValue } from '@/types/next-auth';

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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!questionnaireResponse) {
       return NextResponse.json({ success: true, questionnaireResponse: null });
    }

    const formattedAnswers: Partial<FormattedAnswersType> = {};
    (Object.keys(KEY_MAPPING) as WorldId[]).forEach(worldKey => {
       const dbKey = KEY_MAPPING[worldKey];
       formattedAnswers[worldKey] = formatAnswers(questionnaireResponse[dbKey]);
    });

    const formattedResponse = {
      ...questionnaireResponse,
      formattedAnswers: formattedAnswers
    };

    const performingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!performingUser) {
      return NextResponse.json({ success: false, error: 'Performing user not found' }, { status: 404 });
    }
    const viewerIsAdminOrMatchmaker = performingUser.role === 'ADMIN' || performingUser.role === 'MATCHMAKER';

    if (!viewerIsAdminOrMatchmaker && userId !== session.user.id) {
        Object.keys(formattedResponse.formattedAnswers).forEach((worldKey) => {
            const key = worldKey as WorldId;
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
       worldKey: WorldId;
       questionId: string;
       value: UpdateValue;
     };

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