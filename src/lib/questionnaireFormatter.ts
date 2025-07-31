// src/lib/questionnaireFormatter.ts

import { Prisma } from "@prisma/client";
import { valuesQuestions } from "@/components/questionnaire/questions/values/valuesQuestions";
import { personalityQuestions } from "@/components/questionnaire/questions/personality/personalityQuestions";
import { relationshipQuestions } from "@/components/questionnaire/questions/relationship/relationshipQuestions";
import { partnerQuestions } from "@/components/questionnaire/questions/partner/partnerQuestions";
import { religionQuestions } from "@/components/questionnaire/questions/religion/religionQuestions";

// --- תיקון: ייבוא הטיפוסים מהמקור המרכזי והיחיד ---
import type { FormattedAnswer, WorldId } from "@/types/next-auth"; 

// Combine all questions into a single, memoized map for faster lookups
const allQuestionsMap = new Map(
  [
    ...valuesQuestions,
    ...personalityQuestions,
    ...relationshipQuestions,
    ...partnerQuestions,
    ...religionQuestions
  ].map(q => [q.id, q])
);

export type DbWorldKey =
  | 'valuesAnswers'
  | 'personalityAnswers'
  | 'relationshipAnswers'
  | 'partnerAnswers'
  | 'religionAnswers';

export const KEY_MAPPING: Record<WorldId, DbWorldKey> = {
  values: 'valuesAnswers',
  personality: 'personalityAnswers',
  relationship: 'relationshipAnswers',
  partner: 'partnerAnswers',
  religion: 'religionAnswers'
};

type JsonAnswerData = {
  questionId: string;
  value: Prisma.JsonValue;
  answeredAt: string;
  isVisible: boolean; // Changed from optional to required
};

export type FormattedAnswersType = Record<WorldId, FormattedAnswer[]>;

const valueTranslations: Record<string, string> = { yes: 'כן', no: 'לא' };

function getQuestionLabel(questionId: string): string {
  return allQuestionsMap.get(questionId)?.question || questionId;
}

function formatValue(value: Prisma.JsonValue): string {
  if (typeof value === 'boolean') return value ? 'כן' : 'לא';
  if (Array.isArray(value))
    return value
      .map((v) => valueTranslations[String(v)] || String(v))
      .join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
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

export function formatAnswers(
  answersJson: Prisma.JsonValue | null
): FormattedAnswer[] {
  const parsedAnswers = safeParseJson(answersJson);

  const formattedResult: FormattedAnswer[] = parsedAnswers.map((answer) => ({
    questionId: answer.questionId,
    question: getQuestionLabel(answer.questionId),
    answer: JSON.stringify(answer.value), // answer הוא הערך הגולמי, displayText הוא לתצוגה
    displayText: formatValue(answer.value),
    isVisible: answer.isVisible,
    answeredAt: new Date(answer.answeredAt), // כבר מומר ל-Date כאן
  }));

  return formattedResult.sort((a, b) =>
    a.questionId.localeCompare(b.questionId)
  );
}