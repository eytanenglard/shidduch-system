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
export const maxDuration = 60; // 1 minute per card

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
// Mapping helpers (copied from bulkImportService for independence)
// ---------------------------------------------------------------------------

const MARITAL_STATUS_MAP: Record<string, string> = {
  'רווק': 'single', 'רווקה': 'single',
  'גרוש': 'divorced', 'גרושה': 'divorced',
  'אלמן': 'widowed', 'אלמנה': 'widowed',
  'פרוד': 'separated', 'פרודה': 'separated',
};

const RELIGIOUS_LEVEL_MAP: Record<string, string> = {
  'חרדי': 'haredi', 'חרדית': 'haredi',
  'חרדי מודרני': 'haredi_modern',
  'דתי': 'dati', 'דתית': 'dati',
  'דתי לאומי': 'dati_leumi', 'דתית לאומית': 'dati_leumi',
  'חרד"ל': 'hardal',
  'מסורתי': 'masorti', 'מסורתית': 'masorti',
  'חילוני': 'hiloni', 'חילונית': 'hiloni',
  'חוזר בתשובה': 'baal_teshuva', 'חוזרת בתשובה': 'baal_teshuva',
  'בעל תשובה': 'baal_teshuva', 'בעלת תשובה': 'baal_teshuva',
  'חב"ד': 'chabad', 'ברסלב': 'breslov',
  'ליטאי': 'litai', 'חסידי': 'hasidi',
};

const ORIGIN_MAP: Record<string, string> = {
  'אשכנזי': 'ASHKENAZI', 'אשכנזית': 'ASHKENAZI',
  'ספרדי': 'SEPHARDI', 'ספרדיה': 'SEPHARDI', 'ספרדית': 'SEPHARDI',
  'מזרחי': 'SEPHARDI', 'מזרחית': 'SEPHARDI',
  'תימני': 'SEPHARDI', 'תימנית': 'SEPHARDI',
  'מרוקאי': 'SEPHARDI', 'מרוקאית': 'SEPHARDI',
  'עיראקי': 'SEPHARDI', 'עיראקית': 'SEPHARDI',
  'אתיופי': 'OTHER', 'אתיופית': 'OTHER',
  'מעורב': 'MIXED', 'מעורבת': 'MIXED',
  'אחר': 'OTHER',
};

function mapValue(val: string | null | undefined, map: Record<string, string>): string {
  if (!val) return '';
  const n = val.trim().toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (n.includes(k)) return v;
  }
  return val;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SINGLE_CARD_PROMPT = `You are an expert data extraction system for a Jewish matchmaking (shidduch) platform in Israel.

You receive input that may include:
1. **Text** — pasted from a WhatsApp matchmaking group (Hebrew), containing candidate details
2. **Images** — which can be:
   a. **Personal photos** of the candidate
   b. **Form images** — photos of a paper/digital form with the candidate's details written/printed on it
   c. **Combined** — a photo that includes both the person and their details

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
- maritalStatus: מצב משפחתי (רווק/ה, גרוש/ה, אלמן/ה)
- religiousLevel: רמה דתית (חרדי, דתי, דתי לאומי, מסורתי, חילוני, etc.)
- origin: מוצא עדתי (אשכנזי, ספרדי, מזרחי, תימני, מעורב, etc.)
- city: עיר/אזור מגורים
- occupation: עיסוק/מקצוע
- education: מוסד לימודים / מה למד
- educationLevel: רמת השכלה (תיכון, תואר ראשון, תואר שני, סמינר, ישיבה, etc.)
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

Return ONLY valid JSON:
{
  "fields": {
    "firstName": "",
    "lastName": "",
    "gender": "MALE" | "FEMALE" | "",
    "age": "",
    "height": "",
    "maritalStatus": "hebrew value",
    "religiousLevel": "hebrew value",
    "origin": "hebrew value",
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

    // Text prompt
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

    // Normalize/map values
    if (fields.maritalStatus) {
      fields.maritalStatus = mapValue(fields.maritalStatus, MARITAL_STATUS_MAP);
    }
    if (fields.religiousLevel) {
      fields.religiousLevel = mapValue(fields.religiousLevel, RELIGIOUS_LEVEL_MAP);
    }
    if (fields.origin) {
      fields.origin = mapValue(fields.origin, ORIGIN_MAP);
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