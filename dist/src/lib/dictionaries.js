"use strict";
// src/lib/dictionaries.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailDictionary = exports.getQuestionnaireQuestionsDictionary = exports.getDictionary = void 0;
// --- הגדרת טוענים (Loaders) עבור כל מודול של המילון ---
// כל טוען הוא אובייקט המכיל פונקציות ייבוא דינמיות עבור כל שפה נתמכת.
// גישה זו מבטיחה שנטען רק את קבצי השפה הנדרשים (Code Splitting).
const adminDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/admin/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/admin/he.json'))).then((module) => module.default),
};
const mainDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/he.json'))).then((module) => module.default),
};
const authDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/auth/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/auth/he.json'))).then((module) => module.default),
};
const suggestionsDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/suggestions/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/suggestions/he.json'))).then((module) => module.default),
};
const questionnaireDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/questionnaire/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/questionnaire/he.json'))).then((module) => module.default),
};
const questionnaireQuestionsDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/questionnaire/questions.en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/questionnaire/questions.he.json'))).then((module) => module.default),
};
const profileDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/profile/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/profile/he.json'))).then((module) => module.default),
};
const matchmakerDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/matchmaker/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/matchmaker/he.json'))).then((module) => module.default),
};
const emailDictionaries = {
    en: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/email/en.json'))).then((module) => module.default),
    he: () => Promise.resolve().then(() => __importStar(require('../../dictionaries/email/he.json'))).then((module) => module.default),
};
/**
 * טוען את כל מודולי המילון עבור שפה (locale) נתונה ומרכיב אותם לאובייקט אחד שלם.
 * @param locale השפה לטעינה ('en' או 'he').
 * @returns Promise שנפתר לאובייקט המילון המלא והמובנה.
 */
const getDictionary = async (locale) => {
    // קביעת השפה לטעינה, עם עברית ('he') כשפת ברירת מחדל אם השפה המבוקשת אינה זמינה.
    const targetLocale = mainDictionaries[locale] ? locale : 'he';
    // טעינה מקבילית של כל חלקי המילון באמצעות Promise.all לביצועים מיטביים.
    const [main, auth, suggestions, questionnaireBase, profilePage, matchmakerPage, email, admin] = await Promise.all([
        mainDictionaries[targetLocale](),
        authDictionaries[targetLocale](),
        suggestionsDictionaries[targetLocale](),
        questionnaireDictionaries[targetLocale](),
        profileDictionaries[targetLocale](),
        matchmakerDictionaries[targetLocale](),
        emailDictionaries[targetLocale](),
        adminDictionaries[targetLocale](),
    ]);
    // טיפול מיוחד במילון השאלון:
    // טוענים בנפרד את קובץ השאלות ומשלבים אותו עם קובץ הבסיס של השאלון.
    const questionsContent = await questionnaireQuestionsDictionaries[targetLocale]();
    // הרכבת אובייקט השאלון השלם
    const questionnaire = Object.assign(Object.assign({}, questionnaireBase), { questions: questionsContent });
    // הרכבת אובייקט המילון הסופי והשלם, כולל כל המודולים שנטענו.
    return Object.assign(Object.assign({}, main), { auth: auth, suggestions,
        questionnaire,
        profilePage,
        matchmakerPage, email: email, admin });
};
exports.getDictionary = getDictionary;
/**
 * טוען באופן ספציפי רק את מילון השאלות של השאלון עבור שפה נתונה.
 * פונקציה זו שימושית עבור רכיבי צד-שרת או API routes שצריכים גישה לתרגומי השאלות.
 * @param locale השפה לטעינה ('en' או 'he').
 * @returns Promise שנפתר לאובייקט מילון השאלות (questions).
 */
const getQuestionnaireQuestionsDictionary = async (locale) => {
    const targetLocale = questionnaireQuestionsDictionaries[locale] ? locale : 'he';
    const questionsContent = await questionnaireQuestionsDictionaries[targetLocale]();
    return questionsContent;
};
exports.getQuestionnaireQuestionsDictionary = getQuestionnaireQuestionsDictionary;
const getEmailDictionary = async (locale) => {
    const targetLocale = emailDictionaries[locale] ? locale : 'he';
    const emailContent = await emailDictionaries[targetLocale]();
    return emailContent;
};
exports.getEmailDictionary = getEmailDictionary;
