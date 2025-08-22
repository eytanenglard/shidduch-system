// src/lib/dictionaries.ts

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

// --- START: הוספת טוען למילוני הפרופיל (שלב 1) ---
const profileDictionaries = {
  en: () => import('../../dictionaries/profile/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/profile/he.json').then((module) => module.default),
};
// --- END: הוספת טוען למילוני הפרופיל ---

/**
 * פונקציה אסינכרונית לקבלת המילון המלא עבור שפה ספציפית,
 * המורכב ממספר קבצי JSON.
 * @param locale - קוד השפה ('he' או 'en')
 * @returns {Promise<Dictionary>}
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // --- START: עדכון Promise.all (שלב 2) ---
  const [main, suggestions, questionnaire, profilePage] = await Promise.all([
    mainDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
    questionnaireDictionaries[targetLocale](),
    profileDictionaries[targetLocale](), // הוספת טעינת מילון הפרופיל
  ]);
  // --- END: עדכון Promise.all ---

  // --- START: עדכון האובייקט המוחזר (שלב 3) ---
  // מאחדים את כל המילונים לאובייקט אחד שתואם ל-Dictionary
  return {
    ...main,
    suggestions,
    questionnaire,
    profilePage, // הוספת מפתח הפרופיל החסר
  } as Dictionary;
  // --- END: עדכון האובייקט המוחזר ---
};