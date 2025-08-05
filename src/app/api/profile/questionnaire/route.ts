// src/app/api/profile/questionnaire/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { updateUserAiProfile } from '@/lib/services/profileAiService';

import { valuesQuestions } from '@/components/questionnaire/questions/values/valuesQuestions';
import { personalityQuestions } from '@/components/questionnaire/questions/personality/personalityQuestions';
import { relationshipQuestions } from '@/components/questionnaire/questions/relationship/relationshipQuestions';
import { partnerQuestions } from '@/components/questionnaire/questions/partner/partnerQuestions';
import { religionQuestions } from '@/components/questionnaire/questions/religion/religionQuestions';

const allQuestions = [
  ...valuesQuestions,
  ...personalityQuestions,
  ...relationshipQuestions,
  ...partnerQuestions,
  ...religionQuestions,
];

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

function getDbKey(worldKey: WorldKey): DbWorldKey {
  return KEY_MAPPING[worldKey];
}

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

interface FormattedAnswer {
  questionId: string;
  question: string;
  value: Prisma.JsonValue;
  displayText: string;
  answeredAt: string;
  category?: string;
  isVisible: boolean;
}

type FormattedAnswersType = Record<WorldKey, FormattedAnswer[]>;

const valueTranslations: Record<string, string> = {
  combat: 'קרבי',
  intelligence: 'אינטליגנציה',
  stable: 'יציב',
  yes: 'כן',
  no: 'לא',
  religious: 'דתי',
  traditional: 'מסורתי',
  secular: 'חילוני',
  male: 'גבר',
  female: 'אישה',
  both: 'שניהם',
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

function getQuestionLabel(questionId: string): string {
  const question = allQuestions.find((q) => q.id === questionId);
  return question?.question || questionId;
}

function getQuestionCategory(questionId: string): string {
  const question = allQuestions.find((q) => q.id === questionId);
  return question?.category || question?.worldId.toLowerCase() || '';
}

function formatValue(value: Prisma.JsonValue): string {
  if (typeof value === 'boolean') {
    return value ? 'כן' : 'לא';
  }

  if (Array.isArray(value)) {
    return value
      .map((v) => valueTranslations[String(v)] || String(v))
      .join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  const stringValue = String(value);
  return valueTranslations[stringValue] || stringValue;
}

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

function formatAnswers(answers: Prisma.JsonValue | null): FormattedAnswer[] {
  const parsedAnswers = safeParseJson(answers);

  return parsedAnswers
    .map((answer) => {
      const displayText = formatValue(answer.value);
      const category = getQuestionCategory(answer.questionId);

      return {
        questionId: answer.questionId,
        question: getQuestionLabel(answer.questionId),
        value: answer.value,
        displayText,
        category,
        isVisible: answer.isVisible,
        answeredAt: new Date(answer.answeredAt).toISOString(),
      };
    })
    .sort((a, b) => a.questionId.localeCompare(b.questionId));
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;

    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!questionnaireResponse) {
      return NextResponse.json({
        success: true,
        questionnaireResponse: null,
      });
    }

    const formattedAnswers: Partial<FormattedAnswersType> = {};

    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach((worldKey) => {
      const dbKey = getDbKey(worldKey);
      if (questionnaireResponse[dbKey]) {
        formattedAnswers[worldKey] = formatAnswers(
          questionnaireResponse[dbKey]
        );
      } else {
        formattedAnswers[worldKey] = [];
      }
    });

    const completeFormattedAnswers = formattedAnswers as FormattedAnswersType;

    const formattedResponse = {
      ...questionnaireResponse,
      formattedAnswers: completeFormattedAnswers,
    };

    if (userId !== session.user.id) {
      Object.keys(formattedResponse.formattedAnswers).forEach((worldKey) => {
        const key = worldKey as WorldKey;
        if (formattedResponse.formattedAnswers[key]) {
          formattedResponse.formattedAnswers[key] =
            formattedResponse.formattedAnswers[key].filter(
              (answer) => answer.isVisible !== false
            );
        }
      });
    }

    return NextResponse.json({
      success: true,
      questionnaireResponse: formattedResponse,
    });
  } catch (error) {
    console.error('Error in GET /api/profile/questionnaire:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questionnaire' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log(
        'PATCH /api/profile/questionnaire - Unauthorized: No session or user ID.'
      );
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    console.log(
      `PATCH /api/profile/questionnaire - Authorized for user: ${session.user.id}`
    );

    const body = await req.json();
    console.log(
      'PATCH /api/profile/questionnaire - Received body:',
      JSON.stringify(body, null, 2)
    );

    const receivedWorldKey = body.worldKey;
    const receivedQuestionId = body.questionId;
    const receivedValueObject = body.value;
    const receivedValueType = body.value?.type;

    const { worldKey, questionId, value } = body as {
      worldKey: WorldKey;
      questionId: string;
      value: UpdateData;
    };

    if (!worldKey || !questionId || !value || !value.type) {
      console.error(
        'PATCH /api/profile/questionnaire - Invalid request body. Validation failed. Details:',
        {
          rawReceivedBody: body,
          expectedWorldKey: worldKey,
          expectedQuestionId: questionId,
          expectedValueObject: value,
          isWorldKeyTruthyInBody: !!receivedWorldKey,
          isQuestionIdTruthyInBody: !!receivedQuestionId,
          isValueObjectTruthyInBody: !!receivedValueObject,
          isValueTypeTruthyInBody: !!receivedValueType,
        }
      );
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!KEY_MAPPING[worldKey]) {
      console.error(
        `PATCH /api/profile/questionnaire - Invalid world key: ${worldKey}`
      );
      return NextResponse.json(
        { success: false, error: 'Invalid world key' },
        { status: 400 }
      );
    }

    const dbKey = getDbKey(worldKey);

    console.log(
      `PATCH /api/profile/questionnaire - Processing update for worldKey: ${worldKey}, questionId: ${questionId}, dbKey: ${dbKey}, updateType: ${value.type}`
    );

    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!questionnaire) {
      console.error(
        `PATCH /api/profile/questionnaire - Questionnaire not found for user ID: ${session.user.id}`
      );
      return NextResponse.json(
        { success: false, error: 'שאלון לא נמצא' },
        { status: 404 }
      );
    }
    console.log(
      `PATCH /api/profile/questionnaire - Found questionnaire ID: ${questionnaire.id} for user.`
    );

    const currentAnswers = safeParseJson(questionnaire[dbKey]);
    const existingAnswerIndex = currentAnswers.findIndex(
      (a) => a.questionId === questionId
    );
    const existingAnswer =
      existingAnswerIndex !== -1 ? currentAnswers[existingAnswerIndex] : null;

    let updatedAnswer: JsonAnswerData;

    if (value.type === 'visibility') {
      console.log(
        `PATCH /api/profile/questionnaire - Handling 'visibility' update.`
      );
      if (!existingAnswer) {
        console.error(
          `PATCH /api/profile/questionnaire - Cannot update visibility for non-existent answer. Question ID: ${questionId}`
        );
        return NextResponse.json(
          { success: false, error: 'לא נמצאה תשובה לעדכון נראות' },
          { status: 404 }
        );
      }
      if (typeof value.isVisible !== 'boolean') {
        console.error(
          `PATCH /api/profile/questionnaire - Invalid visibility value: ${value.isVisible}. Must be boolean.`
        );
        return NextResponse.json(
          { success: false, error: 'ערך נראות לא תקין' },
          { status: 400 }
        );
      }
      updatedAnswer = {
        ...existingAnswer,
        isVisible: value.isVisible,
        answeredAt: new Date().toISOString(),
      };
      console.log(
        `PATCH /api/profile/questionnaire - Visibility updated for question ${questionId} to ${value.isVisible}.`
      );
    } else if (value.type === 'answer') {
      console.log(
        `PATCH /api/profile/questionnaire - Handling 'answer' update.`
      );
      if (value.value === undefined) {
        console.error(
          `PATCH /api/profile/questionnaire - Answer value is missing.`
        );
        return NextResponse.json(
          { success: false, error: 'ערך תשובה חסר' },
          { status: 400 }
        );
      }
      updatedAnswer = {
        questionId,
        value: value.value,
        isVisible: existingAnswer?.isVisible ?? true,
        answeredAt: new Date().toISOString(),
      };
      console.log(
        `PATCH /api/profile/questionnaire - Answer updated for question ${questionId}. New value (type ${typeof value.value}): ${JSON.stringify(value.value)}`
      );
    } else {
      console.error(
        `PATCH /api/profile/questionnaire - Invalid update type: ${value.type}`
      );
      return NextResponse.json(
        { success: false, error: 'סוג עדכון לא תקין' },
        { status: 400 }
      );
    }

    const updatedAnswers = [...currentAnswers];
    if (existingAnswerIndex !== -1) {
      updatedAnswers[existingAnswerIndex] = updatedAnswer;
    } else if (value.type === 'answer') {
      updatedAnswers.push(updatedAnswer);
      console.log(
        `PATCH /api/profile/questionnaire - New answer added for question ${questionId}.`
      );
    } else if (value.type === 'visibility' && existingAnswerIndex === -1) {
      console.error(
        `PATCH /api/profile/questionnaire - Logic error: Trying to update visibility for a new answer that wasn't added.`
      );
      return NextResponse.json(
        { success: false, error: 'שגיאה לוגית בעדכון נראות' },
        { status: 500 }
      );
    }

    console.log(
      `PATCH /api/profile/questionnaire - Attempting to update database with new answers for dbKey ${dbKey}.`
    );
    const updated = await prisma.questionnaireResponse.update({
      where: { id: questionnaire.id },
      data: {
        [dbKey]: updatedAnswers as Prisma.JsonValue,
        lastSaved: new Date(),
      },
    });

    updateUserAiProfile(userId).catch((err) => {
      console.error(
        `[AI Profile Trigger - Questionnaire Update] Failed to update AI profile in the background for user ${userId}:`,
        err
      );
    });

    console.log(
      `PATCH /api/profile/questionnaire - Database update successful for questionnaire ID: ${updated.id}.`
    );

    const formattedAnswers: Partial<FormattedAnswersType> = {};
    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach((key) => {
      const currentDbKey = getDbKey(key);
      if (updated[currentDbKey]) {
        formattedAnswers[key] = formatAnswers(updated[currentDbKey]);
      } else {
        formattedAnswers[key] = [];
      }
    });

    const completeFormattedAnswers = formattedAnswers as FormattedAnswersType;

    const formattedResponse = {
      ...updated,
      formattedAnswers: completeFormattedAnswers,
    };

    console.log(
      'PATCH /api/profile/questionnaire - Update process completed successfully. Returning formatted response.'
    );
    return NextResponse.json({
      success: true,
      data: formattedResponse,
    });
  } catch (error) {
    console.error('FATAL Error in PATCH /api/profile/questionnaire:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Details:', {
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion,
      });
      return NextResponse.json(
        { success: false, error: 'שגיאת מסד נתונים' },
        { status: 500 }
      );
    }
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error('JSON Parsing Error in PATCH request body:', error.message);
      return NextResponse.json(
        { success: false, error: 'גוף הבקשה אינו JSON תקין' },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון השאלון' },
      { status: 500 }
    );
  }
}
