// =============================================================================
// File: scripts/ai-fill-missing-status-and-religion.ts
// Run: npx ts-node scripts/ai-fill-missing-status-and-religion.ts
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const prisma = new PrismaClient();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ שגיאה: חסר GEMINI_API_KEY בקובץ .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2,
  },
});

// =============================================================================
// Valid values - EXACTLY matching schema & card-import route
// =============================================================================

const VALID_MARITAL_STATUSES = ['SINGLE', 'DIVORCED', 'WIDOWED'] as const;

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

const RELIGIOUS_LEVEL_LABELS: Record<string, string> = {
  dati_leumi_standard: 'דתי/ה לאומי/ת (סטנדרטי)',
  dati_leumi_liberal: 'דתי/ה לאומי/ת ליברלי/ת',
  dati_leumi_torani: 'דתי/ה לאומי/ת תורני/ת',
  masorti_strong: 'מסורתי/ת (קרוב/ה לדת)',
  masorti_light: 'מסורתי/ת (קשר קל)',
  secular_traditional_connection: 'חילוני/ת עם זיקה למסורת',
  secular: 'חילוני/ת',
  spiritual_not_religious: 'רוחני/ת',
  charedi_modern: 'חרדי/ת מודרני/ת',
  charedi_litvak: 'חרדי/ת ליטאי/ת',
  charedi_sephardic: 'חרדי/ת ספרדי/ת',
  charedi_hasidic: 'חרדי/ת חסידי/ת',
  chabad: 'חב״ד',
  breslov: 'ברסלב',
  other: 'אחר',
};

const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: 'רווק/ה',
  DIVORCED: 'גרוש/ה',
  WIDOWED: 'אלמן/ה',
};

// =============================================================================
// Types
// =============================================================================

interface ProposedChange {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number | null;
  currentMaritalStatus: string | null;
  currentReligiousLevel: string | null;
  proposedMaritalStatus: string | null;
  proposedReligiousLevel: string | null;
  aiReasoning: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  fieldsToUpdate: ('maritalStatus' | 'religiousLevel')[];
}

// =============================================================================
// Helpers
// =============================================================================

function calculateAge(birthDate: any): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// =============================================================================
// Build comprehensive context from ALL available user data
// =============================================================================

function buildUserContext(user: any): string {
  const p = user.profile;
  if (!p) return 'No profile data available.';

  const lines: string[] = [];

  // --- Basic Info ---
  lines.push(`=== פרטים בסיסיים ===`);
  lines.push(`שם: ${user.firstName} ${user.lastName}`);
  if (p.gender) lines.push(`מגדר: ${p.gender === 'MALE' ? 'זכר' : 'נקבה'}`);

  const age = calculateAge(p.birthDate);
  if (age) lines.push(`גיל: ${age}`);

  if (p.height) lines.push(`גובה: ${p.height} ס"מ`);
  if (p.city) lines.push(`עיר: ${p.city}`);
  if (p.origin) lines.push(`מוצא: ${p.origin}`);

  // --- Current values (show what exists) ---
  if (p.maritalStatus) lines.push(`מצב משפחתי (קיים): ${p.maritalStatus}`);
  if (p.religiousLevel) lines.push(`רמה דתית (קיימת): ${p.religiousLevel}`);

  // --- Children info (critical for marital status) ---
  if (p.hasChildrenFromPrevious === true) {
    lines.push(`ילדים מקשר קודם: כן ✓`);
  } else if (p.hasChildrenFromPrevious === false) {
    lines.push(`ילדים מקשר קודם: לא`);
  }

  // --- Religious indicators ---
  lines.push(`\n=== אינדיקטורים דתיים ===`);
  if (p.religiousJourney) lines.push(`מסע דתי: ${p.religiousJourney}`);
  if (p.shomerNegiah !== null && p.shomerNegiah !== undefined) {
    lines.push(`שומר/ת נגיעה: ${p.shomerNegiah ? 'כן' : 'לא'}`);
  }
  if (p.headCovering) lines.push(`כיסוי ראש: ${p.headCovering}`);
  if (p.kippahType) lines.push(`סוג כיפה: ${p.kippahType}`);
  if (p.influentialRabbi) lines.push(`רב משפיע: ${p.influentialRabbi}`);

  // --- Career & Education ---
  lines.push(`\n=== קריירה והשכלה ===`);
  if (p.occupation) lines.push(`עיסוק: ${p.occupation}`);
  if (p.education) lines.push(`מוסד/לימודים: ${p.education}`);
  if (p.educationLevel) lines.push(`רמת השכלה: ${p.educationLevel}`);

  // --- Service ---
  if (p.serviceType) lines.push(`סוג שירות: ${p.serviceType}`);
  if (p.serviceDetails) lines.push(`פרטי שירות: ${p.serviceDetails}`);

  // --- Family ---
  lines.push(`\n=== משפחה ===`);
  if (p.parentStatus) lines.push(`סטטוס הורים: ${p.parentStatus}`);
  if (p.fatherOccupation) lines.push(`עיסוק האב: ${p.fatherOccupation}`);
  if (p.motherOccupation) lines.push(`עיסוק האם: ${p.motherOccupation}`);
  if (p.siblings) lines.push(`מספר אחים: ${p.siblings}`);
  if (p.familyDescription) lines.push(`תיאור משפחה: ${p.familyDescription}`);

  // --- Free text fields (very important!) ---
  lines.push(`\n=== טקסטים חופשיים ===`);
  if (p.about) lines.push(`אודות:\n${p.about}`);
  if (p.manualEntryText) lines.push(`טקסט ידני:\n${p.manualEntryText}`);
  if (p.profileHeadline) lines.push(`כותרת פרופיל: ${p.profileHeadline}`);
  if (p.inspiringCoupleStory) lines.push(`סיפור זוג מעורר השראה: ${p.inspiringCoupleStory}`);

  // --- Traits & Hobbies ---
  if (p.profileCharacterTraits?.length > 0)
    lines.push(`תכונות אופי: ${p.profileCharacterTraits.join(', ')}`);
  if (p.profileHobbies?.length > 0)
    lines.push(`תחביבים: ${p.profileHobbies.join(', ')}`);

  // --- Preferences (can hint about their own level) ---
  lines.push(`\n=== העדפות (רמזים עקיפים) ===`);
  if (p.preferredReligiousLevels?.length > 0)
    lines.push(`רמות דתיות מועדפות בבן/בת זוג: ${p.preferredReligiousLevels.join(', ')}`);
  if (p.preferredMaritalStatuses?.length > 0)
    lines.push(`מצבים משפחתיים מועדפים בבן/בת זוג: ${p.preferredMaritalStatuses.join(', ')}`);
  if (p.matchingNotes) lines.push(`הערות שידוך: ${p.matchingNotes}`);

  // --- Matchmaker notes (high value!) ---
  lines.push(`\n=== הערות שדכן ===`);
  if (p.internalMatchmakerNotes)
    lines.push(`הערות פנימיות: ${p.internalMatchmakerNotes}`);
  if (p.matchmakerImpression)
    lines.push(`התרשמות שדכן: ${p.matchmakerImpression}`);
  if (p.referredBy) lines.push(`הופנה ע"י: ${p.referredBy}`);

  // --- CV & Conversation ---
  if (p.cvSummary) lines.push(`\nסיכום קו"ח: ${p.cvSummary}`);
  if (p.conversationSummary) lines.push(`\nסיכום שיחה: ${p.conversationSummary}`);

  // --- AI Profile Summary (existing) ---
  if (p.aiProfileSummary) {
    const ai = p.aiProfileSummary as any;
    if (ai.personalitySummary)
      lines.push(`\nסיכום אישיות AI: ${ai.personalitySummary}`);
    if (ai.lookingForSummary)
      lines.push(`\nסיכום מחפש AI: ${ai.lookingForSummary}`);
  }

  // --- Metrics (if available) ---
  if (p.metrics) {
    const m = p.metrics;
    lines.push(`\n=== מדדים (ProfileMetrics) ===`);
    if (m.religiousStrictness != null)
      lines.push(`ציון קפידה דתית: ${m.religiousStrictness}/100`);
    if (m.spiritualDepth != null)
      lines.push(`ציון עומק רוחני: ${m.spiritualDepth}/100`);
    if (m.inferredReligiousLevel)
      lines.push(`רמה דתית מוסקת (metrics): ${m.inferredReligiousLevel}`);
    if (m.aiPersonalitySummary)
      lines.push(`סיכום אישיות metrics: ${m.aiPersonalitySummary}`);
    if (m.aiBackgroundSummary)
      lines.push(`סיכום רקע metrics: ${m.aiBackgroundSummary}`);
    if (m.aiMatchmakerGuidelines)
      lines.push(`הנחיות שדכן metrics: ${m.aiMatchmakerGuidelines}`);
  }

  // --- Questionnaire ---
  const q = user.questionnaireResponses?.[0];
  if (q) {
    lines.push(`\n=== שאלון עומק ===`);
    if (q.valuesAnswers) lines.push(`ערכים: ${JSON.stringify(q.valuesAnswers)}`);
    if (q.personalityAnswers) lines.push(`אישיות: ${JSON.stringify(q.personalityAnswers)}`);
    if (q.relationshipAnswers) lines.push(`יחסים: ${JSON.stringify(q.relationshipAnswers)}`);
    if (q.religionAnswers) lines.push(`דת: ${JSON.stringify(q.religionAnswers)}`);
    if (q.partnerAnswers) lines.push(`בן/בת זוג: ${JSON.stringify(q.partnerAnswers)}`);
  }

  return lines.filter(l => l.trim()).join('\n');
}

// =============================================================================
// AI Analysis with Gemini
// =============================================================================

async function analyzeUser(
  user: any,
  missingFields: ('maritalStatus' | 'religiousLevel')[]
): Promise<ProposedChange | null> {
  const context = buildUserContext(user);
  const p = user.profile;

  const fieldsInstructions = missingFields.map(f => {
    if (f === 'maritalStatus') {
      return `
מצב משפחתי (maritalStatus) - חובה לבחור אחד מ-3 ערכים בלבד:
  - "SINGLE" - רווק/ה (לא היה נשוי/אה מעולם)
  - "DIVORCED" - גרוש/ה (היה נשוי/אה בעבר, כולל פרוד/ה)
  - "WIDOWED" - אלמן/ה (בן/בת הזוג נפטר/ה)

כללי ניחוש:
  • אם יש ילדים מקשר קודם (hasChildrenFromPrevious=true) → כנראה DIVORCED
  • אם הגיל מעל 22 ואין אינדיקציה אחרת → כנראה SINGLE
  • אם כתוב "גרוש/ה" או "נשוי/אה בעבר" → DIVORCED
  • אם כתוב "אלמן/ה" → WIDOWED
  • ברירת מחדל לפרופיל שידוכים ללא מידע → SINGLE`;
    }
    if (f === 'religiousLevel') {
      return `
רמה דתית (religiousLevel) - חובה לבחור אחד מהערכים הבאים בלבד:
  - "dati_leumi_standard" - דתי/ה לאומי/ת (סטנדרטי)
  - "dati_leumi_liberal" - דתי/ה לאומי/ת ליברלי/ת, דתי לייט, פתוח
  - "dati_leumi_torani" - דתי/ה תורני/ת, חרד"ל
  - "masorti_strong" - מסורתי/ת (קרוב/ה לדת)
  - "masorti_light" - מסורתי/ת (קשר קל)
  - "secular_traditional_connection" - חילוני/ת עם זיקה למסורת
  - "secular" - חילוני/ת
  - "spiritual_not_religious" - רוחני/ת
  - "charedi_modern" - חרדי/ת מודרני/ת
  - "charedi_litvak" - חרדי/ת ליטאי/ת
  - "charedi_sephardic" - חרדי/ת ספרדי/ת
  - "charedi_hasidic" - חרדי/ת חסידי/ת
  - "chabad" - חב"ד
  - "breslov" - ברסלב
  - "other" - אחר

כללי ניחוש:
  • כיפה סרוגה → dati_leumi_standard / dati_leumi_torani
  • כיפה שחורה (קטנה/סרוגה גדולה) → dati_leumi_torani או charedi_modern
  • כיסוי ראש מלא → charedi או dati_leumi_torani
  • שומר/ת נגיעה → dati_leumi_standard ומעלה
  • רמות דתיות מועדפות → מרמזות על הרמה שלו/שלה (בדר"כ דומה)
  • מסע "BAAL_TESHUVA" → dati_leumi_torani / charedi_modern / other
  • מסע "DATLASH" → secular / secular_traditional_connection / masorti_light
  • אם מזכיר ישיבה/מדרשה → דתי לפחות
  • אם מזכיר רב ספציפי → דתי/חרדי
  • ציון religiousStrictness גבוה (>70) → dati_leumi_torani / charedi
  • ציון religiousStrictness נמוך (<30) → secular / masorti_light`;
    }
    return '';
  }).join('\n\n');

  const prompt = `אתה מומחה לשידוכים בקהילה הדתית לאומית והחרדית בישראל.
לפניך כל המידע הזמין על מועמד/ת לשידוך. עליך לנחש את השדות החסרים.

=== כל המידע על המועמד/ת ===
${context}
=== סוף מידע ===

=== שדות חסרים שצריך לנחש ===
${fieldsInstructions}

=== הוראות חשובות ===
1. נתח את כל המידע הזמין - כל רמז עוזר.
2. שים לב במיוחד ל: about, manualEntryText, הערות שדכן, שאלונים, preferredReligiousLevels.
3. הסבר בקצרה למה בחרת כך (ציין מה הראיות).
4. ציין רמת ביטחון: HIGH (ראיות ברורות), MEDIUM (ראיות חלקיות), LOW (ניחוש).
5. חובה להחזיר ערך תקף - אל תחזיר null.

החזר JSON בלבד:
{
  "maritalStatus": "SINGLE" | "DIVORCED" | "WIDOWED",
  "religiousLevel": "one_of_the_valid_values_listed_above",
  "reasoning": "הסבר קצר בעברית - ציין ראיות ספציפיות",
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

אם שדה לא חסר (לא צריך לנחש אותו), החזר את הערך הקיים שלו.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    if (!responseText) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`   ❌ AI returned invalid JSON`);
        return null;
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate marital status
    let proposedMarital: string | null = null;
    if (missingFields.includes('maritalStatus')) {
      const ms = parsed.maritalStatus?.toUpperCase();
      if (VALID_MARITAL_STATUSES.includes(ms as any)) {
        proposedMarital = ms;
      } else {
        // Try mapping
        const mapping: Record<string, string> = {
          'single': 'SINGLE', 'רווק': 'SINGLE', 'רווקה': 'SINGLE',
          'divorced': 'DIVORCED', 'גרוש': 'DIVORCED', 'גרושה': 'DIVORCED',
          'widowed': 'WIDOWED', 'אלמן': 'WIDOWED', 'אלמנה': 'WIDOWED',
        };
        const lc = (parsed.maritalStatus || '').toLowerCase();
        proposedMarital = mapping[lc] || 'SINGLE';
      }
    }

    // Validate religious level
    let proposedReligious: string | null = null;
    if (missingFields.includes('religiousLevel')) {
      if (VALID_RELIGIOUS_LEVELS.includes(parsed.religiousLevel as any)) {
        proposedReligious = parsed.religiousLevel;
      } else {
        console.log(`   ⚠️ Invalid religiousLevel: "${parsed.religiousLevel}"`);
        proposedReligious = null;
      }
    }

    // Determine fields to actually update
    const fieldsToUpdate: ('maritalStatus' | 'religiousLevel')[] = [];
    if (missingFields.includes('maritalStatus') && proposedMarital) {
      fieldsToUpdate.push('maritalStatus');
    }
    if (missingFields.includes('religiousLevel') && proposedReligious) {
      fieldsToUpdate.push('religiousLevel');
    }

    if (fieldsToUpdate.length === 0) return null;

    return {
      userId: user.id,
      profileId: p.id,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: p.gender,
      age: calculateAge(p.birthDate),
      currentMaritalStatus: p.maritalStatus,
      currentReligiousLevel: p.religiousLevel,
      proposedMaritalStatus: proposedMarital,
      proposedReligiousLevel: proposedReligious,
      aiReasoning: parsed.reasoning || 'No reasoning provided',
      confidence: (['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'LOW'),
      fieldsToUpdate,
    };
  } catch (error: any) {
    console.error(`   ❌ Error analyzing ${user.firstName} ${user.lastName}:`, error.message);
    return null;
  }
}

// =============================================================================
// Display proposed changes in a clear table
// =============================================================================

function displayChanges(changes: ProposedChange[]) {
  console.log('\n' + '═'.repeat(90));
  console.log('📋 שינויים מוצעים');
  console.log('═'.repeat(90));

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    const confidenceEmoji =
      c.confidence === 'HIGH' ? '🟢' : c.confidence === 'MEDIUM' ? '🟡' : '🔴';
    const genderEmoji = c.gender === 'MALE' ? '♂️' : '♀️';

    console.log(`\n┌─ ${i + 1}/${changes.length} ─────────────────────────────────────`);
    console.log(`│ ${genderEmoji} ${c.firstName} ${c.lastName} ${c.age ? `(גיל ${c.age})` : ''}`);
    console.log(`│ ${confidenceEmoji} ביטחון: ${c.confidence}`);

    if (c.fieldsToUpdate.includes('maritalStatus')) {
      const from = c.currentMaritalStatus
        ? MARITAL_STATUS_LABELS[c.currentMaritalStatus] || c.currentMaritalStatus
        : '❌ חסר';
      const to = c.proposedMaritalStatus
        ? MARITAL_STATUS_LABELS[c.proposedMaritalStatus] || c.proposedMaritalStatus
        : '?';
      console.log(`│ 💍 מצב משפחתי: ${from} ──→ ${to}`);
    }

    if (c.fieldsToUpdate.includes('religiousLevel')) {
      const from = c.currentReligiousLevel
        ? RELIGIOUS_LEVEL_LABELS[c.currentReligiousLevel] || c.currentReligiousLevel
        : '❌ חסר';
      const to = c.proposedReligiousLevel
        ? RELIGIOUS_LEVEL_LABELS[c.proposedReligiousLevel] || c.proposedReligiousLevel
        : '?';
      console.log(`│ ✡️  רמה דתית: ${from} ──→ ${to}`);
    }

    console.log(`│ 💡 ${c.aiReasoning}`);
    console.log(`└────────────────────────────────────────────────`);
  }

  console.log('\n' + '═'.repeat(90));
  console.log('📊 סיכום:');
  console.log(`   סה"כ שינויים: ${changes.length}`);
  console.log(`   🟢 HIGH:   ${changes.filter(c => c.confidence === 'HIGH').length}`);
  console.log(`   🟡 MEDIUM: ${changes.filter(c => c.confidence === 'MEDIUM').length}`);
  console.log(`   🔴 LOW:    ${changes.filter(c => c.confidence === 'LOW').length}`);

  const maritalChanges = changes.filter(c => c.fieldsToUpdate.includes('maritalStatus'));
  const religiousChanges = changes.filter(c => c.fieldsToUpdate.includes('religiousLevel'));
  console.log(`   💍 מצב משפחתי: ${maritalChanges.length} שינויים`);
  console.log(`   ✡️  רמה דתית: ${religiousChanges.length} שינויים`);
  console.log('═'.repeat(90));
}

// =============================================================================
// Apply changes to DB
// =============================================================================

async function applyChanges(changes: ProposedChange[]) {
  let successCount = 0;
  let failCount = 0;

  for (const change of changes) {
    try {
      const updateData: any = {};

      if (change.fieldsToUpdate.includes('maritalStatus') && change.proposedMaritalStatus) {
        updateData.maritalStatus = change.proposedMaritalStatus;
      }

      if (change.fieldsToUpdate.includes('religiousLevel') && change.proposedReligiousLevel) {
        updateData.religiousLevel = change.proposedReligiousLevel;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.profile.update({
          where: { id: change.profileId },
          data: updateData,
        });
        successCount++;
        console.log(`   ✅ ${change.firstName} ${change.lastName}`);
      }
    } catch (error: any) {
      failCount++;
      console.error(`   ❌ ${change.firstName} ${change.lastName}: ${error.message}`);
    }
  }

  return { successCount, failCount };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('🔍 סקריפט מילוי סטטוס ורמה דתית חסרים באמצעות AI');
  console.log('─'.repeat(60));
  console.log('');

  // =========================================================================
  // Step 1: Find users with missing fields
  // =========================================================================
  const usersWithMissingFields = await prisma.user.findMany({
    where: {
      role: 'CANDIDATE',
      profile: {
        is: {
          OR: [
            { maritalStatus: null },
            { maritalStatus: '' },
            { religiousLevel: null },
            { religiousLevel: '' },
          ],
        },
      },
    },
    include: {
      profile: {
        include: {
          metrics: true,
        },
      },
      questionnaireResponses: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  });

  if (usersWithMissingFields.length === 0) {
    console.log('✅ אין יוזרים עם שדות חסרים! הכל מעודכן.');
    return;
  }

  // Categorize
  const missingMarital = usersWithMissingFields.filter(
    (u: any) => !u.profile?.maritalStatus || u.profile.maritalStatus === ''
  );
  const missingReligious = usersWithMissingFields.filter(
    (u: any) => !u.profile?.religiousLevel || u.profile.religiousLevel === ''
  );
  const missingBoth = usersWithMissingFields.filter(
    (u: any) =>
      (!u.profile?.maritalStatus || u.profile.maritalStatus === '') &&
      (!u.profile?.religiousLevel || u.profile.religiousLevel === '')
  );

  console.log(`📊 נמצאו ${usersWithMissingFields.length} יוזרים עם שדות חסרים:`);
  console.log(`   💍 חסר מצב משפחתי:  ${missingMarital.length}`);
  console.log(`   ✡️  חסרה רמה דתית:   ${missingReligious.length}`);
  console.log(`   ⚠️  חסרים שניהם:     ${missingBoth.length}`);

  // =========================================================================
  // Step 1.5: Filter out users with too little data
  // =========================================================================
  const usersWithEnoughData = usersWithMissingFields.filter((user: any) => {
    const p = user.profile;
    if (!p) return false;

    let dataPoints = 0;

    if (p.about && p.about.length > 10) dataPoints += 3;
    if (p.manualEntryText && p.manualEntryText.length > 10) dataPoints += 3;
    if (p.religiousLevel && p.religiousLevel !== '') dataPoints += 2;
    if (p.maritalStatus && p.maritalStatus !== '') dataPoints += 2;
    if (p.religiousJourney) dataPoints += 2;
    if (p.shomerNegiah !== null && p.shomerNegiah !== undefined) dataPoints += 2;
    if (p.headCovering) dataPoints += 2;
    if (p.kippahType) dataPoints += 2;
    if (p.serviceType) dataPoints += 1;
    if (p.serviceDetails) dataPoints += 1;
    if (p.occupation) dataPoints += 1;
    if (p.education) dataPoints += 1;
    if (p.city) dataPoints += 1;
    if (p.origin) dataPoints += 1;
    if (p.influentialRabbi) dataPoints += 2;
    if (p.internalMatchmakerNotes) dataPoints += 3;
    if (p.matchmakerImpression) dataPoints += 2;
    if (p.matchingNotes) dataPoints += 2;
    if (p.conversationSummary) dataPoints += 2;
    if (p.cvSummary) dataPoints += 1;
    if (p.profileHeadline) dataPoints += 1;
    if (p.inspiringCoupleStory) dataPoints += 1;
    if (p.preferredReligiousLevels?.length > 0) dataPoints += 2;
    if (p.preferredMaritalStatuses?.length > 0) dataPoints += 1;
    if (p.profileCharacterTraits?.length > 0) dataPoints += 1;
    if (p.hasChildrenFromPrevious === true) dataPoints += 3;
    if (p.aiProfileSummary) dataPoints += 2;

    const q = user.questionnaireResponses?.[0];
    if (q) {
      if (q.religionAnswers) dataPoints += 3;
      if (q.valuesAnswers) dataPoints += 2;
      if (q.personalityAnswers) dataPoints += 1;
    }

    if (p.metrics) {
      if (p.metrics.religiousStrictness != null) dataPoints += 2;
      if (p.metrics.inferredReligiousLevel) dataPoints += 2;
    }

    return dataPoints >= 2;
  });

  const skippedForLowData = usersWithMissingFields.length - usersWithEnoughData.length;

  console.log(`\n🔎 סינון נוסף:`);
  console.log(`   ✅ עם מספיק מידע ל-AI: ${usersWithEnoughData.length}`);
  console.log(`   ⏭️  דולגו (מידע דל מדי): ${skippedForLowData}`);

  if (usersWithEnoughData.length === 0) {
    console.log('\n⚠️ אין יוזרים עם מספיק מידע לניתוח AI.');
    return;
  }

  // =========================================================================
  // Step 2: Test with ONE user first
  // =========================================================================
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 שלב 1: בדיקה על יוזר אחד');
  console.log('═'.repeat(60));

  const testUser = usersWithEnoughData[0];
  const testMissing: ('maritalStatus' | 'religiousLevel')[] = [];
  if (!testUser.profile?.maritalStatus || testUser.profile.maritalStatus === '') {
    testMissing.push('maritalStatus');
  }
  if (!testUser.profile?.religiousLevel || testUser.profile.religiousLevel === '') {
    testMissing.push('religiousLevel');
  }

  console.log(`\n📝 יוזר לבדיקה: ${testUser.firstName} ${testUser.lastName}`);
  console.log(`   שדות חסרים: ${testMissing.join(', ')}`);
  console.log(`\n📄 מידע שנשלח ל-AI:`);
  console.log('─'.repeat(40));
  const contextPreview = buildUserContext(testUser);
  const contextLines = contextPreview.split('\n');
  if (contextLines.length > 40) {
    console.log(contextLines.slice(0, 40).join('\n'));
    console.log(`   ... (עוד ${contextLines.length - 40} שורות)`);
  } else {
    console.log(contextPreview);
  }
  console.log('─'.repeat(40));

  console.log('\n⏳ שולח ל-AI...');
  const testResult = await analyzeUser(testUser, testMissing);

  if (!testResult) {
    console.log('❌ ה-AI לא הצליח לנתח את היוזר. בדוק API key ונתונים.');
    return;
  }

  displayChanges([testResult]);

  const testApproval = await askQuestion(
    '\n❓ התוצאה נראית נכונה? (y = כן, המשך לכל היוזרים / n = לא, עצור): '
  );

  if (testApproval.toLowerCase() !== 'y' && testApproval !== 'כן') {
    console.log('⛔ נעצר. תוכל לשנות את הפרומפט או לבדוק את הנתונים.');
    return;
  }

  // =========================================================================
  // Step 3: Analyze ALL remaining users
  // =========================================================================
  const remaining = usersWithEnoughData.slice(1);

  if (remaining.length === 0) {
    console.log('\n✅ היה רק יוזר אחד עם מספיק מידע.');

    const saveOne = await askQuestion('\n❓ לשמור את השינוי הזה ב-DB? (y/n): ');
    if (saveOne.toLowerCase() === 'y' || saveOne === 'כן') {
      console.log('\n💾 שומר...');
      const { successCount, failCount } = await applyChanges([testResult]);
      console.log(`\n✅ ${successCount} עודכנו, ${failCount} נכשלו.`);
    } else {
      console.log('⛔ בוטל.');
    }
    return;
  }

  console.log(`\n🚀 שלב 2: מנתח ${remaining.length} יוזרים נוספים...`);
  console.log('─'.repeat(60));

  const allChanges: ProposedChange[] = [testResult];
  let processed = 1;
  let skipped = 0;

  for (const user of remaining) {
    processed++;
    const missing: ('maritalStatus' | 'religiousLevel')[] = [];
    if (!user.profile?.maritalStatus || user.profile.maritalStatus === '') {
      missing.push('maritalStatus');
    }
    if (!user.profile?.religiousLevel || user.profile.religiousLevel === '') {
      missing.push('religiousLevel');
    }

    if (missing.length === 0) {
      skipped++;
      continue;
    }

    process.stdout.write(
      `\r   ⏳ ${processed}/${usersWithEnoughData.length} - ${user.firstName} ${user.lastName}...          `
    );

    const result = await analyzeUser(user, missing);
    if (result) {
      allChanges.push(result);
    } else {
      skipped++;
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n\n📊 ניתוח הושלם: ${allChanges.length} שינויים, ${skipped} דולגו`);

  if (allChanges.length === 0) {
    console.log('⚠️ לא נמצאו שינויים.');
    return;
  }

  // =========================================================================
  // Step 4: Display ALL changes and ask for approval
  // =========================================================================
  displayChanges(allChanges);

  const confidenceFilter = await askQuestion(
    '\n❓ איזה שינויים לעדכן?\n' +
    '   1 = רק HIGH confidence 🟢\n' +
    '   2 = HIGH + MEDIUM 🟢🟡\n' +
    '   3 = הכל (כולל LOW) 🟢🟡🔴\n' +
    '   0 = ביטול - אל תעדכן כלום\n' +
    '   בחירה: '
  );

  let filteredChanges: ProposedChange[];
  switch (confidenceFilter) {
    case '1':
      filteredChanges = allChanges.filter(c => c.confidence === 'HIGH');
      break;
    case '2':
      filteredChanges = allChanges.filter(c => c.confidence === 'HIGH' || c.confidence === 'MEDIUM');
      break;
    case '3':
      filteredChanges = allChanges;
      break;
    default:
      console.log('⛔ בוטל. לא בוצעו שינויים.');
      return;
  }

  if (filteredChanges.length === 0) {
    console.log('⚠️ אין שינויים ברמת הביטחון שנבחרה.');
    return;
  }

  console.log(`\n📊 ${filteredChanges.length} שינויים עברו את הפילטר:`);
  displayChanges(filteredChanges);

  const finalApproval = await askQuestion(
    `\n❓ אישור סופי: לעדכן ${filteredChanges.length} רשומות ב-DB? (y/n): `
  );

  if (finalApproval.toLowerCase() !== 'y' && finalApproval !== 'כן') {
    console.log('⛔ בוטל. לא בוצעו שינויים בדאטאבייס.');
    return;
  }

  // =========================================================================
  // Step 5: Apply changes
  // =========================================================================
  console.log('\n💾 מעדכן בדאטאבייס...');
  const { successCount, failCount } = await applyChanges(filteredChanges);

  console.log('\n' + '═'.repeat(60));
  console.log(`🎉 הסתיים!`);
  console.log(`   ✅ עודכנו: ${successCount}`);
  console.log(`   ❌ נכשלו: ${failCount}`);
  console.log('═'.repeat(60));
}

// =============================================================================
// Run
// =============================================================================

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });