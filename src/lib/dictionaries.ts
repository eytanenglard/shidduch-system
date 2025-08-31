// src/lib/dictionaries.ts

import 'server-only';
import type { Locale } from '../../i18n-config';
import type { 
  Dictionary, 
  QuestionnaireDictionary, 
  AuthDictionary, 
  EmailDictionary
} from '@/types/dictionary';

// --- הגדרת טוענים (Loaders) עבור כל מודול של המילון ---
// כל טוען הוא אובייקט המכיל פונקציות ייבוא דינמיות עבור כל שפה נתמכת.
// גישה זו מבטיחה שנטען רק את קבצי השפה הנדרשים (Code Splitting).

const mainDictionaries = {
  en: () => import('../../dictionaries/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/he.json').then((module) => module.default),
};

const authDictionaries = {
  en: () => import('../../dictionaries/auth/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/auth/he.json').then((module) => module.default),
};

const suggestionsDictionaries = {
  en: () => import('../../dictionaries/suggestions/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/suggestions/he.json').then((module) => module.default),
};

const questionnaireDictionaries = {
  en: () => import('../../dictionaries/questionnaire/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/questionnaire/he.json').then((module) => module.default),
};

const questionnaireQuestionsDictionaries = {
  en: () => import('../../dictionaries/questionnaire/questions.en.json').then((module) => module.default),
  he: () => import('../../dictionaries/questionnaire/questions.he.json').then((module) => module.default),
};

const profileDictionaries = {
  en: () => import('../../dictionaries/profile/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/profile/he.json').then((module) => module.default),
};

const matchmakerDictionaries = {
  en: () => import('../../dictionaries/matchmaker/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/matchmaker/he.json').then((module) => module.default),
};

const emailDictionaries = {
  en: () => import('../../dictionaries/email/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/email/he.json').then((module) => module.default),
};


/**
 * טוען את כל מודולי המילון עבור שפה (locale) נתונה ומרכיב אותם לאובייקט אחד שלם.
 * @param locale השפה לטעינה ('en' או 'he').
 * @returns Promise שנפתר לאובייקט המילון המלא והמובנה.
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  // קביעת השפה לטעינה, עם עברית ('he') כשפת ברירת מחדל אם השפה המבוקשת אינה זמינה.
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // טעינה מקבילית של כל חלקי המילון באמצעות Promise.all לביצועים מיטביים.
  const [
    main, 
    auth,
    suggestions, 
    questionnaireBase, 
    profilePage, 
    matchmakerPage,
    email
  ] = await Promise.all([
    mainDictionaries[targetLocale](),
    authDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
    questionnaireDictionaries[targetLocale](),
    profileDictionaries[targetLocale](),
    matchmakerDictionaries[targetLocale](),
    emailDictionaries[targetLocale](),
  ]);

  // טיפול מיוחד במילון השאלון:
  // טוענים בנפרד את קובץ השאלות ומשלבים אותו עם קובץ הבסיס של השאלון.
  const questionsContent = await questionnaireQuestionsDictionaries[targetLocale]();

  // הרכבת אובייקט השאלון השלם
  const questionnaire: QuestionnaireDictionary = {
    ...(questionnaireBase as Omit<QuestionnaireDictionary, 'questions'>),
    questions: questionsContent,
  };

  // הרכבת אובייקט המילון הסופי והשלם, כולל כל המודולים שנטענו.
  return {
    ...main, // פורס את כל התוכן מהמילון הראשי (en.json / he.json)
    auth: auth as AuthDictionary,
    suggestions,
    questionnaire,
    profilePage,
    matchmakerPage,
    email: email as EmailDictionary,
  } as Dictionary;
};