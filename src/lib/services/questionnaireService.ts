// src/lib/services/questionnaireService.ts

import 'server-only';
import { Prisma } from '@prisma/client';
import type { Locale } from '../../../i18n-config';
import { getQuestionnaireQuestionsDictionary } from '@/lib/dictionaries';
import {
  FormattedAnswer,
  QuestionnaireResponse,
} from '@/types/next-auth';
import { Question, WorldId } from '@/components/questionnaire/types/types';

// ייבוא מבני השאלות המקוריים
import { personalityQuestions } from '@/components/questionnaire/questions/personality/personalityQuestions';
import { valuesQuestions } from '@/components/questionnaire/questions/values/valuesQuestions';
import { relationshipQuestions } from '@/components/questionnaire/questions/relationship/relationshipQuestions';
import { partnerQuestions } from '@/components/questionnaire/questions/partner/partnerQuestions';
import { religionQuestions } from '@/components/questionnaire/questions/religion/religionQuestions';

// מיפוי מבני השאלות
const allQuestionStructures: Record<WorldId, Question[]> = {
  PERSONALITY: personalityQuestions,
  VALUES: valuesQuestions,
  RELATIONSHIP: relationshipQuestions,
  PARTNER: partnerQuestions,
  RELIGION: religionQuestions,
};

/**
 * פונקציה זו מעצבת את תשובות השאלון הגולמיות לתצוגה,
 * תוך יישום לוגיקת תרגום דינמית בהתאם לשפת הצופה.
 * @param questionnaireResponse - אובייקט השאלון הגולמי ממסד הנתונים.
 * @param viewerLocale - שפת הממשק של המשתמש הצופה בפרופיל.
 * @returns אובייקט QuestionnaireResponse עם שדה 'formattedAnswers' מעוצב.
 */
export async function formatQuestionnaireForDisplay(
  questionnaireResponse: QuestionnaireResponse,
  viewerLocale: Locale
): Promise<QuestionnaireResponse> {
  const questionsDict = await getQuestionnaireQuestionsDictionary(viewerLocale);

  const formattedAnswers: { [key: string]: FormattedAnswer[] } = {};
  const worlds: WorldId[] = ['PERSONALITY', 'VALUES', 'RELATIONSHIP', 'PARTNER', 'RELIGION'];

  for (const world of worlds) {
    const worldKey = `${world.toLowerCase()}Answers` as keyof QuestionnaireResponse;
    const rawAnswers = (questionnaireResponse[worldKey] as Prisma.JsonArray) || [];
    
    if (!Array.isArray(rawAnswers)) continue;

    formattedAnswers[world] = rawAnswers
      .map((rawAns: any): FormattedAnswer | null => {
        const questionStructure = allQuestionStructures[world].find(q => q.id === rawAns.questionId);
        if (!questionStructure) return null;

        const questionContent = questionsDict[world]?.[rawAns.questionId];
        if (!questionContent) return null;

        let displayText = 'N/A';
        
        // כלל מס' 2: טיפול בשאלות פתוחות
        if (questionStructure.type === 'openText' && typeof rawAns.value === 'object' && rawAns.value?.text) {
          displayText = rawAns.value.text; // הצג תמיד את הטקסט המקורי
        } 
        // כלל מס' 1: טיפול בשאלות סגורות
        else if (typeof rawAns.value === 'string' && questionContent.options?.[rawAns.value]) {
          // בחירה יחידה
          displayText = questionContent.options[rawAns.value];
        } else if (Array.isArray(rawAns.value)) {
          // רב-ברירתי
          displayText = rawAns.value
            .map(val => questionContent.options?.[val] || val.replace('custom:', ''))
            .join(', ');
        } else if (typeof rawAns.value === 'number' && questionStructure.type === 'scale') {
            // סולם דירוג
            displayText = `${rawAns.value} / ${questionStructure.max || 10}`;
        } else if (typeof rawAns.value === 'object' && !Array.isArray(rawAns.value) && questionStructure.type === 'budgetAllocation') {
            // הקצאת תקציב
            displayText = Object.entries(rawAns.value)
              .map(([key, val]) => `${questionContent.categories?.[key]?.label || key}: ${val}%`)
              .join(' | ');
        }
        
        return {
          questionId: rawAns.questionId,
          question: questionContent.question,
          questionType: questionStructure.type,
          rawValue: rawAns.value, // שומרים את הערך המקורי (בין אם key או אובייקט)
          displayText,
          isVisible: rawAns.isVisible ?? true,
          answeredAt: rawAns.answeredAt,
        };
      })
     .filter((ans): ans is FormattedAnswer => ans !== null && ans.isVisible === true); // סנן רק תשובות שהן במפורש גלויות
  }

  return {
    ...questionnaireResponse,
    formattedAnswers,
  };
}