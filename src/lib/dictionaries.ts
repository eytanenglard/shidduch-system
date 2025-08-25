// src/lib/dictionaries.ts

import 'server-only';
import type { Locale } from '../../i18n-config';
import type { Dictionary, QuestionnaireDictionary } from '@/types/dictionary';

// --- Main dictionary loaders for each module ---

const mainDictionaries = {
  en: () => import('../../dictionaries/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/he.json').then((module) => module.default),
};

const suggestionsDictionaries = {
  en: () => import('../../dictionaries/suggestions/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/suggestions/he.json').then((module) => module.default),
};

const questionnaireDictionaries = {
  en: () => import('../../dictionaries/questionnaire/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/questionnaire/he.json').then((module) => module.default),
};

// --- START: הוספת טוען עבור מילון השאלות החדש ---
const questionnaireQuestionsDictionaries = {
  en: () => import('../../dictionaries/questionnaire/questions.en.json').then((module) => module.default),
  he: () => import('../../dictionaries/questionnaire/questions.he.json').then((module) => module.default),
};
// --- END: הוספת טוען עבור מילון השאלות החדש ---

const profileDictionaries = {
  en: () => import('../../dictionaries/profile/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/profile/he.json').then((module) => module.default),
};

const matchmakerDictionaries = {
  en: () => import('../../dictionaries/matchmaker/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/matchmaker/he.json').then((module) => module.default),
};

const authDictionaries = {
  en: () => import('../../dictionaries/auth/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/auth/he.json').then((module) => module.default),
};

/**
 * Loads all dictionary modules for a given locale and assembles them into a single object.
 * @param locale The locale to load ('en' or 'he').
 * @returns A promise that resolves to the complete, structured dictionary object.
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  // Fallback to Hebrew if the requested locale is not available
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // --- START: עדכון Promise.all לטעינת כל המודולים הראשיים ---
  const [main, suggestions, questionnaireBase, profilePage, matchmakerPage, auth] = await Promise.all([
    mainDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
    questionnaireDictionaries[targetLocale](),
    profileDictionaries[targetLocale](),
    matchmakerDictionaries[targetLocale](),
    authDictionaries[targetLocale](),
  ]);
  // --- END: עדכון Promise.all ---

  // --- START: טעינה נפרדת של מילון השאלות ושילובו ---
  // Load the specific questions dictionary
  const questionsContent = await questionnaireQuestionsDictionaries[targetLocale]();

  // Create the complete questionnaire dictionary by merging the base with the questions content
  const questionnaire: QuestionnaireDictionary = {
    ...(questionnaireBase as Omit<QuestionnaireDictionary, 'questions'>),
    questions: questionsContent,
  };
  // --- END: טעינה נפרדת של מילון השאלות ושילובו ---

  // --- START: עדכון האובייקט המוחזר כך שיכלול את כל המודולים ---
  // Assemble the final, complete dictionary object
  return {
    ...main,
    suggestions,
    questionnaire, // This now correctly contains the nested 'questions' object
    profilePage,
    matchmakerPage,
    auth,
  } as Dictionary;
  // --- END: עדכון האובייקט המוחזר ---
};