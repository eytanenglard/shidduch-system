// src/lib/pdf/hebrewPdfUtils.ts
// =====================================================
// פונקציות עזר משודרגות - גרסה 3.0
// =====================================================

/**
 * בדיקה האם תו הוא עברי
 */
export function isHebrewChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0590 && code <= 0x05ff;
}

/**
 * בדיקה האם תו הוא LTR
 */
export function isLtrChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0041 && code <= 0x005a) ||
    (code >= 0x0061 && code <= 0x007a) ||
    (code >= 0x0030 && code <= 0x0039)
  );
}

/**
 * בדיקה האם תו ניטרלי
 */
export function isNeutralChar(char: string): boolean {
  const neutralChars = " .,;:?!-–—_()[]{}'\"/\\@#$%^&*+=<>~`|״׳";
  return neutralChars.includes(char);
}

type SegmentType = 'hebrew' | 'ltr' | 'neutral';

interface TextSegment {
  text: string;
  type: SegmentType;
}

/**
 * פירוק טקסט לסגמנטים
 */
function segmentText(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let currentText = '';
  let currentType: SegmentType | null = null;

  for (const char of text) {
    let charType: SegmentType;

    if (isHebrewChar(char)) {
      charType = 'hebrew';
    } else if (isLtrChar(char)) {
      charType = 'ltr';
    } else {
      charType = 'neutral';
    }

    if (charType === 'neutral' && currentType !== null) {
      currentText += char;
      continue;
    }

    if (currentType !== null && charType !== currentType && charType !== 'neutral') {
      if (currentText) {
        segments.push({ text: currentText, type: currentType });
      }
      currentText = char;
      currentType = charType;
    } else {
      currentText += char;
      if (charType !== 'neutral') {
        currentType = charType;
      } else if (currentType === null) {
        currentType = 'neutral';
      }
    }
  }

  if (currentText) {
    segments.push({ text: currentText, type: currentType || 'neutral' });
  }

  return segments;
}

function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * הכנת טקסט עברי ל-PDF
 */
export function prepareHebrewText(text: string): string {
  if (!text) return text;

  const segments = segmentText(text);
  if (segments.length === 0) return text;

  const processedSegments = segments.map((segment) => {
    if (segment.type === 'hebrew') {
      return reverseString(segment.text);
    } else if (segment.type === 'ltr') {
      return segment.text;
    } else {
      return reverseString(segment.text);
    }
  });

  return processedSegments.reverse().join('');
}

export const reverseHebrewText = prepareHebrewText;

/**
 * פורמט תאריך עברי
 */
export function formatHebrewDate(date: Date): string {
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const day = date.getDate();
  const month = hebrewMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ב${month} ${year}`;
}

/**
 * פורמט תאריך למספרים
 */
export function formatDateNumbers(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
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
    { text: 'טוב להודות לה\' - כי לעולם חסדו', author: 'תהילים' },
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
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * צבעי המערכת - פלטה מורחבת
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
    whoYouAre: { r: 139, g: 92, b: 246 },      // סגול
    idealPartner: { r: 236, g: 72, b: 153 },    // ורוד
    firstMeeting: { r: 34, g: 197, b: 94 },     // ירוק
    potential: { r: 251, g: 146, b: 60 },       // כתום
    nextSteps: { r: 59, g: 130, b: 246 },       // כחול
    strengths: { r: 234, g: 179, b: 8 },        // זהב
    growth: { r: 20, g: 184, b: 166 },          // טורקיז
  },
};

/**
 * סוגי סקציות מורחב
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
    icon: string;
    titleHe: string;
    titleEn: string;
    color: { r: number; g: number; b: number };
    bgColor: { r: number; g: number; b: number };
  }
> = {
  whoYouAre: {
    emoji: '🌟',
    icon: 'star',
    titleHe: 'מי את/ה באמת',
    titleEn: 'Who You Really Are',
    color: NESHAMA_COLORS.sections.whoYouAre,
    bgColor: { r: 245, g: 243, b: 255 },
  },
  idealPartner: {
    emoji: '💫',
    icon: 'heart',
    titleHe: 'השותף/ה האידיאלי/ת',
    titleEn: 'Your Ideal Partner',
    color: NESHAMA_COLORS.sections.idealPartner,
    bgColor: { r: 253, g: 242, b: 248 },
  },
  firstMeetingTips: {
    emoji: '🎯',
    icon: 'target',
    titleHe: 'טיפים לפגישה הראשונה',
    titleEn: 'First Meeting Tips',
    color: NESHAMA_COLORS.sections.firstMeeting,
    bgColor: { r: 240, g: 253, b: 244 },
  },
  uniquePotential: {
    emoji: '✨',
    icon: 'sparkle',
    titleHe: 'הפוטנציאל הייחודי שלך',
    titleEn: 'Your Unique Potential',
    color: NESHAMA_COLORS.sections.potential,
    bgColor: { r: 255, g: 247, b: 237 },
  },
  nextSteps: {
    emoji: '🚀',
    icon: 'rocket',
    titleHe: 'הצעדים הבאים',
    titleEn: 'Your Next Steps',
    color: NESHAMA_COLORS.sections.nextSteps,
    bgColor: { r: 239, g: 246, b: 255 },
  },
  keyStrengths: {
    emoji: '💪',
    icon: 'trophy',
    titleHe: 'נקודות החוזק שלך',
    titleEn: 'Your Key Strengths',
    color: NESHAMA_COLORS.sections.strengths,
    bgColor: { r: 254, g: 252, b: 232 },
  },
  growthAreas: {
    emoji: '🌱',
    icon: 'leaf',
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
 * RGB להקס
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * יצירת ID ייחודי
 */
export function generateUniqueId(): string {
  return `neshama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}