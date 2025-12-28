// src/lib/pdf/hebrewPdfUtils.ts
// =====================================================
// פונקציות עזר לעברית ב-PDF - גרסה 4.0
// תיקון: לא להפוך טקסט עברי טהור!
// =====================================================

/**
 * בדיקה האם תו הוא עברי
 */
export function isHebrewChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0590 && code <= 0x05ff;
}

/**
 * בדיקה האם תו הוא אנגלי
 */
export function isEnglishChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * בדיקה האם תו הוא ספרה
 */
export function isDigit(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57;
}

/**
 * בדיקה האם הטקסט מכיל אותיות אנגליות
 */
export function hasEnglishLetters(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (isEnglishChar(text[i])) {
      return true;
    }
  }
  return false;
}

/**
 * הפיכת מחרוזת
 */
function reverseString(str: string): string {
  let result = '';
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}

/**
 * הכנת טקסט עברי ל-PDF
 * 
 * הלוגיקה:
 * - טקסט עברי טהור (ללא אנגלית) -> לא משנים כלום
 * - טקסט מעורב (עברית + אנגלית) -> הופכים את הכל ואז מתקנים את האנגלית
 */
export function prepareHebrewText(text: string): string {
  if (!text) {
    return text;
  }

  // בדיקה אם יש אותיות אנגליות
  if (!hasEnglishLetters(text)) {
    // טקסט עברי טהור - מחזירים כמו שהוא!
    return text;
  }

  // טקסט מעורב - צריך לטפל
  // שלב 1: הפוך את כל הטקסט
  const reversed = reverseString(text);

  // שלב 2: מצא את החלקים האנגליים והפוך אותם חזרה
  let result = '';
  let englishBuffer = '';
  let inEnglish = false;

  for (let i = 0; i < reversed.length; i++) {
    const char = reversed[i];

    if (isEnglishChar(char)) {
      // תו אנגלי
      englishBuffer += char;
      inEnglish = true;
    } else if (inEnglish && (isDigit(char) || char === '.' || char === '-' || char === '_')) {
      // תו שיכול להיות חלק ממילה אנגלית (מספר, נקודה, מקף)
      englishBuffer += char;
    } else {
      // תו לא אנגלי
      if (englishBuffer.length > 0) {
        // יש buffer אנגלי - הפוך אותו חזרה והוסף
        result += reverseString(englishBuffer);
        englishBuffer = '';
        inEnglish = false;
      }
      result += char;
    }
  }

  // אם נשאר buffer אנגלי בסוף
  if (englishBuffer.length > 0) {
    result += reverseString(englishBuffer);
  }

  return result;
}

/**
 * Alias לתאימות אחורה
 */
export const reverseHebrewText = prepareHebrewText;

/**
 * פורמט תאריך עברי (טקסטואלי)
 */
export function formatHebrewDate(date: Date): string {
  const hebrewMonths = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
  ];
  const day = date.getDate();
  const month = hebrewMonths[date.getMonth()];
  const year = date.getFullYear();
  return day + ' ב' + month + ' ' + year;
}

/**
 * פורמט תאריך מספרי
 */
export function formatDateNumbers(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return day + '.' + month + '.' + year;
}

/**
 * ציטוטים מעוררי השראה
 */
export const INSPIRATIONAL_QUOTES = {
  he: [
    { text: 'הזיווג הוא מן השמים, אבל ההשתדלות היא מאיתנו', author: 'חז"ל' },
    { text: 'אין אדם דר עם נחש בכפיפה אחת - לכן חשוב למצוא את הנפש התאומה', author: 'תלמוד' },
    { text: 'כל התחלות קשות, אבל מי שמתחיל - חצי עשה', author: 'פתגם עברי' },
    { text: 'לב יודע מרת נפשו - ובשמחתו לא יתערב זר', author: 'משלי' },
    { text: 'טוב להודות לה׳ - כי לעולם חסדו', author: 'תהילים' },
  ],
  en: [
    { text: 'The best thing to hold onto in life is each other', author: 'Audrey Hepburn' },
    { text: 'Love is not about finding the right person, but creating a right relationship', author: 'Unknown' },
    { text: 'A successful marriage requires falling in love many times, always with the same person', author: 'Mignon McLaughlin' },
  ],
};

/**
 * קבלת ציטוט רנדומלי
 */
export function getRandomQuote(isHebrew: boolean): { text: string; author: string } {
  const quotes = isHebrew ? INSPIRATIONAL_QUOTES.he : INSPIRATIONAL_QUOTES.en;
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

/**
 * צבעי המערכת
 */
export const NESHAMA_COLORS = {
  // Primary
  primary: { r: 99, g: 102, b: 241 },
  primaryLight: { r: 129, g: 140, b: 248 },
  primaryDark: { r: 79, g: 70, b: 229 },

  // Secondary
  secondary: { r: 236, g: 72, b: 153 },
  secondaryLight: { r: 244, g: 114, b: 182 },

  // Accent
  accent: { r: 251, g: 146, b: 60 },
  gold: { r: 234, g: 179, b: 8 },

  // Backgrounds
  bgLight: { r: 248, g: 250, b: 252 },
  bgWarm: { r: 255, g: 251, b: 235 },
  bgCool: { r: 239, g: 246, b: 255 },
  white: { r: 255, g: 255, b: 255 },

  // Text
  textPrimary: { r: 30, g: 41, b: 59 },
  textSecondary: { r: 71, g: 85, b: 105 },
  textMuted: { r: 148, g: 163, b: 184 },

  // Section colors
  sections: {
    whoYouAre: { r: 139, g: 92, b: 246 },
    idealPartner: { r: 236, g: 72, b: 153 },
    firstMeeting: { r: 34, g: 197, b: 94 },
    potential: { r: 251, g: 146, b: 60 },
    nextSteps: { r: 59, g: 130, b: 246 },
    strengths: { r: 234, g: 179, b: 8 },
    growth: { r: 20, g: 184, b: 166 },
  },
};

/**
 * סוגי סקציות
 */
export type SectionType =
  | 'whoYouAre'
  | 'idealPartner'
  | 'firstMeetingTips'
  | 'uniquePotential'
  | 'nextSteps'
  | 'keyStrengths'
  | 'growthAreas';

/**
 * מידע על סקציות
 */
export const SECTION_INFO: Record<
  SectionType,
  {
    emoji: string;
    titleHe: string;
    titleEn: string;
    color: { r: number; g: number; b: number };
    bgColor: { r: number; g: number; b: number };
  }
> = {
  whoYouAre: {
    emoji: '🌟',
    titleHe: 'מי את/ה באמת',
    titleEn: 'Who You Really Are',
    color: NESHAMA_COLORS.sections.whoYouAre,
    bgColor: { r: 245, g: 243, b: 255 },
  },
  idealPartner: {
    emoji: '💫',
    titleHe: 'השותף/ה האידיאלי/ת',
    titleEn: 'Your Ideal Partner',
    color: NESHAMA_COLORS.sections.idealPartner,
    bgColor: { r: 253, g: 242, b: 248 },
  },
  firstMeetingTips: {
    emoji: '🎯',
    titleHe: 'טיפים לפגישה הראשונה',
    titleEn: 'First Meeting Tips',
    color: NESHAMA_COLORS.sections.firstMeeting,
    bgColor: { r: 240, g: 253, b: 244 },
  },
  uniquePotential: {
    emoji: '✨',
    titleHe: 'הפוטנציאל הייחודי שלך',
    titleEn: 'Your Unique Potential',
    color: NESHAMA_COLORS.sections.potential,
    bgColor: { r: 255, g: 247, b: 237 },
  },
  nextSteps: {
    emoji: '🚀',
    titleHe: 'הצעדים הבאים',
    titleEn: 'Your Next Steps',
    color: NESHAMA_COLORS.sections.nextSteps,
    bgColor: { r: 239, g: 246, b: 255 },
  },
  keyStrengths: {
    emoji: '💪',
    titleHe: 'נקודות החוזק שלך',
    titleEn: 'Your Key Strengths',
    color: NESHAMA_COLORS.sections.strengths,
    bgColor: { r: 254, g: 252, b: 232 },
  },
  growthAreas: {
    emoji: '🌱',
    titleHe: 'אזורי צמיחה',
    titleEn: 'Growth Areas',
    color: NESHAMA_COLORS.sections.growth,
    bgColor: { r: 240, g: 253, b: 250 },
  },
};

/**
 * קבלת מידע סקציה
 */
export function getSectionInfo(section: SectionType) {
  return SECTION_INFO[section];
}

/**
 * יצירת ID ייחודי
 */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return 'neshama-' + timestamp + '-' + random;
}