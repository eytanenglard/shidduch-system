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

const profileDictionaries = {
  en: () => import('../../dictionaries/profile/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/profile/he.json').then((module) => module.default),
};

const matchmakerDictionaries = {
  en: () => import('../../dictionaries/matchmaker/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/matchmaker/he.json').then((module) => module.default),
};

// --- START: הוספת טוען למילון האימות ---
const authDictionaries = {
  en: () => import('../../dictionaries/auth/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/auth/he.json').then((module) => module.default),
};
// --- END: הוספת טוען למילון האימות ---

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // --- START: עדכון Promise.all ---
  const [main, suggestions, questionnaire, profilePage, matchmakerPage, auth] = await Promise.all([
    mainDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
    questionnaireDictionaries[targetLocale](),
    profileDictionaries[targetLocale](),
    matchmakerDictionaries[targetLocale](),
    authDictionaries[targetLocale](), // הוספת טעינת מילון האימות
  ]);
  // --- END: עדכון Promise.all ---

  // --- START: עדכון האובייקט המוחזר ---
  return {
    ...main,
    suggestions,
    questionnaire,
    profilePage,
    matchmakerPage,
    auth, // הוספת מפתח האימות
  } as Dictionary;
  // --- END: עדכון האובייקט המוחזר ---
};