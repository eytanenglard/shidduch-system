// =============================================================================
// File: src/app/api/matchmaker/candidates/card-import/route.ts
// Description: API route for card-based single candidate AI analysis
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!GEMINI_API_KEY) {
  console.error('[CardImport] GEMINI_API_KEY is not configured!');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1,
  },
});

// ---------------------------------------------------------------------------
// Valid options - EXACTLY as in the system
// ---------------------------------------------------------------------------

const VALID_RELIGIOUS_LEVELS = [
  'dati_leumi_standard',
  'dati_leumi_liberal',
  'dati_leumi_torani',
  'masorti_strong',
  'masorti_light',
  'secular_traditional_connection',
  'secular',
  'spiritual_not_religious',
  'charedi_modern',
  'charedi_litvak',
  'charedi_sephardic',
  'charedi_hasidic',
  'chabad',
  'breslov',
  'other',
] as const;

const VALID_MARITAL_STATUSES = ['single', 'divorced', 'widowed'] as const;

const VALID_ORIGINS = [
  'אשכנזי',
  'ספרדי',
  'מזרחי',
  'תימני',
  'מרוקאי',
  'עיראקי',
  'פרסי',
  'כורדי',
  'תוניסאי',
  'לובי',
  'אתיופי',
  'גרוזיני',
  'בוכרי',
  'הודי',
  'תורכי',
  'מעורב',
  'אחר',
] as const;

// ---------------------------------------------------------------------------
// Enhanced Mapping helpers
// ---------------------------------------------------------------------------

const MARITAL_STATUS_MAP: Record<string, string> = {
  'רווק': 'single',
  'גרוש': 'divorced',
  'אלמן': 'widowed',
  'רווקה': 'single',
  'גרושה': 'divorced',
  'אלמנה': 'widowed',
  'single': 'single',
  'divorced': 'divorced',
  'widowed': 'widowed',
  'לא נשוי': 'single',
  'לא נשואה': 'single',
  'לא היה נשוי': 'single',
  'לא היתה נשואה': 'single',
  'פנוי': 'single',
  'פנויה': 'single',
  'נשוי בעבר': 'divorced',
  'נשואה בעבר': 'divorced',
  'התגרש': 'divorced',
  'התגרשה': 'divorced',
  'after divorce': 'divorced',
  'widow': 'widowed',
  'widower': 'widowed',
  'פרוד': 'divorced',
  'פרודה': 'divorced',
  'separated': 'divorced',
};

const RELIGIOUS_LEVEL_MAP: Record<string, string> = {
  'דתי לאומי': 'dati_leumi_standard',
  'דתית לאומית': 'dati_leumi_standard',
  'דתיה לאומית': 'dati_leumi_standard',
  'דל"ת': 'dati_leumi_standard',
  'דלת': 'dati_leumi_standard',
  'דתי לאומי סטנדרטי': 'dati_leumi_standard',
  'דתית לאומית סטנדרטית': 'dati_leumi_standard',
  'דתי': 'dati_leumi_standard',
  'דתית': 'dati_leumi_standard',
  'דתי/ה': 'dati_leumi_standard',
  'דתי לאומי רגיל': 'dati_leumi_standard',
  'dati': 'dati_leumi_standard',
  'dati leumi': 'dati_leumi_standard',
  'dati_leumi_standard': 'dati_leumi_standard',
  'דתי לאומי ליברלי': 'dati_leumi_liberal',
  'דתית לאומית ליברלית': 'dati_leumi_liberal',
  'דתי ליברלי': 'dati_leumi_liberal',
  'דתית ליברלית': 'dati_leumi_liberal',
  'דתי לייט': 'dati_leumi_liberal',
  'דתית לייט': 'dati_leumi_liberal',
  'דתי קל': 'dati_leumi_liberal',
  'דתית קלה': 'dati_leumi_liberal',
  'דתי פתוח': 'dati_leumi_liberal',
  'דתית פתוחה': 'dati_leumi_liberal',
  'dati_leumi_liberal': 'dati_leumi_liberal',
  'דתי לאומי תורני': 'dati_leumi_torani',
  'דתית לאומית תורנית': 'dati_leumi_torani',
  'חרד"ל': 'dati_leumi_torani',
  'חרדל': 'dati_leumi_torani',
  "חרד''ל": 'dati_leumi_torani',
  'תורני': 'dati_leumi_torani',
  'תורנית': 'dati_leumi_torani',
  'דתי תורני': 'dati_leumi_torani',
  'דתית תורנית': 'dati_leumi_torani',
  'torani': 'dati_leumi_torani',
  'dati_leumi_torani': 'dati_leumi_torani',
  'מסורתי': 'masorti_strong',
  'מסורתית': 'masorti_strong',
  'מסורתי קרוב לדת': 'masorti_strong',
  'מסורתית קרובה לדת': 'masorti_strong',
  'מסורתי חזק': 'masorti_strong',
  'מסורתית חזקה': 'masorti_strong',
  'מסורתי שומר מסורת': 'masorti_strong',
  'שומר מסורת': 'masorti_strong',
  'masorti': 'masorti_strong',
  'traditional': 'masorti_strong',
  'masorti_strong': 'masorti_strong',
  'מסורתי לייט': 'masorti_light',
  'מסורתי קל': 'masorti_light',
  'מסורתית קלה': 'masorti_light',
  'קצת מסורתי': 'masorti_light',
  'קצת מסורתית': 'masorti_light',
  'מסורתי רחוק מדת': 'masorti_light',
  'masorti_light': 'masorti_light',
  'חילוני עם זיקה למסורת': 'secular_traditional_connection',
  'חילונית עם זיקה למסורת': 'secular_traditional_connection',
  'חילוני מסורתי': 'secular_traditional_connection',
  'חילונית מסורתית': 'secular_traditional_connection',
  'חילוני עם מסורת': 'secular_traditional_connection',
  'secular_traditional_connection': 'secular_traditional_connection',
  'חילוני': 'secular',
  'חילונית': 'secular',
  'חילוני לגמרי': 'secular',
  'לא דתי': 'secular',
  'לא דתית': 'secular',
  'secular': 'secular',
  'רוחני': 'spiritual_not_religious',
  'רוחנית': 'spiritual_not_religious',
  'רוחני לא דתי': 'spiritual_not_religious',
  'רוחנית לא דתית': 'spiritual_not_religious',
  'spiritual': 'spiritual_not_religious',
  'spiritual_not_religious': 'spiritual_not_religious',
  'חרדי מודרני': 'charedi_modern',
  'חרדית מודרנית': 'charedi_modern',
  'חרדי לייט': 'charedi_modern',
  'חרדית לייט': 'charedi_modern',
  'חרדי פתוח': 'charedi_modern',
  'charedi_modern': 'charedi_modern',
  'חרדי ליטאי': 'charedi_litvak',
  'חרדית ליטאית': 'charedi_litvak',
  'ליטאי': 'charedi_litvak',
  'ליטאית': 'charedi_litvak',
  'חרדי': 'charedi_litvak',
  'חרדית': 'charedi_litvak',
  'litvak': 'charedi_litvak',
  'charedi': 'charedi_litvak',
  'charedi_litvak': 'charedi_litvak',
  'חרדי ספרדי': 'charedi_sephardic',
  'חרדית ספרדית': 'charedi_sephardic',
  'ש"ס': 'charedi_sephardic',
  'שס': 'charedi_sephardic',
  'ספרדי חרדי': 'charedi_sephardic',
  'charedi_sephardic': 'charedi_sephardic',
  'חרדי חסידי': 'charedi_hasidic',
  'חרדית חסידית': 'charedi_hasidic',
  'חסידי': 'charedi_hasidic',
  'חסידית': 'charedi_hasidic',
  'חסיד': 'charedi_hasidic',
  'hasidic': 'charedi_hasidic',
  'charedi_hasidic': 'charedi_hasidic',
  'חב"ד': 'chabad',
  'חבד': 'chabad',
  "חב''ד": 'chabad',
  'חב״ד': 'chabad',
  'lubavitch': 'chabad',
  'chabad': 'chabad',
  'ברסלב': 'breslov',
  'ברסלבר': 'breslov',
  'נ נח': 'breslov',
  'breslov': 'breslov',
  'בעל תשובה': 'other',
  'בעלת תשובה': 'other',
  'חוזר בתשובה': 'other',
  'חוזרת בתשובה': 'other',
  'גר': 'other',
  'גיורת': 'other',
  'אחר': 'other',
  'other': 'other',
};

const SINGLE_ORIGIN_MAP: Record<string, string> = {
  'אשכנזי': 'אשכנזי',
  'אשכנזית': 'אשכנזי',
  'אשכנזיה': 'אשכנזי',
  'ashkenazi': 'אשכנזי',
  'אירופאי': 'אשכנזי',
  'פולני': 'אשכנזי',
  'רוסי': 'אשכנזי',
  'הונגרי': 'אשכנזי',
  'רומני': 'אשכנזי',
  'גרמני': 'אשכנזי',
  'ספרדי': 'ספרדי',
  'ספרדית': 'ספרדי',
  'ספרדיה': 'ספרדי',
  'sephardi': 'ספרדי',
  'ספרדי טהור': 'ספרדי',
  'בולגרי': 'ספרדי',
  'יווני': 'ספרדי',
  'מזרחי': 'מזרחי',
  'מזרחית': 'מזרחי',
  'מזרחיה': 'מזרחי',
  'mizrachi': 'מזרחי',
  'תימני': 'תימני',
  'תימנית': 'תימני',
  'תימניה': 'תימני',
  'תימן': 'תימני',
  'yemenite': 'תימני',
  'מרוקאי': 'מרוקאי',
  'מרוקאית': 'מרוקאי',
  'מרוקו': 'מרוקאי',
  'moroccan': 'מרוקאי',
  'עיראקי': 'עיראקי',
  'עיראקית': 'עיראקי',
  'עירק': 'עיראקי',
  'בבלי': 'עיראקי',
  'iraqi': 'עיראקי',
  'פרסי': 'פרסי',
  'פרסית': 'פרסי',
  'פרסיה': 'פרסי',
  'איראני': 'פרסי',
  'איראנית': 'פרסי',
  'איראן': 'פרסי',
  'פרס': 'פרסי',
  'persian': 'פרסי',
  'iranian': 'פרסי',
  'כורדי': 'כורדי',
  'כורדית': 'כורדי',
  'כורדיסטן': 'כורדי',
  'kurdish': 'כורדי',
  'תוניסאי': 'תוניסאי',
  'תוניסאית': 'תוניסאי',
  'תוניסיה': 'תוניסאי',
  'תוניס': 'תוניסאי',
  'tunisian': 'תוניסאי',
  'לובי': 'לובי',
  'לובית': 'לובי',
  'טריפוליטאי': 'לובי',
  'טריפוליטאית': 'לובי',
  'לוב': 'לובי',
  'libyan': 'לובי',
  'אתיופי': 'אתיופי',
  'אתיופית': 'אתיופי',
  'אתיופיה': 'אתיופי',
  'ethiopian': 'אתיופי',
  'גרוזיני': 'גרוזיני',
  'גרוזינית': 'גרוזיני',
  'גאורגי': 'גרוזיני',
  'גאורגיה': 'גרוזיני',
  'georgian': 'גרוזיני',
  'בוכרי': 'בוכרי',
  'בוכרית': 'בוכרי',
  'בוכרה': 'בוכרי',
  'אוזבקי': 'בוכרי',
  'bukharian': 'בוכרי',
  'הודי': 'הודי',
  'הודית': 'הודי',
  'קוצ\'יני': 'הודי',
  'בני ישראל': 'הודי',
  'indian': 'הודי',
  'תורכי': 'תורכי',
  'תורכית': 'תורכי',
  'תורכיה': 'תורכי',
  'turkish': 'תורכי',
  'מעורב': 'מעורב',
  'מעורבת': 'מעורב',
  'mixed': 'מעורב',
  'אחר': 'אחר',
  'other': 'אחר',
  'לא ידוע': 'אחר',
};

function normalizeString(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[״"'`]/g, '"')
    .replace(/\s+/g, ' ');
}

function mapValue(val: string | null | undefined, map: Record<string, string>): string {
  if (!val) return '';
  
  const normalized = normalizeString(val);
  
  if (map[val]) return map[val];
  if (map[normalized]) return map[normalized];
  
  for (const [key, value] of Object.entries(map)) {
    if (normalizeString(key) === normalized) return value;
  }
  
  for (const [key, value] of Object.entries(map)) {
    const normalizedKey = normalizeString(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      return value;
    }
  }
  
  return val;
}

function validateReligiousLevel(value: string | null | undefined): string {
  if (!value) return '';
  
  if (VALID_RELIGIOUS_LEVELS.includes(value as any)) return value;
  
  const mapped = mapValue(value, RELIGIOUS_LEVEL_MAP);
  if (VALID_RELIGIOUS_LEVELS.includes(mapped as any)) return mapped;
  
  console.log(`[CardImport] Unknown religiousLevel: "${value}" -> defaulting to empty`);
  return '';
}

function validateMaritalStatus(value: string | null | undefined): string {
  if (!value) return 'single';
  
  if (VALID_MARITAL_STATUSES.includes(value as any)) return value;
  
  const mapped = mapValue(value, MARITAL_STATUS_MAP);
  if (VALID_MARITAL_STATUSES.includes(mapped as any)) return mapped;
  
  console.log(`[CardImport] Unknown maritalStatus: "${value}" -> defaulting to "single"`);
  return 'single';
}

function mapSingleOrigin(origin: string): string | null {
  const trimmed = origin.trim();
  if (!trimmed) return null;
  
  if (VALID_ORIGINS.includes(trimmed as any)) return trimmed;
  
  const mapped = SINGLE_ORIGIN_MAP[trimmed] || SINGLE_ORIGIN_MAP[trimmed.toLowerCase()];
  if (mapped && VALID_ORIGINS.includes(mapped as any)) return mapped;
  
  for (const [key, value] of Object.entries(SINGLE_ORIGIN_MAP)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return value;
  }
  
  return null;
}

function validateOrigin(value: string | null | undefined): string {
  if (!value) return '';
  
  const trimmed = value.trim();
  
  if (trimmed === 'מעורב' || trimmed === 'מעורבת' || trimmed.toLowerCase() === 'mixed') {
    return 'מעורב';
  }
  
  const separators = /[,،/-]|\s+ו\s*|\s+and\s+/gi;
  const parts = trimmed.split(separators).map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length === 0) return '';
  
  const mappedOrigins: string[] = [];
  const seenOrigins = new Set<string>();
  
  for (const part of parts) {
    const mapped = mapSingleOrigin(part);
    if (mapped && mapped !== 'מעורב' && mapped !== 'אחר' && !seenOrigins.has(mapped)) {
      mappedOrigins.push(mapped);
      seenOrigins.add(mapped);
    }
  }
  
  if (mappedOrigins.length === 0) {
    for (const origin of VALID_ORIGINS) {
      if (origin !== 'מעורב' && origin !== 'אחר' && trimmed.includes(origin)) {
        if (!seenOrigins.has(origin)) {
          mappedOrigins.push(origin);
          seenOrigins.add(origin);
        }
      }
    }
  }
  
  if (mappedOrigins.length === 0) {
    console.log(`[CardImport] Unknown origin: "${value}" -> defaulting to "אחר"`);
    return 'אחר';
  }
  
  if (mappedOrigins.length === 1) {
    return mappedOrigins[0];
  }
  
  console.log(`[CardImport] Multiple origins detected: "${value}" -> "${mappedOrigins.join(', ')}"`);
  return mappedOrigins.join(', ');
}

function detectLanguageFromText(text: string): string {
  if (!text || text.trim() === '') return 'עברית';
  
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  
  if (hebrewChars > englishChars) {
    return 'עברית';
  } else if (englishChars > hebrewChars) {
    return 'אנגלית';
  }
  
  return 'עברית';
}

// ---------------------------------------------------------------------------
// UPDATED PROMPT - NO INVENTION, NO DUPLICATION
// ---------------------------------------------------------------------------

const SINGLE_CARD_PROMPT = `You are an expert data extraction system for a Jewish matchmaking (shidduch) platform in Israel.

=== CRITICAL EXTRACTION RULE - DO NOT INVENT ANYTHING ===
You must ONLY extract information that is EXPLICITLY written in the source.
- If a field is not mentioned → return ""
- DO NOT infer, guess, or generate content
- Copy EXACT wording from source when available
- DO NOT duplicate content in multiple fields

=== FIELD-SPECIFIC RULES ===

PERSONALITY (אופי ותכונות):
- ONLY copy text that EXPLICITLY describes character/personality traits
- Look for keywords: "אופי", "תכונות", "אני", descriptions like "רגוע", "שמח", "חברותי"
- If source says "אופי: רגוע ושמח" → copy exactly "רגוע ושמח"
- If NO explicit personality description → return ""
- DO NOT infer personality from job, hobbies, or other fields
- DO NOT generate generic descriptions

Examples:
✅ Source: "אופי: חברותי ואחראי" → personality: "חברותי ואחראי"
✅ Source: "תכונות: רגוע, אוהב לעזור" → personality: "רגוע, אוהב לעזור"
❌ Source: "עובד בהייטק" → personality: "" (NOT "טכנולוגי" - that's invention!)
❌ Source: no personality mentioned → personality: "" (NOT "נחמד" - that's invention!)

LOOKING FOR (מחפש/ת):
- ONLY copy text that EXPLICITLY describes what they seek in a partner
- Look for keywords: "מחפש", "מחפשת", "רוצה", "חשוב לי ש", "מעוניין ב"
- Copy the EXACT wording from source
- If NO explicit "looking for" section → return ""
- DO NOT infer or generate preferences

Examples:
✅ Source: "מחפשת: בחור דתי לאומי רציני" → lookingFor: "בחור דתי לאומי רציני"
✅ Source: "רוצה מישהי חברותית ואחראית" → lookingFor: "מישהי חברותית ואחראית"
❌ Source: no "looking for" mentioned → lookingFor: "" (NOT "מישהו דומה" - that's invention!)

CITY (עיר מגורים):
- ONLY extract if city name is EXPLICITLY mentioned
- Look for: "גר/ה ב", "מ", "תושב/ת", specific city names
- If source says "גר בירושלים" → "ירושלים"
- If source says "מתל אביב" → "תל אביב"
- If source says only "מרכז" or "השרון" without specific city → return ""
- If NO city mentioned → return ""
- DO NOT guess city from phone area codes, institutions, or other clues

Examples:
✅ Source: "גר בחיפה" → city: "חיפה"
✅ Source: "מירושלים" → city: "ירושלים"
❌ Source: "לומד בישיבה בירושלים" → city: "" (studying there ≠ living there)
❌ Source: "מרכז הארץ" → city: "" (region, not city)
❌ Source: "052-xxx" → city: "" (phone area code is NOT city!)

=== MARITAL STATUS (ONLY 3 OPTIONS) ===
You MUST choose one of these EXACT values:
1. "single" - רווק/ה (never married)
2. "divorced" - גרוש/ה (was married, OR separated/פרוד)
3. "widowed" - אלמן/ה (spouse passed away)

Detection logic:
- רווק, רווקה, פנוי, פנויה, לא נשוי, לא נשואה → "single"
- גרוש, גרושה, פרוד, פרודה, התגרש, התגרשה, נשוי בעבר → "divorced"
- אלמן, אלמנה → "widowed"
- No marital status mentioned + no children mentioned → "single" (default for dating profiles)
- Children mentioned but no marital status → "divorced" (likely was married before)

=== RELIGIOUS LEVEL ===
Choose the BEST matching value from this EXACT list:
- "dati_leumi_standard" - דתי/ה לאומי/ת רגיל/ה
- "dati_leumi_liberal" - דתי/ה לאומי/ת ליברלי/ת, דתי לייט, פתוח
- "dati_leumi_torani" - דתי/ה תורני/ת, חרד"ל
- "masorti_strong" - מסורתי/ת שומר/ת מסורת
- "masorti_light" - מסורתי/ת קל/ה
- "secular_traditional_connection" - חילוני/ת עם זיקה למסורת
- "secular" - חילוני/ת לגמרי
- "spiritual_not_religious" - רוחני/ת
- "charedi_modern" - חרדי/ת מודרני/ת
- "charedi_litvak" - חרדי/ת ליטאי/ת
- "charedi_sephardic" - חרדי/ת ספרדי/ת (ש"ס)
- "charedi_hasidic" - חסידי/ת
- "chabad" - חב"ד
- "breslov" - ברסלב
- "other" - אחר

If not explicitly mentioned → return ""

=== ORIGIN (מוצא) ===
Valid single origins: "אשכנזי", "ספרדי", "מזרחי", "תימני", "מרוקאי", "עיראקי", "פרסי", "כורדי", "תוניסאי", "לובי", "אתיופי", "גרוזיני", "בוכרי", "הודי", "תורכי", "אחר"

MULTIPLE ORIGINS handling:
- If TWO or more origins mentioned (e.g., "אשכנזי וספרדי", "חצי מרוקאי חצי עיראקי") → return BOTH separated by comma: "אשכנזי, ספרדי" or "מרוקאי, עיראקי"
- ONLY return "מעורב" if person explicitly wrote "מעורב" or "מעורבת"
- If no origin mentioned → return ""

Examples:
✅ "אבא אשכנזי אמא ספרדיה" → "אשכנזי, ספרדי"
✅ "חצי תימני חצי מרוקאי" → "תימני, מרוקאי"
✅ "מוצא מעורב" → "מעורב"
✅ "אשכנזי" → "אשכנזי"
❌ Not mentioned → ""

=== ABOUT FIELD (טקסט מקור) ===
CRITICAL: Copy the COMPLETE original source text EXACTLY ONCE
- DO NOT duplicate any content
- DO NOT add interpretations or summaries
- DO NOT reorganize or reformat
- Just the raw original text as-is, ONE TIME ONLY
- This field should contain the ENTIRE source text for reference

=== MANUAL ENTRY TEXT ===
Leave this field EMPTY (""). It will be constructed server-side to avoid duplication.

=== OTHER FIELDS (only if explicitly mentioned) ===
- firstName, lastName: Extract from text
- gender: "MALE" or "FEMALE" (infer from Hebrew grammar: מחפש=MALE, מחפשת=FEMALE, רווק=MALE, רווקה=FEMALE)
- age: Number only (if mentioned)
- height: In cm, e.g., 175 (convert 1.75 → 175)
- occupation: Job/profession - ONLY if explicitly mentioned, otherwise ""
- education: Institution or field - ONLY if explicitly mentioned, otherwise ""
- educationLevel: Level achieved - ONLY if explicitly mentioned, otherwise ""
- phone: Phone number if mentioned
- referredBy: Default "קבוצת שידוכים שוובל" if not specified
- hobbies: ONLY if explicitly mentioned, otherwise ""
- familyDescription: ONLY if explicitly mentioned, otherwise ""
- militaryService: ONLY if explicitly mentioned, otherwise ""
- nativeLanguage: Detect from text language (mostly Hebrew → "עברית", mostly English → "אנגלית")
- additionalLanguages: ONLY if other languages explicitly mentioned, otherwise ""
- hasChildrenFromPrevious: "true" only if explicitly stated, "false" if explicitly stated no children, "" if not mentioned

=== OUTPUT FORMAT ===
Return ONLY valid JSON (avoid all duplication):

{
  "fields": {
    "firstName": "",
    "lastName": "",
    "gender": "MALE" | "FEMALE" | "",
    "age": "",
    "height": "",
    "maritalStatus": "single" | "divorced" | "widowed",
    "religiousLevel": "",
    "origin": "",
    "city": "",
    "occupation": "",
    "education": "",
    "educationLevel": "",
    "phone": "",
    "referredBy": "קבוצת שידוכים שוובל",
    "personality": "",
    "lookingFor": "",
    "hobbies": "",
    "familyDescription": "",
    "militaryService": "",
    "nativeLanguage": "",
    "additionalLanguages": "",
    "hasChildrenFromPrevious": "",
    "about": "<complete original text ONCE - no duplication>",
    "manualEntryText": ""
  },
  "confidence": "high" | "medium" | "low",
  "notes": ""
}`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('[CardImport] GEMINI_API_KEY is not configured!');
      return NextResponse.json(
        { success: false, error: 'AI service not configured. Please contact admin.' },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const mode = formData.get('mode') as string;

    if (mode !== 'single-card') {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Expected "single-card"' },
        { status: 400 }
      );
    }

    const rawText = (formData.get('rawText') as string) || '';
    const imageFiles = formData.getAll('images') as File[];

    if (!rawText.trim() && imageFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No input provided. Add text or images.' },
        { status: 400 }
      );
    }

    console.log(
      `[CardImport] Processing: ${imageFiles.length} images, ${rawText.length} chars text`
    );

    // Build Gemini content parts
    const parts: any[] = [];

    let promptText = SINGLE_CARD_PROMPT + '\n\n';

    if (rawText.trim()) {
      promptText += `=== PASTED TEXT ===\n${rawText}\n=== END TEXT ===\n\n`;
    }

    if (imageFiles.length > 0) {
      promptText += `${imageFiles.length} image(s) attached. Extract text from forms/documents if present.\n\n`;
    }

    promptText += 'Return JSON:';
    parts.push({ text: promptText });

    // Add images
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      parts.push({
        inlineData: {
          mimeType: file.type || 'image/jpeg',
          data: buffer.toString('base64'),
        },
      });
    }

    // Call Gemini
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const responseText = result.response.text();
    console.log(`[CardImport] Got response (${responseText.length} chars)`);

    // Parse response
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI returned invalid response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const fields = parsed.fields || {};

    // Log raw values before validation
    console.log(`[CardImport] Raw maritalStatus from AI: "${fields.maritalStatus}"`);
    console.log(`[CardImport] Raw religiousLevel from AI: "${fields.religiousLevel}"`);
    console.log(`[CardImport] Raw origin from AI: "${fields.origin}"`);
    console.log(`[CardImport] Raw city from AI: "${fields.city}"`);

    // Validate and normalize values
    fields.maritalStatus = validateMaritalStatus(fields.maritalStatus);
    fields.religiousLevel = validateReligiousLevel(fields.religiousLevel);
    fields.origin = validateOrigin(fields.origin);

    // Validate city - only keep if it's an actual city name
    if (fields.city) {
      const cityLower = fields.city.toLowerCase().trim();
      const invalidCityTerms = ['מרכז', 'דרום', 'צפון', 'השרון', 'שפלה', 'הגליל', 'הנגב', 'יהודה', 'שומרון'];
      if (invalidCityTerms.some(term => cityLower.includes(term))) {
        console.log(`[CardImport] "${fields.city}" is a region, not a city - clearing`);
        fields.city = '';
      }
    }

    // Log validated values
    console.log(`[CardImport] Validated maritalStatus: "${fields.maritalStatus}"`);
    console.log(`[CardImport] Validated religiousLevel: "${fields.religiousLevel}"`);
    console.log(`[CardImport] Validated origin: "${fields.origin}"`);
    console.log(`[CardImport] Validated city: "${fields.city}"`);

    // Normalize height
    if (fields.height) {
      let h = parseFloat(fields.height);
      if (h < 3) h = Math.round(h * 100);
      if (h < 100 || h > 250) fields.height = '';
      else fields.height = String(Math.round(h));
    }

    // Default referredBy if empty
    if (!fields.referredBy || fields.referredBy.trim() === '') {
      fields.referredBy = 'קבוצת שידוכים שוובל';
    }

    // Handle "about" field - ensure it contains the source text ONCE, no duplication
    if (!fields.about || fields.about.trim() === '') {
      if (rawText.trim()) {
        fields.about = rawText.trim();
      }
    } else {
      // Remove duplicate lines
      const aboutLines = fields.about.split('\n');
      const uniqueLines: string[] = [];
      const seenLines = new Set<string>();
      
      for (const line of aboutLines) {
        const trimmed = line.trim();
        if (trimmed && !seenLines.has(trimmed)) {
          seenLines.add(trimmed);
          uniqueLines.push(line);
        } else if (!trimmed) {
          uniqueLines.push(line);
        }
      }
      
      fields.about = uniqueLines.join('\n').trim();
    }

    // manualEntryText should be empty - built at save time
    fields.manualEntryText = '';

    // Handle language detection
    if (!fields.nativeLanguage || fields.nativeLanguage.trim() === '') {
      const sourceText = fields.about || rawText || '';
      fields.nativeLanguage = detectLanguageFromText(sourceText);
      console.log(`[CardImport] Detected nativeLanguage: "${fields.nativeLanguage}"`);
    }

    if (!fields.additionalLanguages) {
      fields.additionalLanguages = '';
    }

    // Add notes about missing critical fields
    let notes = parsed.notes || '';
    if (!fields.religiousLevel) {
      notes += notes ? ' | ' : '';
      notes += '⚠️ לא זוהתה רמה דתית - נא לבחור ידנית';
    }
    if (!fields.city) {
      notes += notes ? ' | ' : '';
      notes += '⚠️ לא זוהה מיקום מגורים - נא להזין ידנית';
    }

    return NextResponse.json({
      success: true,
      data: {
        fields,
        confidence: parsed.confidence || 'medium',
        notes: notes || null,
      },
    });
  } catch (error) {
    console.error('[CardImport] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}