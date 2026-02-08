// =============================================================================
// File: src/lib/services/bulkImportService.ts
// Description: AI-powered bulk import service using Gemini
//   Flow A: Process uploaded images (forms + photos)
//   Flow B: Process WhatsApp chat export (.txt + media)
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Use gemini-2.5-flash with vision capabilities
const visionModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.3,
  },
});

// Text-only model for chat parsing
const textModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2,
  },
});

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

export interface ExtractedCandidate {
  tempId: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  age: number | null;
  birthDate: string | null;
  birthDateIsApproximate: boolean;
  height: number | null;
  maritalStatus: string | null;
  religiousLevel: string | null;
  origin: string | null;
  languages: string[];
  city: string | null;
  occupation: string | null;
  education: string | null;
  educationLevel: string | null;
  militaryService: string | null;
  personality: string | null;
  hobbies: string | null;
  familyDescription: string | null;
  lookingFor: string | null;
  contactPhone: string | null;
  referredBy: string | null;
  rawFormText: string;
  photoImageIndices: number[];
  formImageIndices: number[];
  // For Flow B: filenames of associated images
  photoFileNames: string[];
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

export interface BulkExtractionResult {
  candidates: ExtractedCandidate[];
  unmatchedImages: number[];
  unmatchedFileNames: string[];
  totalProcessed: number;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Mapping helpers: Hebrew form values → system enum values
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
  'מסורתי דתי': 'masorti_dati',
  'חילוני': 'hiloni', 'חילונית': 'hiloni',
  'חוזר בתשובה': 'baal_teshuva', 'חוזרת בתשובה': 'baal_teshuva',
  'בעל תשובה': 'baal_teshuva', 'בעלת תשובה': 'baal_teshuva',
  'חב"ד': 'chabad', 'ברסלב': 'breslov',
  'ליטאי': 'litai', 'חסידי': 'hasidi',
};

function mapMaritalStatus(val: string): string | null {
  if (!val) return null;
  const n = val.trim().toLowerCase();
  for (const [k, v] of Object.entries(MARITAL_STATUS_MAP)) {
    if (n.includes(k)) return v;
  }
  if (n.includes('גרוש')) return 'divorced';
  if (n.includes('רווק')) return 'single';
  if (n.includes('אלמ')) return 'widowed';
  return n;
}

function mapReligiousLevel(val: string): string | null {
  if (!val) return null;
  const n = val.trim().toLowerCase();
  for (const [k, v] of Object.entries(RELIGIOUS_LEVEL_MAP)) {
    if (n.includes(k)) return v;
  }
  return n;
}

function normalizeCandidate(c: any, index: number): ExtractedCandidate {
  let height: number | null = null;
  if (c.height) {
    height = typeof c.height === 'number' ? c.height : parseInt(String(c.height));
    if (height && height < 3) height = Math.round(height * 100);
    if (height && (height < 100 || height > 250)) height = null;
  }

  let birthDate: string | null = null;
  const birthDateIsApproximate = true;
  if (c.birthYear && !isNaN(c.birthYear)) {
    birthDate = new Date(c.birthYear, 0, 1).toISOString();
  } else if (c.age && !isNaN(c.age)) {
    birthDate = new Date(new Date().getFullYear() - c.age, 0, 1).toISOString();
  }

  return {
    tempId: c.tempId || `candidate_${index + 1}`,
    firstName: c.firstName || '',
    lastName: c.lastName || '',
    gender: c.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
    age: c.age || null,
    birthDate,
    birthDateIsApproximate,
    height,
    maritalStatus: mapMaritalStatus(c.maritalStatus || ''),
    religiousLevel: mapReligiousLevel(c.religiousLevel || ''),
    origin: c.origin || null,
    languages: Array.isArray(c.languages) ? c.languages : [],
    city: c.city || null,
    occupation: c.occupation || null,
    education: c.education || null,
    educationLevel: c.educationLevel || null,
    militaryService: c.militaryService || null,
    personality: c.personality || null,
    hobbies: c.hobbies || null,
    familyDescription: c.familyDescription || null,
    lookingFor: c.lookingFor || null,
    contactPhone: c.contactPhone || null,
    referredBy: c.referredBy || null,
    rawFormText: c.rawFormText || '',
    photoImageIndices: c.photoImageIndices || [],
    formImageIndices: c.formImageIndices || [],
    photoFileNames: c.photoFileNames || [],
    confidence: c.confidence || 'medium',
    notes: c.notes || null,
  };
}

// ===========================================================================
// FLOW A: Extract candidates from uploaded images
// ===========================================================================

const IMAGE_ANALYSIS_PROMPT = `You are an expert data extraction system for a Jewish matchmaking (shidduch) platform.
You receive images from a WhatsApp matchmaking group. They are a mix of:
1. **Personal photos** — photos of candidates
2. **Handwritten/printed forms** — matchmaking profile forms in Hebrew
3. **Combined** — a single image with both a photo and form data

Your job:
1. Classify each image: "photo", "form", or "combined"
2. Extract ALL data from forms (handwriting in Hebrew)
3. Match each form to its photo(s) by sequential proximity (images uploaded together belong to the same person)
4. Return structured JSON

Form fields (Hebrew): שם, גיל, שנת לידה, גובה, סטטוס, מוצא, שפות, אזור מגורים, רמה דתית ומגזר, עיסוק, לימודים, שירות צבאי, תכונות אופי, תאר בקווים כלליים את משפחתך, מה אתה מחפש, מספר טלפון לבירורים, המלצות/ממליצים

CRITICAL:
- Extract EVERY piece of data, even if handwriting is hard to read
- For gender: infer from photo appearance or Hebrew grammar
- Height: 1.83 → 183cm
- Age: calculate from birthYear if given
- If something is unclear mark it [unclear] and set confidence:"low"

Return ONLY valid JSON (no markdown):
{
  "candidates": [{
    "tempId": "candidate_1",
    "firstName": "", "lastName": "",
    "gender": "MALE" or "FEMALE",
    "age": number|null, "birthYear": number|null,
    "height": number|null,
    "maritalStatus": "hebrew text",
    "religiousLevel": "hebrew text",
    "origin": "", "languages": [],
    "city": "", "occupation": "", "education": "",
    "educationLevel": "", "militaryService": "",
    "personality": "", "hobbies": "",
    "familyDescription": "", "lookingFor": "",
    "contactPhone": "", "referredBy": "",
    "rawFormText": "full transcription of form",
    "photoImageIndices": [0],
    "formImageIndices": [1],
    "confidence": "high"|"medium"|"low",
    "notes": ""
  }],
  "unmatchedImages": [],
  "warnings": []
}`;

export async function extractCandidatesFromImages(
  imageBuffers: { buffer: Buffer; mimeType: string; originalName: string; index: number }[]
): Promise<BulkExtractionResult> {

  console.log(`[BulkImport/FlowA] Sending ${imageBuffers.length} images to Gemini...`);

  // Build Gemini content parts: text + images
  const parts: any[] = [
    { text: `${IMAGE_ANALYSIS_PROMPT}\n\nHere are ${imageBuffers.length} images indexed 0-${imageBuffers.length - 1}.\nFilenames: ${imageBuffers.map((img, i) => `[${i}] ${img.originalName}`).join(', ')}\n\nAnalyze all and return JSON:` },
  ];

  for (const img of imageBuffers) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.buffer.toString('base64'),
      },
    });
  }

  const result = await visionModel.generateContent({ contents: [{ role: 'user', parts }] });
  const responseText = result.response.text();

  console.log(`[BulkImport/FlowA] Got response, parsing...`);

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');
    parsed = JSON.parse(jsonMatch[0]);
  }

  const candidates = (parsed.candidates || []).map(normalizeCandidate);

  return {
    candidates,
    unmatchedImages: parsed.unmatchedImages || [],
    unmatchedFileNames: [],
    totalProcessed: imageBuffers.length,
    warnings: parsed.warnings || [],
  };
}

// ===========================================================================
// FLOW B: Extract candidates from WhatsApp chat export
// ===========================================================================

// Step B1: Parse the WhatsApp .txt export into structured messages
export interface WhatsAppMessage {
  timestamp: Date;
  sender: string;
  text: string;
  mediaFileName: string | null; // e.g. "IMG-20260208-WA0012.jpg"
}

export function parseWhatsAppExport(rawText: string): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];

  // WhatsApp export formats:
  // [08/02/2026, 10:15:32] Name: message text
  // 08/02/2026, 10:15 - Name: message text
  // 2/8/26, 10:15 AM - Name: message text
const lineRegex = /^\[?(\d{1,2}[/.]\d{1,2}[/.]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]?\s*[-–]?\s*([^:]+):\s*([\s\S]*?)$/;

  // Split by lines, handling multi-line messages
  const lines = rawText.split('\n');
  let currentMsg: WhatsAppMessage | null = null;

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (match) {
      // Save previous message
      if (currentMsg) messages.push(currentMsg);

      const [, dateStr, timeStr, sender, text] = match;

      // Parse date (handle DD/MM/YYYY and MM/DD/YYYY)
      let timestamp: Date;
      try {
const dateParts = dateStr.split(/[/.]/);
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        let year = parseInt(dateParts[2]);
        if (year < 100) year += 2000;

        // Try DD/MM/YYYY first (common in Israel)
        timestamp = new Date(year, month - 1, day);

        // Parse time
        const timeParts = timeStr.trim().replace(/\s*[AP]M/i, '').split(':');
        timestamp.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2] || '0'));

        if (timeStr.toUpperCase().includes('PM') && timestamp.getHours() < 12) {
          timestamp.setHours(timestamp.getHours() + 12);
        }
      } catch {
        timestamp = new Date();
      }

      // Check for media attachment
      let mediaFileName: string | null = null;
      const mediaMatch = text.match(/<?(IMG-\d+-WA\d+\.\w+|PHOTO-\d+-\d+-\d+-\d+\.\w+|\d+-PHOTO[^>]+\.\w+)>?/i);
      if (mediaMatch) {
        mediaFileName = mediaMatch[1];
      }
      // Also check for WhatsApp's standard media messages
      const attachedMatch = text.match(/‎?<מצורף: ([^>]+)>|‎?<attached: ([^>]+)>/);
      if (attachedMatch) {
        mediaFileName = attachedMatch[1] || attachedMatch[2];
      }

      currentMsg = {
        timestamp,
        sender: sender.trim(),
        text: text.trim(),
        mediaFileName,
      };
    } else if (currentMsg) {
      // Multi-line continuation
      currentMsg.text += '\n' + line;
    }
  }

  if (currentMsg) messages.push(currentMsg);

  return messages;
}

// Step B2: Group messages into candidate "blocks"
// Heuristic: messages from the same sender within a short time window about the same person
export interface CandidateBlock {
  messages: WhatsAppMessage[];
  textContent: string;
  mediaFileNames: string[];
  sender: string;
  timestamp: Date;
}

export function groupIntoCandidateBlocks(messages: WhatsAppMessage[]): CandidateBlock[] {
  const blocks: CandidateBlock[] = [];
  let currentBlock: CandidateBlock | null = null;

  // Keywords that indicate a new candidate profile
  const profileIndicators = ['שם:', 'גיל:', 'סטטוס:', 'רווק', 'רווקה', 'גרוש', 'גרושה', 'שנת לידה', 'גובה:', 'עיסוק:', 'מוצא:'];

  for (const msg of messages) {
    const isProfileStart = profileIndicators.some((ind) => msg.text.includes(ind));
    const hasMedia = !!msg.mediaFileName;

    // Start a new block if:
    // 1. This message contains profile indicators, OR
    // 2. More than 5 minutes passed since last message in current block AND this has content
    const timeDiff = currentBlock
      ? (msg.timestamp.getTime() - currentBlock.timestamp.getTime()) / 1000 / 60
      : Infinity;

    const shouldStartNew =
      !currentBlock ||
      (isProfileStart && timeDiff > 1) || // New profile data after some gap
      (timeDiff > 10); // Big time gap

    if (shouldStartNew && (isProfileStart || hasMedia || msg.text.length > 50)) {
      if (currentBlock && (currentBlock.textContent.length > 20 || currentBlock.mediaFileNames.length > 0)) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        messages: [msg],
        textContent: hasMedia ? '' : msg.text, // Don't include media-only messages as text
        mediaFileNames: hasMedia && msg.mediaFileName ? [msg.mediaFileName] : [],
        sender: msg.sender,
        timestamp: msg.timestamp,
      };
    } else if (currentBlock) {
      currentBlock.messages.push(msg);
      if (!hasMedia && msg.text.length > 5) {
        currentBlock.textContent += '\n' + msg.text;
      }
      if (hasMedia && msg.mediaFileName) {
        currentBlock.mediaFileNames.push(msg.mediaFileName);
      }
      // Update timestamp to latest
      currentBlock.timestamp = msg.timestamp;
    }
  }

  if (currentBlock && (currentBlock.textContent.length > 20 || currentBlock.mediaFileNames.length > 0)) {
    blocks.push(currentBlock);
  }

  return blocks;
}

// Step B3: Send blocks to Gemini for structured extraction
const CHAT_EXTRACTION_PROMPT = `You are an expert data extraction system for a Jewish matchmaking (shidduch) platform.
You receive structured text blocks from a WhatsApp matchmaking group. Each block represents one candidate.

Your job:
1. Extract ALL personal data from each block
2. Return structured JSON for each identified candidate

The text usually contains (in Hebrew): שם, גיל, שנת לידה, גובה, סטטוס, מוצא, שפות, אזור מגורים, רמה דתית, עיסוק, לימודים, שירות צבאי, תכונות אופי, משפחה, מה מחפש/ת, טלפון

CRITICAL:
- Some blocks might not be real candidates (spam, greetings, etc.) — skip those
- For gender: infer from Hebrew grammar (מחפש vs מחפשת, רווק vs רווקה)
- Height: 1.83 → 183cm; 170 stays 170
- If "שם" field is missing, try to extract name from context
- The "mediaFileNames" field should contain the image filenames associated with this candidate

Return ONLY valid JSON:
{
  "candidates": [{
    "tempId": "candidate_1",
    "firstName": "", "lastName": "",
    "gender": "MALE"|"FEMALE",
    "age": number|null, "birthYear": number|null,
    "height": number|null,
    "maritalStatus": "", "religiousLevel": "",
    "origin": "", "languages": [],
    "city": "", "occupation": "", "education": "",
    "educationLevel": "", "militaryService": "",
    "personality": "", "hobbies": "",
    "familyDescription": "", "lookingFor": "",
    "contactPhone": "", "referredBy": "",
    "rawFormText": "original block text",
    "photoFileNames": ["IMG-20260208-WA0012.jpg"],
    "confidence": "high"|"medium"|"low",
    "notes": ""
  }],
  "skippedBlocks": [{"reason": "not a candidate profile", "preview": "first 50 chars..."}],
  "warnings": []
}`;

export async function extractCandidatesFromChat(
  blocks: CandidateBlock[],
  // Optional: image buffers keyed by filename for combined analysis
  imagesByName?: Map<string, { buffer: Buffer; mimeType: string }>
): Promise<BulkExtractionResult> {

  console.log(`[BulkImport/FlowB] Processing ${blocks.length} candidate blocks...`);

  // Process in batches of 15 blocks to avoid token limits
  const BATCH_SIZE = 15;
  const allCandidates: ExtractedCandidate[] = [];
  const allWarnings: string[] = [];

  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const batch = blocks.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(blocks.length / BATCH_SIZE);

    console.log(`[BulkImport/FlowB] Batch ${batchIndex}/${totalBatches} (${batch.length} blocks)...`);

    // Build prompt with blocks
    const blocksText = batch
      .map((block, idx) => {
        const globalIdx = i + idx;
        return `--- BLOCK ${globalIdx} (by: ${block.sender}, time: ${block.timestamp.toISOString()}) ---
Media files: ${block.mediaFileNames.length > 0 ? block.mediaFileNames.join(', ') : 'none'}
Text:
${block.textContent}
--- END BLOCK ${globalIdx} ---`;
      })
      .join('\n\n');

    // Build content parts
    const parts: any[] = [
      { text: `${CHAT_EXTRACTION_PROMPT}\n\nHere are ${batch.length} blocks to process:\n\n${blocksText}\n\nExtract candidates:` },
    ];

    // If we have images for any of these blocks, include them
    if (imagesByName) {
      for (const block of batch) {
        for (const fileName of block.mediaFileNames) {
          const img = imagesByName.get(fileName);
          if (img) {
            parts.push({
              text: `\n[Image: ${fileName}]`,
            });
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.buffer.toString('base64'),
              },
            });
          }
        }
      }
    }

    try {
      const model = imagesByName && imagesByName.size > 0 ? visionModel : textModel;
      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const responseText = result.response.text();

      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          allWarnings.push(`Batch ${batchIndex}: Failed to parse AI response`);
          continue;
        }
        parsed = JSON.parse(jsonMatch[0]);
      }

      const candidates = (parsed.candidates || []).map((c: any, idx: number) =>
        normalizeCandidate(c, allCandidates.length + idx)
      );

      allCandidates.push(...candidates);

      if (parsed.warnings) allWarnings.push(...parsed.warnings);

      // Rate limiting — wait between batches
      if (i + BATCH_SIZE < blocks.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`[BulkImport/FlowB] Batch ${batchIndex} error:`, error);
      allWarnings.push(`Batch ${batchIndex}: ${(error as Error).message}`);
    }
  }

  return {
    candidates: allCandidates,
    unmatchedImages: [],
    unmatchedFileNames: [],
    totalProcessed: blocks.length,
    warnings: allWarnings,
  };
}

// ===========================================================================
// FLOW B with images: Extract from chat export images (forms with text inside)
// ===========================================================================

export async function extractCandidatesFromChatImages(
  imageBuffers: { buffer: Buffer; mimeType: string; originalName: string }[]
): Promise<BulkExtractionResult> {

  console.log(`[BulkImport/FlowB-Images] Processing ${imageBuffers.length} chat images with Gemini Vision...`);

  // Process in batches of 8 images (Gemini has limits on image count)
  const BATCH_SIZE = 8;
  const allCandidates: ExtractedCandidate[] = [];
  const allWarnings: string[] = [];

  for (let i = 0; i < imageBuffers.length; i += BATCH_SIZE) {
    const batch = imageBuffers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`[FlowB-Images] Batch ${batchNum}: ${batch.length} images...`);

    const parts: any[] = [
      { text: `${IMAGE_ANALYSIS_PROMPT}\n\nProcessing ${batch.length} images. File names: ${batch.map((img, j) => `[${i + j}] ${img.originalName}`).join(', ')}\n\nReturn JSON:` },
    ];

    for (const img of batch) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.buffer.toString('base64'),
        },
      });
    }

    try {
      const result = await visionModel.generateContent({ contents: [{ role: 'user', parts }] });
      const responseText = result.response.text();

      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) { allWarnings.push(`Batch ${batchNum}: no JSON`); continue; }
        parsed = JSON.parse(jsonMatch[0]);
      }

      const candidates = (parsed.candidates || []).map((c: any, idx: number) =>
        normalizeCandidate(c, allCandidates.length + idx)
      );
      allCandidates.push(...candidates);
      if (parsed.warnings) allWarnings.push(...parsed.warnings);

      if (i + BATCH_SIZE < imageBuffers.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (error) {
      allWarnings.push(`Batch ${batchNum}: ${(error as Error).message}`);
    }
  }

  return {
    candidates: allCandidates,
    unmatchedImages: [],
    unmatchedFileNames: [],
    totalProcessed: imageBuffers.length,
    warnings: allWarnings,
  };
}

// ---------------------------------------------------------------------------
// Helper: Build manualEntryText from extracted data
// ---------------------------------------------------------------------------

export function buildManualEntryText(candidate: ExtractedCandidate): string {
  const lines: string[] = [];

  lines.push(`שם: ${candidate.firstName} ${candidate.lastName}`);
  if (candidate.age) lines.push(`גיל: ${candidate.age}`);
  if (candidate.height) lines.push(`גובה: ${candidate.height} ס"מ`);
  if (candidate.origin) lines.push(`מוצא: ${candidate.origin}`);
  if (candidate.languages.length > 0) lines.push(`שפות: ${candidate.languages.join(', ')}`);
  if (candidate.city) lines.push(`אזור מגורים: ${candidate.city}`);
  if (candidate.occupation) lines.push(`עיסוק: ${candidate.occupation}`);
  if (candidate.education) lines.push(`לימודים: ${candidate.education}`);
  if (candidate.militaryService) lines.push(`שירות צבאי: ${candidate.militaryService}`);
  if (candidate.personality) lines.push(`תכונות אופי: ${candidate.personality}`);
  if (candidate.hobbies) lines.push(`תחביבים: ${candidate.hobbies}`);
  if (candidate.familyDescription) lines.push(`משפחה: ${candidate.familyDescription}`);
  if (candidate.lookingFor) lines.push(`מחפש/ת: ${candidate.lookingFor}`);
  if (candidate.contactPhone) lines.push(`טלפון: ${candidate.contactPhone}`);

  lines.push('');
  lines.push('--- טקסט מקורי ---');
  lines.push(candidate.rawFormText);

  return lines.join('\n');
}