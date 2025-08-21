import 'server-only';
import type { Locale } from '../../i18n-config';
import type { Dictionary } from '@/types/dictionary';

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

// --- START: הוספת טוען למילוני הפרופיל ---
const profileDictionaries = {
  en: () => import('../../dictionaries/profile/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/profile/he.json').then((module) => module.default),
};
// --- END: הוספת טוען למילוני הפרופיל ---

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // --- START: עדכון Promise.all לכלול את מילון הפרופיל ---
  const [main, suggestions, questionnaire, profilePage] = await Promise.all([
    mainDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
    questionnaireDictionaries[targetLocale](),
    profileDictionaries[targetLocale](), // טעינת המילון החדש
  ]);
  // --- END: עדכון Promise.all ---

  // איחוד כל המילונים לאובייקט אחד
  return {
    ...main,
    suggestions,
    questionnaire,
    profilePage, // הוספת מפתח הפרופיל
  } as Dictionary;
};