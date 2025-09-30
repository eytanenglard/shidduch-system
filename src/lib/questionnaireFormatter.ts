// src/lib/questionnaireFormatter.ts

import { Prisma } from "@prisma/client";
import { valuesQuestions } from "@/components/questionnaire/questions/values/valuesQuestions";
import { personalityQuestions } from "@/components/questionnaire/questions/personality/personalityQuestions";
import { relationshipQuestions } from "@/components/questionnaire/questions/relationship/relationshipQuestions";
import { partnerQuestions } from "@/components/questionnaire/questions/partner/partnerQuestions";
import { religionQuestions } from "@/components/questionnaire/questions/religion/religionQuestions";
import type { Question } from '@/components/questionnaire/types/types';
import type { FormattedAnswer, WorldId } from "@/types/next-auth"; 

// איחוד כל השאלות למקור מידע אחד
const allQuestions: Question[] = [
  ...valuesQuestions,
  ...personalityQuestions,
  ...relationshipQuestions,
  ...partnerQuestions,
  ...religionQuestions
];
const allQuestionsMap = new Map(allQuestions.map(q => [q.id, q]));

export type DbWorldKey =
  | 'valuesAnswers'
  | 'personalityAnswers'
  | 'relationshipAnswers'
  | 'partnerAnswers'
  | 'religionAnswers';

export const KEY_MAPPING: Record<WorldId, DbWorldKey> = {
  VALUES: 'valuesAnswers',
  PERSONALITY: 'personalityAnswers',
  RELATIONSHIP: 'relationshipAnswers',
  PARTNER: 'partnerAnswers',
  RELIGION: 'religionAnswers'
};

type JsonAnswerData = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible: boolean;
};

export type FormattedAnswersType = Record<WorldId, FormattedAnswer[]>;

const valueTranslations: Record<string, string> = { yes: 'כן', no: 'לא' };

function formatValue(value: Prisma.JsonValue): string {
  if (value === null || value === undefined) return 'לא נענה';
  if (typeof value === 'boolean') return value ? 'כן' : 'לא';
  if (Array.isArray(value))
    return value
      .map((v) => valueTranslations[String(v)] || String(v))
      .join(', ');
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ');
  }
  const stringValue = String(value);
  return valueTranslations[stringValue] || stringValue;
}

function isValidAnswerObject(
  item: Prisma.JsonValue
): item is Prisma.JsonObject & {
  questionId: unknown;
  value: Prisma.JsonValue;
  answeredAt: unknown;
  isVisible?: unknown;
} {
  return (
    typeof item === 'object' &&
    item !== null &&
    'questionId' in item &&
    'value' in item &&
    'answeredAt' in item
  );
}

function safeParseJson(jsonValue: Prisma.JsonValue | null): JsonAnswerData[] {
  if (Array.isArray(jsonValue)) {
    return jsonValue.filter(isValidAnswerObject).map((item) => ({
      questionId: String(item.questionId),
      value: item.value,
      answeredAt: String(item.answeredAt),
      isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
    }));
  }
  return [];
}

/**
 * הפונקציה המרכזית והמתוקנת: מקבלת תשובות גולמיות ומחזירה מערך מעוצב עם כל המידע.
 */
export function formatAnswers(
  answersJson: Prisma.JsonValue | null
): FormattedAnswer[] {
  const parsedAnswers = safeParseJson(answersJson);

  const formattedResult: FormattedAnswer[] = parsedAnswers.map((answer) => {
    const fullQuestion = allQuestionsMap.get(answer.questionId);

    // --- START: התיקון המרכזי ---
    return {
      questionId: answer.questionId,
      question: fullQuestion?.question || answer.questionId,
      questionType: fullQuestion?.type || 'unknown', // <-- הוספנו את סוג השאלה
      rawValue: answer.value, // <-- הוספנו את הערך הגולמי
      displayText: formatValue(answer.value),
      isVisible: answer.isVisible,
      answeredAt: new Date(answer.answeredAt),
    };
    // --- END: התיקון המרכזי ---
  });

  return formattedResult.sort((a, b) =>
    a.questionId.localeCompare(b.questionId)
  );
}