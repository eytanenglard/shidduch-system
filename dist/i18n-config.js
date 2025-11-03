"use strict";
// i18n-config.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = void 0;
/**
 * תצורת הבינלאומיות (i18n) של האפליקציה.
 * קובץ זה מגדיר את השפות הזמינות ואת שפת ברירת המחדל.
 */
exports.i18n = {
    // שפת ברירת המחדל. משמשת כ-fallback אם לא נמצאה שפה מתאימה.
    defaultLocale: 'he',
    // מערך של כל השפות הנתמכות באתר.
    // הוספת שפה חדשה כאן היא הצעד הראשון להפעלתה.
    locales: ['he', 'en'],
}; // 'as const' הופך את האובייקט לקריאה בלבד ומאפשר לנו ליצור טיפוסים מדויקים ממנו.
