// Filter option constants used across filter sub-components

export const RELIGIOUS_OPTIONS = [
  { value: 'dati_leumi_torani', label: 'דתי/ה לאומי/ת תורני/ת' },
  { value: 'dati_leumi_standard', label: 'דתי/ה לאומי/ת (סטנדרטי)' },
  { value: 'dati_leumi_liberal', label: 'דתי/ה לאומי/ת ליברלי/ת' },
  { value: 'charedi_litvak', label: 'חרדי/ת ליטאי/ת' },
  { value: 'charedi_hasidic', label: 'חרדי/ת חסידי/ת' },
  { value: 'charedi_sephardic', label: 'חרדי/ת ספרדי/ת' },
  { value: 'charedi_modern', label: 'חרדי/ת מודרני/ת' },
  { value: 'chabad', label: 'חב״ד' },
  { value: 'breslov', label: 'ברסלב' },
  { value: 'masorti_strong', label: 'מסורתי/ת (קרוב/ה לדת)' },
  { value: 'masorti_light', label: 'מסורתי/ת (קשר קל למסורת)' },
  { value: 'secular_traditional_connection', label: 'חילוני/ת עם זיקה למסורת' },
  { value: 'secular', label: 'חילוני/ת' },
  { value: 'spiritual_not_religious', label: 'רוחני/ת (לאו דווקא דתי/ה)' },
  { value: 'other', label: 'אחר' },
  { value: 'not_defined', label: 'לא מוגדר / ללא רמה דתית' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'hebrew', label: 'עברית' },
  { value: 'english', label: 'אנגלית' },
  { value: 'russian', label: 'רוסית' },
  { value: 'french', label: 'צרפתית' },
  { value: 'spanish', label: 'ספרדית' },
  { value: 'yiddish', label: 'יידיש' },
  { value: 'arabic', label: 'ערבית' },
  { value: 'portuguese', label: 'פורטוגזית' },
  { value: 'german', label: 'גרמנית' },
  { value: 'amharic', label: 'אמהרית' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'רווק/ה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
  { value: 'divorced_with_children', label: 'גרוש/ה עם ילדים' },
  { value: 'widowed_with_children', label: 'אלמן/ה עם ילדים' },
];

export const READINESS_OPTIONS = [
  { value: 'VERY_READY', label: 'מוכן/ה מאוד' },
  { value: 'READY', label: 'מוכן/ה' },
  { value: 'SOMEWHAT_READY', label: 'מוכן/ה חלקית' },
  { value: 'UNCERTAIN', label: 'לא בטוח/ה' },
  { value: 'NOT_READY', label: 'לא מוכן/ה' },
];

export const SMOKING_OPTIONS = [
  { value: 'never', label: 'לא מעשן/ת' },
  { value: 'occasionally', label: 'לפעמים' },
  { value: 'regularly', label: 'מעשן/ת באופן קבוע' },
  { value: 'trying_to_quit', label: 'מנסה להפסיק' },
];

export const HEAD_COVERING_OPTIONS = [
  { value: 'NONE', label: 'ללא כיסוי' },
  { value: 'SOMETIMES', label: 'לפעמים' },
  { value: 'MITPACHAT', label: 'מטפחת' },
  { value: 'WIG', label: 'פאה' },
  { value: 'BOTH', label: 'מטפחת ופאה' },
  { value: 'FULL_COVERAGE', label: 'כיסוי מלא' },
  { value: 'PARTIAL_COVERAGE', label: 'כיסוי חלקי' },
  { value: 'OTHER', label: 'אחר' },
];

export const KIPPAH_OPTIONS = [
  { value: 'NONE', label: 'ללא כיפה' },
  { value: 'SOMETIMES', label: 'לפעמים' },
  { value: 'SRUGA', label: 'כיפה סרוגה' },
  { value: 'BLACK', label: 'כיפה שחורה' },
  { value: 'BLACK_VELVET', label: 'כיפת קטיפה שחורה' },
  { value: 'KNITTED_SMALL', label: 'סרוגה קטנה' },
  { value: 'KNITTED_LARGE', label: 'סרוגה גדולה' },
  { value: 'LARGE', label: 'כיפה גדולה' },
  { value: 'OTHER', label: 'אחר' },
];
