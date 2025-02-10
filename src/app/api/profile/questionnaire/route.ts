import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { valuesQuestionsPartOne } from "@/components/questionnaire/questions/values/valuesQuestionsPartOne";
import { valuesQuestionsPartTwo } from "@/components/questionnaire/questions/values/valuesQuestionsPartTwo"; 
import { personalityQuestionsPartOne } from "@/components/questionnaire/questions/personality/personalityQuestionsPartOne";
import { personalityQuestionsPartTwo } from "@/components/questionnaire/questions/personality/personalityQuestionsPartTwo";
import { relationshipBasicsQuestions } from "@/components/questionnaire/questions/relationship/relationshipBasicsQuestions";
import { relationshipDepthQuestions } from "@/components/questionnaire/questions/relationship/relationshipDepthQuestions";
import { partnerBasicQuestions } from "@/components/questionnaire/questions/partner/partnerBasicQuestions";
import { partnerDepthQuestions } from "@/components/questionnaire/questions/partner/partnerDepthQuestions";
import { faithQuestions } from "@/components/questionnaire/questions/religion/faithQuestions";
import { practicalQuestions } from "@/components/questionnaire/questions/religion/practicalReligionQuestions";

// Combine all questions into a single array
const allQuestions = [
  ...valuesQuestionsPartOne,
  ...valuesQuestionsPartTwo,
  ...personalityQuestionsPartOne,
  ...personalityQuestionsPartTwo,
  ...relationshipBasicsQuestions,
  ...relationshipDepthQuestions,
  ...partnerBasicQuestions,
  ...partnerDepthQuestions,
  ...faithQuestions,
  ...practicalQuestions
];

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
};

function getQuestionLabel(questionId: string): string {
  const question = allQuestions.find(q => q.id === questionId);
  return question?.question || questionId;
}

function getQuestionCategory(questionId: string): string {
  const question = allQuestions.find(q => q.id === questionId);
  return question?.category || '';
}

function formatValue(value: Prisma.JsonValue): string {
  if (typeof value === 'boolean') {
    return value ? 'כן' : 'לא';
  }
  
  if (Array.isArray(value)) {
    return value.map(v => valueTranslations[String(v)] || String(v)).join(', ');
  }
  
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  
  const stringValue = String(value);
  return valueTranslations[stringValue] || stringValue;
}

function safeParseJson(value: any): JsonAnswerData[] {
  if (Array.isArray(value)) {
    return value.map(item => ({
      questionId: item.questionId,
      value: item.value,
      answeredAt: item.answeredAt,
      isVisible: item.isVisible ?? true
    }));
  }
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
      category,
      isVisible: answer.isVisible,
      answeredAt: new Date(answer.answeredAt).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    };
  }).sort((a, b) => a.questionId.localeCompare(b.questionId));
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
      return NextResponse.json({
        success: true,
        questionnaireResponse: null
      });
    }

    // Create formatted answers with correct typing
    const formattedAnswers: Partial<FormattedAnswersType> = {};
    
    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach(worldKey => {
      const dbKey = getDbKey(worldKey);
      formattedAnswers[worldKey] = formatAnswers(questionnaireResponse[dbKey]);
    });

    const formattedResponse = {
      ...Response,
      formattedAnswers: formattedAnswers as FormattedAnswersType
    };

    // Filter out non-visible answers for other users
    if (userId !== session.user.id) {
      Object.keys(formattedResponse.formattedAnswers).forEach((worldKey) => {
        const key = worldKey as WorldKey;
        formattedResponse.formattedAnswers[key] = 
          formattedResponse.formattedAnswers[key].filter(answer => answer.isVisible !== false);
      });
    }

    return NextResponse.json({
      success: true,
      questionnaireResponse: formattedResponse
    });

  } catch (error) {
    console.error('Error in GET:', error);
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
      value: UpdateData;
    };

    const dbKey = getDbKey(worldKey);

    const questionnaire = await prisma.questionnaireResponse.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!questionnaire) {
      return NextResponse.json({ success: false, error: "שאלון לא נמצא" }, { status: 404 });
    }

    const currentAnswers = (questionnaire[dbKey] as JsonAnswerData[]) || [];
    const existingAnswer = currentAnswers.find((a) => a.questionId === questionId);

    let updatedAnswer: JsonAnswerData;

    if (value.type === 'visibility') {
      if (!existingAnswer) {
        throw new Error("לא נמצאה תשובה לעדכון");
      }
      
      updatedAnswer = {
        ...existingAnswer,
        isVisible: value.isVisible,
        answeredAt: new Date().toISOString()
      };
    } else {
      updatedAnswer = {
        questionId,
        value: value.value as string,
        isVisible: existingAnswer?.isVisible ?? true,
        answeredAt: new Date().toISOString()
      };
    }

    const updatedAnswers = [
      ...currentAnswers.filter((a) => a.questionId !== questionId),
      updatedAnswer
    ];

    const updated = await prisma.questionnaireResponse.update({
      where: { id: questionnaire.id },
      data: {
        [dbKey]: updatedAnswers,
        lastSaved: new Date()
      }
    });

    // Create formatted answers with correct typing
    const formattedAnswers: Partial<FormattedAnswersType> = {};
    
    (Object.keys(KEY_MAPPING) as WorldKey[]).forEach(key => {
      const dbKey = getDbKey(key);
      formattedAnswers[key] = formatAnswers(updated[dbKey]);
    });

    const formattedResponse = {
      ...updated,
      formattedAnswers: formattedAnswers as FormattedAnswersType
    };

    return NextResponse.json({
      success: true,
      data: formattedResponse
    });

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "שגיאה בעדכון השאלון" }, { status: 500 });
  }
}