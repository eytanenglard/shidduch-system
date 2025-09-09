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
 * Ta funkcja formatuje surowe odpowiedzi z kwestionariusza do wyświetlenia,
 * stosując dynamiczną logikę tłumaczenia w zależności od języka przeglądającego.
 * @param questionnaireResponse - Surowy obiekt kwestionariusza z bazy danych.
 * @param viewerLocale - Język interfejsu użytkownika przeglądającego profil.
 * @returns Obiekt QuestionnaireResponse ze sformatowanym polem 'formattedAnswers'.
 */
export async function formatQuestionnaireForDisplay(
  questionnaireResponse: QuestionnaireResponse,
  viewerLocale: Locale
): Promise<QuestionnaireResponse> {
  console.log('---[ SERVER LOG | questionnaireService ]--- Rozpoczęcie przetwarzania odpowiedzi dla języka:', viewerLocale);

  const questionsDict = await getQuestionnaireQuestionsDictionary(viewerLocale);

  const formattedAnswers: { [key: string]: FormattedAnswer[] } = {};
  const worlds: WorldId[] = ['PERSONALITY', 'VALUES', 'RELATIONSHIP', 'PARTNER', 'RELIGION'];

  for (const world of worlds) {
    const worldKey = `${world.toLowerCase()}Answers` as keyof QuestionnaireResponse;
    const rawAnswers = (questionnaireResponse[worldKey] as Prisma.JsonArray) || [];
    
    console.log(`---[ SERVER LOG | questionnaireService ]--- Przetwarzanie świata "${world}". Znaleziono ${Array.isArray(rawAnswers) ? rawAnswers.length : 0} surowych odpowiedzi.`);
    
    if (!Array.isArray(rawAnswers)) continue;

    formattedAnswers[world] = rawAnswers
      .map((rawAns: any): FormattedAnswer | null => {
        // Upewnij się, że rawAns jest obiektem i ma questionId
        if (typeof rawAns !== 'object' || rawAns === null || !rawAns.questionId) {
            console.warn(`---[ SERVER LOG | questionnaireService ]--- Pomijanie nieprawidłowego wpisu odpowiedzi w świecie "${world}":`, rawAns);
            return null;
        }

        const questionStructure = allQuestionStructures[world].find(q => q.id === rawAns.questionId);
        if (!questionStructure) {
            console.warn(`---[ SERVER LOG | questionnaireService ]--- Nie znaleziono struktury dla pytania ID "${rawAns.questionId}" w świecie "${world}".`);
            return null;
        }

        const questionContent = questionsDict[world]?.[rawAns.questionId];
        if (!questionContent || !questionContent.question) {
            console.warn(`---[ SERVER LOG | questionnaireService ]--- Brak treści w słowniku dla pytania ID "${rawAns.questionId}" w świecie "${world}".`);
            return null;
        }

        let displayText = 'N/A';
        
        // Zasada nr 2: Obsługa pytań otwartych
        if (questionStructure.type === 'openText' && typeof rawAns.value === 'object' && rawAns.value?.text) {
          displayText = rawAns.value.text; // Zawsze wyświetlaj oryginalny tekst
        } 
        // Zasada nr 1: Obsługa pytań zamkniętych
        else if (typeof rawAns.value === 'string' && questionContent.options?.[rawAns.value]) {
          // Pojedynczy wybór
          const optionContent = questionContent.options[rawAns.value];
          displayText = typeof optionContent === 'string' ? optionContent : optionContent.text;
        } else if (Array.isArray(rawAns.value)) {
          // Wielokrotny wybór
          displayText = rawAns.value
            .map(val => {
                const optionContent = questionContent.options?.[val];
                if (optionContent) {
                    return typeof optionContent === 'string' ? optionContent : optionContent.text;
                }
                // Obsługa opcji "inne"
                if (typeof val === 'string' && val.startsWith('custom:')) {
                    return val.replace('custom:', '');
                }
                return val;
            })
            .join(', ');
        } else if (typeof rawAns.value === 'number' && questionStructure.type === 'scale') {
            // Skala ocen
            displayText = `${rawAns.value} / ${questionStructure.max || 10}`;
        } else if (typeof rawAns.value === 'object' && !Array.isArray(rawAns.value) && rawAns.value !== null && questionStructure.type === 'budgetAllocation') {
            // Alokacja budżetu
            displayText = Object.entries(rawAns.value)
              .map(([key, val]) => {
                  const categoryContent = questionContent.categories?.[key];
                  const label = categoryContent ? (typeof categoryContent === 'string' ? categoryContent : categoryContent.label) : key;
                  return `${label}: ${val}%`;
              })
              .join(' | ');
        } else if (rawAns.value !== null && rawAns.value !== undefined) {
          // Fallback na wypadek, gdyby wartość nie została sformatowana
          displayText = String(rawAns.value);
        }
        
        return {
          questionId: rawAns.questionId,
          question: questionContent.question,
          questionType: questionStructure.type,
          rawValue: rawAns.value, // Zapisujemy oryginalną wartość (czy to klucz, czy obiekt)
          displayText,
          isVisible: rawAns.isVisible ?? true,
          answeredAt: rawAns.answeredAt,
        };
      })
      .filter((ans): ans is FormattedAnswer => ans !== null); // Najpierw filtruj nullowe, a potem isVisible
  }

  // Drugi etap filtrowania dla isVisible, aby uniknąć błędów
  for (const world in formattedAnswers) {
      formattedAnswers[world] = formattedAnswers[world].filter(ans => ans.isVisible === true);
  }


  console.log('---[ SERVER LOG | questionnaireService ]--- Przetwarzanie zakończone. Sformatowana struktura danych:', JSON.stringify(formattedAnswers, null, 2));

  return {
    ...questionnaireResponse,
    formattedAnswers,
  };
}