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

// Importowanie oryginalnych struktur pytań
import { personalityQuestions } from '@/components/questionnaire/questions/personality/personalityQuestions';
import { valuesQuestions } from '@/components/questionnaire/questions/values/valuesQuestions';
import { relationshipQuestions } from '@/components/questionnaire/questions/relationship/relationshipQuestions';
import { partnerQuestions } from '@/components/questionnaire/questions/partner/partnerQuestions';
import { religionQuestions } from '@/components/questionnaire/questions/religion/religionQuestions';

// Mapowanie struktur pytań
const allQuestionStructures: Record<WorldId, Question[]> = {
  PERSONALITY: personalityQuestions,
  VALUES: valuesQuestions,
  RELATIONSHIP: relationshipQuestions,
  PARTNER: partnerQuestions,
  RELIGION: religionQuestions,
};

/**
 * פונקציה זו מעצבת את התשובות הגולמיות מהשאלון לתצוגה,
 * תוך שימוש בלוגיקת תרגום דינמית בהתאם לשפת הצופה.
 * @param questionnaireResponse - אובייקט השאלון הגולמי ממסד הנתונים.
 * @param viewerLocale - שפת הממשק של המשתמש הצופה בפרופיל.
 * @returns אובייקט QuestionnaireResponse עם שדה 'formattedAnswers' מעוצב ומתורגם.
 */
export async function formatQuestionnaireForDisplay(
  questionnaireResponse: QuestionnaireResponse,
  viewerLocale: Locale,
   canViewAll: boolean // <-- הוספת הפרמטר החדש

): Promise<QuestionnaireResponse> {
  console.log('---[ SERVER LOG | questionnaireService ]--- מתחיל עיבוד תשובות עבור שפה:', viewerLocale);

  // טעינת מילון התרגומים המתאים לשפת הצפייה
  const questionsDict = await getQuestionnaireQuestionsDictionary(viewerLocale);

  const formattedAnswers: { [key: string]: FormattedAnswer[] } = {};
  const worlds: WorldId[] = ['PERSONALITY', 'VALUES', 'RELATIONSHIP', 'PARTNER', 'RELIGION'];

  for (const world of worlds) {
    const worldKey = `${world.toLowerCase()}Answers` as keyof QuestionnaireResponse;
    const rawAnswers = (questionnaireResponse[worldKey] as Prisma.JsonArray) || [];
    
    console.log(`---[ SERVER LOG | questionnaireService ]--- מעבד את עולם "${world}". נמצאו ${Array.isArray(rawAnswers) ? rawAnswers.length : 0} תשובות גולמיות.`);
    
    if (!Array.isArray(rawAnswers)) continue;

    formattedAnswers[world] = rawAnswers
      .map((rawAns: any): FormattedAnswer | null => {
        // ולידציה בסיסית של מבנה התשובה
        if (typeof rawAns !== 'object' || rawAns === null || !rawAns.questionId) {
            console.warn(`---[ SERVER LOG | questionnaireService ]--- מדלג על רשומת תשובה לא תקינה בעולם "${world}":`, rawAns);
            return null;
        }

        // איתור מבנה השאלה המקורי (מכיל הגדרות כמו type, totalPoints וכו')
        const questionStructure = allQuestionStructures[world].find(q => q.id === rawAns.questionId);
        if (!questionStructure) {
            console.warn(`---[ SERVER LOG | questionnaireService ]--- לא נמצאה הגדרת מבנה עבור שאלה עם ID "${rawAns.questionId}" בעולם "${world}".`);
            return null;
        }

        // איתור התרגומים עבור השאלה הספציפית מהמילון שנטען
        const questionContent = questionsDict[world]?.[rawAns.questionId];
        if (!questionContent || !questionContent.question) {
            console.warn(`---[ SERVER LOG | questionnaireService ]--- חסר תוכן במילון עבור שאלה עם ID "${rawAns.questionId}" בעולם "${world}".`);
            return null;
        }

        let displayText = 'לא נענה';
        
        // --- לוגיקת עיצוב התשובות לפי סוג השאלה ---

        if (questionStructure.type === 'openText' && typeof rawAns.value === 'object' && rawAns.value?.text) {
          // שאלת טקסט פתוח (עם תמיכה בשפה)
          displayText = rawAns.value.text;
        
        } else if (typeof rawAns.value === 'string' && questionContent.options?.[rawAns.value]) {
          // שאלת בחירה יחידה
          const optionContent = questionContent.options[rawAns.value];
          displayText = typeof optionContent === 'string' ? optionContent : optionContent.text;
        
        } else if (Array.isArray(rawAns.value)) {
          // שאלת בחירה מרובה
          displayText = rawAns.value
            .map(val => {
                const optionContent = questionContent.options?.[val];
                if (optionContent) {
                    return typeof optionContent === 'string' ? optionContent : optionContent.text;
                }
                if (typeof val === 'string' && val.startsWith('custom:')) {
                    return val.replace('custom:', '');
                }
                return val;
            })
            .join(', ');
        
        } else if (typeof rawAns.value === 'number' && questionStructure.type === 'scale') {
            // שאלת סולם
            displayText = `${rawAns.value} / ${questionStructure.max || 10}`;
        
        } else if (typeof rawAns.value === 'object' && !Array.isArray(rawAns.value) && rawAns.value !== null && questionStructure.type === 'budgetAllocation') {
            // #############################################################
            // # START: *** התיקון המרכזי והסופי לשאלות תקציב ***
            // #############################################################
            displayText = Object.entries(rawAns.value as Record<string, number>)
              .map(([key, val]) => {
                  // 1. שלוף את התרגום עבור המפתח (למשל, 'family_connections') מתוך המילון שנטען
                  const translatedLabel = questionContent.categories?.[key];

                  // 2. השתמש בתרגום אם נמצא, אחרת חזור למפתח המקורי באנגלית (כגיבוי)
                  const finalLabel = translatedLabel || key;

                  // 3. קבע את יחידת המידה: אם מוגדר `totalPoints`, אלו נקודות ולא אחוזים
                  const unit = questionStructure.totalPoints ? '' : '%';
                  
                  // 4. הרכב את הטקסט הסופי לתצוגה
                  return `${finalLabel}: ${val}${unit}`;
              })
              .join(' | '); // הפרדה ברורה בין הפריטים
            // #############################################################
            // # END: *** התיקון המרכזי והסופי לשאלות תקציב ***
            // #############################################################
        
        } else if (rawAns.value !== null && rawAns.value !== undefined) {
          // גיבוי כללי לכל מקרה אחר
          displayText = String(rawAns.value);
        }
        
        return {
          questionId: rawAns.questionId,
          question: questionContent.question,
          questionType: questionStructure.type,
          rawValue: rawAns.value,
          displayText,
          isVisible: rawAns.isVisible ?? true,
          answeredAt: rawAns.answeredAt,
        };
      })
      .filter((ans): ans is FormattedAnswer => ans !== null);
  }

// סינון תשובות שאינן גלויות (isVisible: false)
// יתבצע רק אם הצופה הוא לא הבעלים של הפרופיל.
  if (!canViewAll) { // <-- שימוש בשם החדש
    console.log('---[ SERVER LOG | questionnaireService ]--- מבצע סינון תשובות מוסתרות עבור צופה ללא הרשאה.');
    for (const world in formattedAnswers) {
        formattedAnswers[world] = formattedAnswers[world].filter(ans => ans.isVisible === true);
    }
  } else {
    console.log('---[ SERVER LOG | questionnaireService ]--- מדלג על סינון תשובות. לצופה יש הרשאה לראות הכל.');
  }


  console.log('---[ SERVER LOG | questionnaireService ]--- העיבוד הסתיים. מבנה הנתונים המעוצב:', JSON.stringify(formattedAnswers, null, 2));

  return {
    ...questionnaireResponse,
    formattedAnswers,
  };
}