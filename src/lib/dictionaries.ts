// src/lib/dictionaries.ts

import 'server-only';
import type { Locale } from '../../i18n-config';
import type { 
  Dictionary, 
  QuestionnaireDictionary, 
  AuthDictionary, 
  EmailDictionary // ודא שהטיפוס הזה מיובא מהמיקום הנכון
} from '@/types/dictionary'; // ודא שנתיב הייבוא הראשי נכון

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

// --- START: הוספת טוען עבור מילון המיילים החדש ---
const emailDictionaries = {
  en: () => import('../../dictionaries/email/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/email/he.json').then((module) => module.default),
};
// --- END: הוספת טוען עבור מילון המיילים החדש ---


/**
 * טוען את כל מודולי המילון עבור שפה (locale) נתונה ומרכיב אותם לאובייקט אחד שלם.
 * @param locale השפה לטעינה ('en' או 'he').
 * @returns Promise שנפתר לאובייקט המילון המלא והמובנה.
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  // קביעת השפה לטעינה, עם עברית ('he') כשפת ברירת מחדל אם השפה המבוקשת אינה זמינה.
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // טעינה מקבילית של כל חלקי המילון באמצעות Promise.all לביצועים מיטביים.
  // --- START: הוספת המשתנה email לטעינה המקבילית ---
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
    emailDictionaries[targetLocale](), // הוספת טעינת מילון המיילים
  ]);
  // --- END: הוספת המשתנה email ---

  // טיפול מיוחד במילון השאלון:
  // טוענים בנפרד את קובץ השאלות ומשלבים אותו עם קובץ הבסיס של השאלון.
  const questionsContent = await questionnaireQuestionsDictionaries[targetLocale]();

  // הרכבת אובייקט השאלון השלם
  const questionnaire: QuestionnaireDictionary = {
    ...(questionnaireBase as Omit<QuestionnaireDictionary, 'questions'>),
    questions: questionsContent,
  };

  // הרכבת אובייקט המילון הסופי והשלם, כולל כל המודולים שנטענו.
  // --- START: הוספת מודול המייל לאובייקט המוחזר ---
  return {
    ...main,
    auth: auth as AuthDictionary, // שימוש ב-Type Assertion לדיוק
    suggestions,
    questionnaire, // זהו כעת האובייקט המורכב הכולל את השאלות
    profilePage,
    matchmakerPage,
    email: email as EmailDictionary,// אריזת המילון תחת המפתח 'email' כדי להתאים לטיפוס
  } as Dictionary;
  // --- END: הוספת מודול המייל ---
};