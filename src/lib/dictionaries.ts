// src/lib/dictionaries.ts

import 'server-only'; // מוודא שקובץ זה לעולם לא יישלח לקליינט
import type { Locale } from '../../i18n-config';

// אובייקט שממפה בין קוד שפה לפונקציה שיודעת לטעון את קובץ ה-JSON שלה.
// השימוש ב-import() דינמי מבטיח שרק קובץ השפה הנדרש ייטען בכל פעם,
// מה שמשפר את הביצועים (Code Splitting).
const dictionaries = {
  en: () => import('../../dictionaries/en.json').then((module) => module.default),
  he: () => import('../../dictionaries/he.json').then((module) => module.default),
};

/**
 * פונקציה אסינכרונית לקבלת המילון (אובייקט התרגומים) עבור שפה ספציפית.
 * @param locale - קוד השפה ('he' או 'en')
 * @returns {Promise<Object>} - אובייקט JSON עם כל הטקסטים המתורגמים.
 */
export const getDictionary = async (locale: Locale) => {
  // בודק אם השפה המבוקשת קיימת במילונים שלנו, ואם לא, מחזיר את ברירת המחדל.
  return dictionaries[locale] ? dictionaries[locale]() : dictionaries.he();
};