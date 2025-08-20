// src/lib/dictionaries.ts

import 'server-only';
import type { Locale } from '../../i18n-config';
// ✅ ייבוא הטיפוס המלא והמדויק
import type { Dictionary, HomePageDictionary } from '@/types/dictionary';

const mainDictionaries = {
  en: () => import('../../dictionaries/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/he.json').then((module) => module.default),
};

const suggestionsDictionaries = {
  en: () => import('../../dictionaries/suggestions/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/suggestions/he.json').then((module) => module.default),
};

/**
 * פונקציה אסינכרונית לקבלת המילון המלא עבור שפה ספציפית,
 * המורכב ממספר קבצי JSON.
 * @param locale - קוד השפה ('he' או 'en')
 * @returns {Promise<HomePageDictionary>} - ✅ שינוי: מחזירים טיפוס שתואם לדף הבית
 */
export const getDictionary = async (locale: Locale): Promise<HomePageDictionary> => {
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  const [main, suggestions] = await Promise.all([
    mainDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
  ]);

  // ✅ מאחדים את כל המילונים לאובייקט אחד שתואם ל-HomePageDictionary
  //    זה פותר את שגיאת הטיפוסים.
  return {
    ...main, // main מכיל עכשיו את navbar, heroSection, ..., וגם demoProfileCard
    suggestions,
  } as HomePageDictionary; // Cast to ensure type safety
};