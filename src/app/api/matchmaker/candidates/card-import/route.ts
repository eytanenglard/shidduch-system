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

// רק 3 אופציות תקינות!
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
  // עברית - זכר
  'רווק': 'single',
  'גרוש': 'divorced',
  'אלמן': 'widowed',
  // עברית - נקבה
  'רווקה': 'single',
  'גרושה': 'divorced',
  'אלמנה': 'widowed',
  // אנגלית
  'single': 'single',
  'divorced': 'divorced',
  'widowed': 'widowed',
  // וריאציות
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
  // פרוד -> גרוש (כי אין אופציה פרוד)
  'פרוד': 'divorced',
  'פרודה': 'divorced',
  'separated': 'divorced',
};

const RELIGIOUS_LEVEL_MAP: Record<string, string> = {
  // דתי לאומי סטנדרטי
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
  
  // דתי לאומי ליברלי
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
  
  // דתי לאומי תורני / חרד"ל
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
  
  // מסורתי חזק
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
  
  // מסורתי לייט
  'מסורתי לייט': 'masorti_light',
  'מסורתי קל': 'masorti_light',
  'מסורתית קלה': 'masorti_light',
  'קצת מסורתי': 'masorti_light',
  'קצת מסורתית': 'masorti_light',
  'מסורתי רחוק מדת': 'masorti_light',
  'masorti_light': 'masorti_light',
  
  // חילוני עם זיקה למסורת
  'חילוני עם זיקה למסורת': 'secular_traditional_connection',
  'חילונית עם זיקה למסורת': 'secular_traditional_connection',
  'חילוני מסורתי': 'secular_traditional_connection',
  'חילונית מסורתית': 'secular_traditional_connection',
  'חילוני עם מסורת': 'secular_traditional_connection',
  'secular_traditional_connection': 'secular_traditional_connection',
  
  // חילוני
  'חילוני': 'secular',
  'חילונית': 'secular',
  'חילוני לגמרי': 'secular',
  'לא דתי': 'secular',
  'לא דתית': 'secular',
  'secular': 'secular',
  
  // רוחני
  'רוחני': 'spiritual_not_religious',
  'רוחנית': 'spiritual_not_religious',
  'רוחני לא דתי': 'spiritual_not_religious',
  'רוחנית לא דתית': 'spiritual_not_religious',
  'spiritual': 'spiritual_not_religious',
  'spiritual_not_religious': 'spiritual_not_religious',
  
  // חרדי מודרני
  'חרדי מודרני': 'charedi_modern',
  'חרדית מודרנית': 'charedi_modern',
  'חרדי לייט': 'charedi_modern',
  'חרדית לייט': 'charedi_modern',
  'חרדי פתוח': 'charedi_modern',
  'charedi_modern': 'charedi_modern',
  
  // חרדי ליטאי
  'חרדי ליטאי': 'charedi_litvak',
  'חרדית ליטאית': 'charedi_litvak',
  'ליטאי': 'charedi_litvak',
  'ליטאית': 'charedi_litvak',
  'חרדי': 'charedi_litvak',
  'חרדית': 'charedi_litvak',
  'litvak': 'charedi_litvak',
  'charedi': 'charedi_litvak',
  'charedi_litvak': 'charedi_litvak',
  
  // חרדי ספרדי
  'חרדי ספרדי': 'charedi_sephardic',
  'חרדית ספרדית': 'charedi_sephardic',
  'ש"ס': 'charedi_sephardic',
  'שס': 'charedi_sephardic',
  'ספרדי חרדי': 'charedi_sephardic',
  'charedi_sephardic': 'charedi_sephardic',
  
  // חרדי חסידי
  'חרדי חסידי': 'charedi_hasidic',
  'חרדית חסידית': 'charedi_hasidic',
  'חסידי': 'charedi_hasidic',
  'חסידית': 'charedi_hasidic',
  'חסיד': 'charedi_hasidic',
  'hasidic': 'charedi_hasidic',
  'charedi_hasidic': 'charedi_hasidic',
  
  // חב"ד
  'חב"ד': 'chabad',
  'חבד': 'chabad',
  "חב''ד": 'chabad',
  'חב״ד': 'chabad',
  'lubavitch': 'chabad',
  'chabad': 'chabad',
  
  // ברסלב
  'ברסלב': 'breslov',
  'ברסלבר': 'breslov',
  'נ נח': 'breslov',
  'breslov': 'breslov',
  
  // אחר
  'בעל תשובה': 'other',
  'בעלת תשובה': 'other',
  'חוזר בתשובה': 'other',
  'חוזרת בתשובה': 'other',
  'גר': 'other',
  'גיורת': 'other',
  'אחר': 'other',
  'other': 'other',
};

const ORIGIN_MAP: Record<string, string> = {
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
  'חצי חצי': 'מעורב',
  'משולב': 'מעורב',
  
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
  
  // בדיקה ישירה
  if (map[val]) return map[val];
  if (map[normalized]) return map[normalized];
  
  // בדיקה case-insensitive
  for (const [key, value] of Object.entries(map)) {
    if (normalizeString(key) === normalized) return value;
  }
  
  // בדיקת הכלה
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
  
  // אם זה כבר ערך תקין
  if (VALID_RELIGIOUS_LEVELS.includes(value as any)) return value;
  
  // נסה למפות
  const mapped = mapValue(value, RELIGIOUS_LEVEL_MAP);
  if (VALID_RELIGIOUS_LEVELS.includes(mapped as any)) return mapped;
  
  console.log(`[CardImport] Unknown religiousLevel: "${value}" -> defaulting to empty`);
  return '';
}

function validateMaritalStatus(value: string | null | undefined): string {
  if (!value) return 'single'; // ברירת מחדל לרווק
  
  // אם זה כבר ערך תקין
  if (VALID_MARITAL_STATUSES.includes(value as any)) return value;
  
  // נסה למפות
  const mapped = mapValue(value, MARITAL_STATUS_MAP);
  if (VALID_MARITAL_STATUSES.includes(mapped as any)) return mapped;
  
  console.log(`[CardImport] Unknown maritalStatus: "${value}" -> defaulting to "single"`);
  return 'single';
}

function validateOrigin(value: string | null | undefined): string {
  if (!value) return '';
  
  // אם זה כבר ערך תקין
  if (VALID_ORIGINS.includes(value as any)) return value;
  
  // נסה למפות
  const mapped = mapValue(value, ORIGIN_MAP);
  if (VALID_ORIGINS.includes(mapped as any)) return mapped;
  
  console.log(`[CardImport] Unknown origin: "${value}" -> defaulting to "אחר"`);
  return 'אחר';
}

/**
 * זיהוי שפה לפי תוכן הטקסט
 */
function detectLanguageFromText(text: string): string {
  if (!text || text.trim() === '') return 'עברית';
  
  // ספירת תווים עבריים ואנגליים
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  
  if (hebrewChars > englishChars) {
    return 'עברית';
  } else if (englishChars > hebrewChars) {
    return 'אנגלית';
  }
  
  return 'עברית'; // ברירת מחדל
}


// ---------------------------------------------------------------------------
// Improved Prompt - ONLY 3 marital status options!
// ---------------------------------------------------------------------------

const SINGLE_CARD_PROMPT = `You are an expert data extraction system for a Jewish matchmaking (shidduch) platform in Israel.

CRITICAL RULES FOR MARITAL STATUS:
There are ONLY 3 valid options - you MUST choose one of these:
1. "single" - רווק/ה (never married)
2. "divorced" - גרוש/ה (was married and divorced, OR separated/פרוד)
3. "widowed" - אלמן/ה (spouse passed away)

MARITAL STATUS DETECTION LOGIC:
- If text says: רווק, רווקה, פנוי, פנויה, לא נשוי, לא נשואה → return "single"
- If text says: גרוש, גרושה, פרוד, פרודה, נשוי בעבר, התגרש → return "divorced"
- If text says: אלמן, אלמנה → return "widowed"
- If NO marital status mentioned AND NO children mentioned → return "single" (default for dating profiles)
- If children are mentioned but no marital status → return "divorced" (likely was married)

RELIGIOUS LEVEL - Choose the BEST match from these options:
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

LANGUAGE DETECTION:
- nativeLanguage: Detect from text language. If text is mostly Hebrew → "עברית". If mostly English → "אנגלית"
- additionalLanguages: Any other languages mentioned

VALID ORIGIN VALUES (Hebrew):
"אשכנזי", "ספרדי", "מזרחי", "תימני", "מרוקאי", "עיראקי", "פרסי", "כורדי", "תוניסאי", "לובי", "אתיופי", "גרוזיני", "בוכרי", "הודי", "תורכי", "מעורב", "אחר"

OTHER FIELDS:
- firstName, lastName: שם פרטי ושם משפחה
- gender: "MALE" or "FEMALE" (infer from Hebrew: מחפש=MALE, מחפשת=FEMALE, רווק=MALE, רווקה=FEMALE)
- age: number only
- height: in cm (convert 1.75 → 175)
- city: city name
- occupation: job/profession
- education: institution or field of study
- educationLevel: "תיכון", "סמינר", "ישיבה", "מכינה", "תואר ראשון", "תואר שני", "תואר שלישי", "הנדסאי", "תעודה מקצועית", "אחר"
- phone: phone number
- referredBy: default "קבוצת שידוכים שוובל" if not specified
- personality: character description
- lookingFor: what they're looking for in a partner
- hobbies: hobbies/interests
- familyDescription: family background
- militaryService: military/national service
- hasChildrenFromPrevious: "true" if has children, "false" if explicitly no, "" if unknown
- about: COPY THE ENTIRE ORIGINAL TEXT AS-IS

Return ONLY valid JSON:
{
  "fields": {
    "firstName": "",
    "lastName": "",
    "gender": "MALE" | "FEMALE" | "",
    "age": "",
    "height": "",
    "maritalStatus": "single" | "divorced" | "widowed",
    "religiousLevel": "<one of the exact values above>",
    "origin": "<Hebrew value from list>",
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
    "nativeLanguage": "עברית" | "אנגלית" | "<detected language>",
    "additionalLanguages": "",
    "hasChildrenFromPrevious": "",
    "about": "<complete original text>",
    "manualEntryText": "<complete original text>"
  },
  "imageClassifications": [
    { "index": 0, "type": "photo" | "form" | "combined", "extractedText": "" }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": ""
}`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // בדיקת API key
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
      promptText += `${imageFiles.length} image(s) attached. Analyze each one.\n\n`;
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

    // Validate and normalize values
    fields.maritalStatus = validateMaritalStatus(fields.maritalStatus);
    fields.religiousLevel = validateReligiousLevel(fields.religiousLevel);
    
    if (fields.origin) {
      fields.origin = validateOrigin(fields.origin);
    }

    // Log validated values
    console.log(`[CardImport] Validated maritalStatus: "${fields.maritalStatus}"`);
    console.log(`[CardImport] Validated religiousLevel: "${fields.religiousLevel}"`);

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

    // Ensure about has the raw source text
    if (!fields.about && rawText.trim()) {
      fields.about = rawText;
    }

    // Build manualEntryText if AI didn't
    if (!fields.manualEntryText) {
      fields.manualEntryText = fields.about || rawText || '';
    }

    // Handle language detection - if AI didn't detect, use our function
    if (!fields.nativeLanguage || fields.nativeLanguage.trim() === '') {
      const sourceText = fields.about || rawText || '';
      fields.nativeLanguage = detectLanguageFromText(sourceText);
      console.log(`[CardImport] Detected nativeLanguage: "${fields.nativeLanguage}"`);
    }

    if (!fields.additionalLanguages) {
      fields.additionalLanguages = '';
    }

    // Add any OCR text from images
    const imageClassifications = parsed.imageClassifications || [];
    const ocrTexts = imageClassifications
      .filter((ic: any) => ic.extractedText && ic.type !== 'photo')
      .map((ic: any) => ic.extractedText);

    if (ocrTexts.length > 0) {
      const ocrBlock = '\n\n--- טקסט שחולץ מתמונות ---\n' + ocrTexts.join('\n');
      
      if (fields.about && !fields.about.includes('טקסט שחולץ מתמונות')) {
        fields.about = fields.about + ocrBlock;
      } else if (!fields.about) {
        fields.about = ocrTexts.join('\n');
      }

      if (fields.manualEntryText && !fields.manualEntryText.includes('טקסט שחולץ מתמונות')) {
        fields.manualEntryText = fields.manualEntryText + ocrBlock;
      }
    }

    // Mark form images
    const formImageIndices = imageClassifications
      .filter((ic: any) => ic.type === 'form' || ic.type === 'combined')
      .map((ic: any) => ic.index);

    // Add notes about missing critical fields
    let notes = parsed.notes || '';
    if (!fields.religiousLevel) {
      notes += notes ? ' | ' : '';
      notes += '⚠️ לא זוהתה רמה דתית - נא לבחור ידנית';
    }

    return NextResponse.json({
      success: true,
      data: {
        fields,
        imageClassifications,
        formImageIndices,
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