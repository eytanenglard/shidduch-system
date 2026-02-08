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
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2,
  },
});

// ---------------------------------------------------------------------------
// Valid options (must match AddManualCandidateDialog exactly)
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

const VALID_MARITAL_STATUSES = ['single', 'divorced', 'widowed', 'separated'] as const;

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
// Mapping helpers
// ---------------------------------------------------------------------------

const MARITAL_STATUS_MAP: Record<string, string> = {
  'רווק': 'single',
  'רווקה': 'single',
  'גרוש': 'divorced',
  'גרושה': 'divorced',
  'אלמן': 'widowed',
  'אלמנה': 'widowed',
  'פרוד': 'separated',
  'פרודה': 'separated',
};

const RELIGIOUS_LEVEL_MAP: Record<string, string> = {
  // דתי לאומי - וריאציות
  'דתי לאומי': 'dati_leumi_standard',
  'דתית לאומית': 'dati_leumi_standard',
  'דתיה לאומית': 'dati_leumi_standard',
  'דל"ת': 'dati_leumi_standard',
  'דתי לאומי סטנדרטי': 'dati_leumi_standard',
  'דתית לאומית סטנדרטית': 'dati_leumi_standard',
  'דתי': 'dati_leumi_standard',
  'דתית': 'dati_leumi_standard',
  
  // דתי לאומי ליברלי
  'דתי לאומי ליברלי': 'dati_leumi_liberal',
  'דתית לאומית ליברלית': 'dati_leumi_liberal',
  'דתי ליברלי': 'dati_leumi_liberal',
  'דתית ליברלית': 'dati_leumi_liberal',
  
  // דתי לאומי תורני / חרד"ל
  'דתי לאומי תורני': 'dati_leumi_torani',
  'דתית לאומית תורנית': 'dati_leumi_torani',
  'חרד"ל': 'dati_leumi_torani',
  'חרדל': 'dati_leumi_torani',
  'תורני': 'dati_leumi_torani',
  'תורנית': 'dati_leumi_torani',
  
  // מסורתי חזק (קרוב לדת)
  'מסורתי': 'masorti_strong',
  'מסורתית': 'masorti_strong',
  'מסורתי קרוב לדת': 'masorti_strong',
  'מסורתית קרובה לדת': 'masorti_strong',
  'מסורתי חזק': 'masorti_strong',
  
  // מסורתי קל
  'מסורתי לייט': 'masorti_light',
  'מסורתי קל': 'masorti_light',
  'מסורתית קלה': 'masorti_light',
  'קצת מסורתי': 'masorti_light',
  
  // חילוני עם זיקה למסורת
  'חילוני עם זיקה למסורת': 'secular_traditional_connection',
  'חילונית עם זיקה למסורת': 'secular_traditional_connection',
  'חילוני מסורתי': 'secular_traditional_connection',
  'חילונית מסורתית': 'secular_traditional_connection',
  
  // חילוני
  'חילוני': 'secular',
  'חילונית': 'secular',
  
  // רוחני
  'רוחני': 'spiritual_not_religious',
  'רוחנית': 'spiritual_not_religious',
  'רוחני לא דתי': 'spiritual_not_religious',
  
  // חרדי מודרני
  'חרדי מודרני': 'charedi_modern',
  'חרדית מודרנית': 'charedi_modern',
  
  // חרדי ליטאי
  'חרדי ליטאי': 'charedi_litvak',
  'חרדית ליטאית': 'charedi_litvak',
  'ליטאי': 'charedi_litvak',
  'ליטאית': 'charedi_litvak',
  'חרדי': 'charedi_litvak', // ברירת מחדל לחרדי
  'חרדית': 'charedi_litvak',
  
  // חרדי ספרדי
  'חרדי ספרדי': 'charedi_sephardic',
  'חרדית ספרדית': 'charedi_sephardic',
  'ש"ס': 'charedi_sephardic',
  
  // חרדי חסידי
  'חרדי חסידי': 'charedi_hasidic',
  'חרדית חסידית': 'charedi_hasidic',
  'חסידי': 'charedi_hasidic',
  'חסידית': 'charedi_hasidic',
  
  // חב"ד
  'חב"ד': 'chabad',
  'חבד': 'chabad',
  "חב''ד": 'chabad',
  
  // ברסלב
  'ברסלב': 'breslov',
  'ברסלבר': 'breslov',
  
  // אחר / בעל תשובה
  'בעל תשובה': 'other',
  'בעלת תשובה': 'other',
  'חוזר בתשובה': 'other',
  'חוזרת בתשובה': 'other',
  'אחר': 'other',
};

const ORIGIN_MAP: Record<string, string> = {
  // אשכנזי
  'אשכנזי': 'אשכנזי',
  'אשכנזית': 'אשכנזי',
  'אשכנזיה': 'אשכנזי',
  'ASHKENAZI': 'אשכנזי',
  'אירופאי': 'אשכנזי',
  'פולני': 'אשכנזי',
  'רוסי': 'אשכנזי',
  'הונגרי': 'אשכנזי',
  'רומני': 'אשכנזי',
  'גרמני': 'אשכנזי',
  
  // ספרדי
  'ספרדי': 'ספרדי',
  'ספרדית': 'ספרדי',
  'ספרדיה': 'ספרדי',
  'SEPHARDI': 'ספרדי',
  'ספרדי טהור': 'ספרדי',
  'בולגרי': 'ספרדי',
  'יווני': 'ספרדי',
  
  // מזרחי (כללי)
  'מזרחי': 'מזרחי',
  'מזרחית': 'מזרחי',
  'מזרחיה': 'מזרחי',
  
  // תימני
  'תימני': 'תימני',
  'תימנית': 'תימני',
  'תימניה': 'תימני',
  'תימן': 'תימני',
  
  // מרוקאי
  'מרוקאי': 'מרוקאי',
  'מרוקאית': 'מרוקאי',
  'מרוקו': 'מרוקאי',
  
  // עיראקי
  'עיראקי': 'עיראקי',
  'עיראקית': 'עיראקי',
  'עירק': 'עיראקי',
  'בבלי': 'עיראקי',
  
  // פרסי
  'פרסי': 'פרסי',
  'פרסית': 'פרסי',
  'פרסיה': 'פרסי',
  'איראני': 'פרסי',
  'איראנית': 'פרסי',
  'איראן': 'פרסי',
  'פרס': 'פרסי',
  
  // כורדי
  'כורדי': 'כורדי',
  'כורדית': 'כורדי',
  'כורדיסטן': 'כורדי',
  
  // תוניסאי
  'תוניסאי': 'תוניסאי',
  'תוניסאית': 'תוניסאי',
  'תוניסיה': 'תוניסאי',
  'תוניס': 'תוניסאי',
  
  // לובי
  'לובי': 'לובי',
  'לובית': 'לובי',
  'טריפוליטאי': 'לובי',
  'טריפוליטאית': 'לובי',
  'לוב': 'לובי',
  
  // אתיופי
  'אתיופי': 'אתיופי',
  'אתיופית': 'אתיופי',
  'אתיופיה': 'אתיופי',
  
  // גרוזיני
  'גרוזיני': 'גרוזיני',
  'גרוזינית': 'גרוזיני',
  'גורג\'י': 'גרוזיני',
  'גורג\'ית': 'גרוזיני',
  'גאורגי': 'גרוזיני',
  'גאורגיה': 'גרוזיני',
  
  // בוכרי
  'בוכרי': 'בוכרי',
  'בוכרית': 'בוכרי',
  'בוכרה': 'בוכרי',
  'אוזבקי': 'בוכרי',
  
  // הודי
  'הודי': 'הודי',
  'הודית': 'הודי',
  'קוצ\'יני': 'הודי',
  'קוצ\'ינית': 'הודי',
  'בני ישראל': 'הודי',
  
  // תורכי
  'תורכי': 'תורכי',
  'תורכית': 'תורכי',
  'תורכיה': 'תורכי',
  
  // מעורב
  'מעורב': 'מעורב',
  'מעורבת': 'מעורב',
  'MIXED': 'מעורב',
  'חצי חצי': 'מעורב',
  'משולב': 'מעורב',
  
  // אחר
  'אחר': 'אחר',
  'OTHER': 'אחר',
  'לא ידוע': 'אחר',
};


function mapValue(val: string | null | undefined, map: Record<string, string>): string {
  if (!val) return '';
  const normalized = val.trim();
  
  // Try exact match first
  if (map[normalized]) return map[normalized];
  
  // Try lowercase match
  const lowerVal = normalized.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (key.toLowerCase() === lowerVal) return value;
  }
  
  // Try partial match (contains)
  for (const [key, value] of Object.entries(map)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  
  return val; // Return original if no match
}

// Validate that the value is in the allowed list
function validateReligiousLevel(value: string): string {
  if (VALID_RELIGIOUS_LEVELS.includes(value as any)) {
    return value;
  }
  // If not valid, try to map it
  const mapped = mapValue(value, RELIGIOUS_LEVEL_MAP);
  if (VALID_RELIGIOUS_LEVELS.includes(mapped as any)) {
    return mapped;
  }
  return 'other'; // Default fallback
}

function validateMaritalStatus(value: string): string {
  if (VALID_MARITAL_STATUSES.includes(value as any)) {
    return value;
  }
  const mapped = mapValue(value, MARITAL_STATUS_MAP);
  if (VALID_MARITAL_STATUSES.includes(mapped as any)) {
    return mapped;
  }
  return 'single'; // Default fallback
}

function validateOrigin(value: string): string {
  if (!value) return '';
  
  // Check if already a valid value
  if (VALID_ORIGINS.includes(value as any)) {
    return value;
  }
  
  // Try to map it
  const normalized = value.trim();
  
  // Exact match
  if (ORIGIN_MAP[normalized]) {
    return ORIGIN_MAP[normalized];
  }
  
  // Case-insensitive match
  for (const [key, mappedValue] of Object.entries(ORIGIN_MAP)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return mappedValue;
    }
  }
  
  // Partial match
  for (const [key, mappedValue] of Object.entries(ORIGIN_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return mappedValue;
    }
  }
  
  return 'אחר'; // Default fallback
}


// ---------------------------------------------------------------------------
// Prompt with exact valid options
// ---------------------------------------------------------------------------

const SINGLE_CARD_PROMPT = `You are an expert data extraction system for a Jewish matchmaking (shidduch) platform in Israel.

You receive input that may include:
- Text — pasted from a WhatsApp matchmaking group (Hebrew), containing candidate details
- Images — which can be:
  a. Personal photos of the candidate
  b. Form images — photos of a paper/digital form with the candidate's details written/printed on it
  c. Combined — a photo that includes both the person and their details

YOUR TASKS:
1. If images contain text (forms, info sheets), perform OCR and extract ALL text from them
2. Combine extracted text from images with any provided text
3. Extract ALL structured data fields from the combined text
4. Determine gender from Hebrew grammar (מחפש vs מחפשת, רווק vs רווקה) or from photo
5. Classify each image as "photo" (personal photo) or "form" (contains text/data)

FIELDS TO EXTRACT (all optional except firstName, lastName, gender):
- firstName, lastName: שם פרטי ושם משפחה
- gender: "MALE" or "FEMALE" (infer from Hebrew grammar or photo)
- age: גיל (number)
- height: גובה בס"מ (if written as 1.75 convert to 175)
- maritalStatus: MUST be one of: "single", "divorced", "widowed", "separated"
- religiousLevel: MUST be EXACTLY one of these values:
  * "dati_leumi_standard" - דתי/ה לאומי/ת (סטנדרטי)
  * "dati_leumi_liberal" - דתי/ה לאומי/ת ליברלי/ת
  * "dati_leumi_torani" - דתי/ה לאומי/ת תורני/ת, חרד"ל
  * "masorti_strong" - מסורתי/ת (קרוב/ה לדת)
  * "masorti_light" - מסורתי/ת (קשר קל למסורת)
  * "secular_traditional_connection" - חילוני/ת עם זיקה למסורת
  * "secular" - חילוני/ת
  * "spiritual_not_religious" - רוחני/ת (לאו דווקא דתי/ה)
  * "charedi_modern" - חרדי/ת מודרני/ת
  * "charedi_litvak" - חרדי/ת ליטאי/ת
  * "charedi_sephardic" - חרדי/ת ספרדי/ת
  * "charedi_hasidic" - חרדי/ת חסידי/ת
  * "chabad" - חב"ד
  * "breslov" - ברסלב
  * "other" - אחר
- origin: מוצא עדתי - MUST be EXACTLY one of these Hebrew values:
  * "אשכנזי" - Ashkenazi (European origin)
  * "ספרדי" - Sephardi (Spanish/Portuguese origin)
  * "מזרחי" - Mizrachi (Middle Eastern - general)
  * "תימני" - Yemenite
  * "מרוקאי" - Moroccan
  * "עיראקי" - Iraqi
  * "פרסי" - Persian/Iranian
  * "כורדי" - Kurdish
  * "תוניסאי" - Tunisian
  * "לובי" - Libyan/Tripolitanian
  * "אתיופי" - Ethiopian
  * "גרוזיני" - Georgian
  * "בוכרי" - Bukharian
  * "הודי" - Indian
  * "תורכי" - Turkish
  * "מעורב" - Mixed
  * "אחר" - Other
- city: עיר/אזור מגורים
- occupation: עיסוק/מקצוע
- education: מוסד לימודים / מה למד
- educationLevel: רמת השכלה (תיכון, תואר ראשון, תואר שני, סמינר, ישיבה)
- phone: מספר טלפון
- referredBy: ממליץ / דרך מי הגיע (שם + טלפון של איש קשר)
- personality: תיאור אופי ותכונות
- lookingFor: מה מחפש/ת בבן/בת זוג
- hobbies: תחביבים
- familyDescription: תיאור המשפחה
- militaryService: שירות צבאי/לאומי
- languages: שפות

IMPORTANT:
- Extract EVERY piece of information, even if partially readable
- For OCR from images: read Hebrew handwriting carefully, even if messy
- Mark unclear text with [?]
- Keep original Hebrew text in manualEntryText
- Set confidence based on data quality
- CRITICAL: For religiousLevel, maritalStatus, and origin - use ONLY the exact values listed above!

Return ONLY valid JSON:
{
  "fields": {
    "firstName": "",
    "lastName": "",
    "gender": "MALE" | "FEMALE" | "",
    "age": "",
    "height": "",
    "maritalStatus": "single" | "divorced" | "widowed" | "separated",
    "religiousLevel": "<one of the exact values listed above>",
    "origin": "<one of the exact Hebrew values listed above>",
    "city": "",
    "occupation": "",
    "education": "",
    "educationLevel": "",
    "phone": "",
    "referredBy": "",
    "personality": "",
    "lookingFor": "",
    "hobbies": "",
    "familyDescription": "",
    "militaryService": "",
    "languages": "",
    "manualEntryText": "full original text combined from all sources"
  },
  "imageClassifications": [
    { "index": 0, "type": "photo" | "form" | "combined", "extractedText": "text if any" }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "any issues or things the matchmaker should verify"
}`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // Auth check
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
      promptText += `${imageFiles.length} image(s) attached. Analyze each one - extract text from form images, classify as photo/form/combined.\n\n`;
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

    // Validate and normalize values to ensure they match exact enum values
    if (fields.maritalStatus) {
      fields.maritalStatus = validateMaritalStatus(fields.maritalStatus);
    }
    if (fields.religiousLevel) {
      fields.religiousLevel = validateReligiousLevel(fields.religiousLevel);
    }
    if (fields.origin) {
      fields.origin = validateOrigin(fields.origin);
    }

    // Normalize height
    if (fields.height) {
      let h = parseFloat(fields.height);
      if (h < 3) h = Math.round(h * 100); // 1.75 → 175
      if (h < 100 || h > 250) fields.height = '';
      else fields.height = String(Math.round(h));
    }

    // Build manualEntryText if AI didn't
    if (!fields.manualEntryText && rawText.trim()) {
      fields.manualEntryText = rawText;
    }

    // Add any OCR text from images
    const imageClassifications = parsed.imageClassifications || [];
    const ocrTexts = imageClassifications
      .filter((ic: any) => ic.extractedText && ic.type !== 'photo')
      .map((ic: any) => ic.extractedText);

    if (ocrTexts.length > 0) {
      fields.manualEntryText =
        (fields.manualEntryText || '') + '\n\n--- טקסט מתמונות ---\n' + ocrTexts.join('\n');
    }

    // Mark form images
    const formImageIndices = imageClassifications
      .filter((ic: any) => ic.type === 'form' || ic.type === 'combined')
      .map((ic: any) => ic.index);

    return NextResponse.json({
      success: true,
      data: {
        fields,
        imageClassifications,
        formImageIndices,
        confidence: parsed.confidence || 'medium',
        notes: parsed.notes || null,
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