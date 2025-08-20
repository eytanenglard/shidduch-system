// src/lib/dictionaries.ts

import 'server-only';
import type { Locale } from '../../i18n-config';
import type { Dictionary } from '@/types/dictionary';

// טוען את המילון הראשי (כל מה שהיה קיים עד עכשיו)
const mainDictionaries = {
  en: () => import('../../dictionaries/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/he.json').then((module) => module.default),
};

// ✨ הוספה: טוען את המילון החדש של ההצעות
const suggestionsDictionaries = {
  en: () => import('../../dictionaries/suggestions/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/suggestions/he.json').then((module) => module.default),
};


/**
 * פונקציה אסינכרונית לקבלת המילון המלא עבור שפה ספציפית,
 * המורכב ממספר קבצי JSON.
 * @param locale - קוד השפה ('he' או 'en')
 * @returns {Promise<Dictionary>} - אובייקט JSON עם כל הטקסטים המתורגמים.
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const targetLocale = mainDictionaries[locale] ? locale : 'he';

  // ✨ שינוי: טוענים את כל המילונים במקביל לביצועים מיטביים
  const [main, suggestions] = await Promise.all([
    mainDictionaries[targetLocale](),
    suggestionsDictionaries[targetLocale](),
  ]);

  // ✨ שינוי: מאחדים את כל המילונים לאובייקט אחד
  return {
    ...main,
    suggestions, // המפתח 'suggestions' יכיל את כל התרגומים מהקובץ החדש
  };
};