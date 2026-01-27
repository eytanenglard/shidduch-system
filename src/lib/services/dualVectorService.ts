// ============================================================
// NeshamaTech - Dual Vector Service
// src/lib/services/dualVectorService.ts
// ============================================================

import prisma from "@/lib/prisma";
import aiService from "./aiService";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProfileDataForVectors {
  profile: {
    id: string;
    userId: string;
    gender: string;
    age: number;
    city?: string;
    religiousLevel?: string;
    occupation?: string;
    education?: string;
    about?: string;
    origin?: string;
    nativeLanguage?: string;
    additionalLanguages?: string[];
    shomerNegiah?: boolean;
    headCovering?: string;
    kippahType?: string;
    hobbies?: string[];
    matchingNotes?: string;
    preferredAgeMin?: number;
    preferredAgeMax?: number;
    preferredHeightMin?: number;
    preferredHeightMax?: number;
    preferredReligiousLevels?: string[];
    preferredLocations?: string[];
  };
  questionnaire?: {
    personality?: Record<string, any>;
    values?: Record<string, any>;
    relationship?: Record<string, any>;
    partner?: Record<string, any>;
    religion?: Record<string, any>;
  };
  aiProfileSummary?: {
    personalitySummary?: string;
    lookingForSummary?: string;
  };
  metrics?: {
    aiPersonalitySummary?: string;
    aiSeekingSummary?: string;
  };
  matchmakerNotes?: string;
}

interface DualVectorResult {
  selfVector: number[];
  seekingVector: number[];
  selfTextUsed: string;
  seekingTextUsed: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * יוצר שני וקטורים לפרופיל:
 * - SelfVector: מייצג "מי אני"
 * - SeekingVector: מייצג "מה אני מחפש"
 */
export async function generateDualVectors(profileId: string): Promise<DualVectorResult> {
  console.log(`[DualVector] Starting dual vector generation for profile: ${profileId}`);

  // 1. שליפת כל המידע
  const data = await fetchProfileData(profileId);

  // 2. בניית טקסט ל-SelfVector
  const selfText = buildSelfText(data);
  console.log(`[DualVector] Self text length: ${selfText.length} chars`);

  // 3. בניית טקסט ל-SeekingVector
  const seekingText = buildSeekingText(data);
  console.log(`[DualVector] Seeking text length: ${seekingText.length} chars`);

  // 4. יצירת הוקטורים במקביל
  const [selfVector, seekingVector] = await Promise.all([
    aiService.generateTextEmbedding(selfText),
    aiService.generateTextEmbedding(seekingText),
  ]);

  if (!selfVector || !seekingVector) {
    throw new Error('Failed to generate one or both vectors');
  }

  console.log(`[DualVector] Generated vectors - Self: ${selfVector.length}d, Seeking: ${seekingVector.length}d`);

  return {
    selfVector,
    seekingVector,
    selfTextUsed: selfText,
    seekingTextUsed: seekingText,
  };
}

// ═══════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════

async function fetchProfileData(profileId: string): Promise<ProfileDataForVectors> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      user: true,
    },
  });

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  // שליפת שאלון
  const questionnaire = await prisma.questionnaireResponse.findFirst({
    where: { userId: profile.userId },
    orderBy: { createdAt: 'desc' },
  });

  // שליפת מדדים (אם קיימים)
  const metrics = await prisma.$queryRaw<any[]>`
    SELECT "aiPersonalitySummary", "aiSeekingSummary"
    FROM profile_metrics
    WHERE "profileId" = ${profileId}
    LIMIT 1
  `;

  // חישוב גיל
  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 0;

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      gender: profile.gender,
      age,
      city: profile.city || undefined,
      religiousLevel: profile.religiousLevel || undefined,
      occupation: profile.occupation || undefined,
      education: profile.education || undefined,
      about: profile.about || undefined,
      origin: profile.origin || undefined,
      nativeLanguage: profile.nativeLanguage || undefined,
      additionalLanguages: profile.additionalLanguages || undefined,
      shomerNegiah: profile.shomerNegiah || undefined,
      headCovering: profile.headCovering || undefined,
      kippahType: profile.kippahType || undefined,
      hobbies: profile.hobbies || undefined,
      matchingNotes: profile.matchingNotes || undefined,
      preferredAgeMin: profile.preferredAgeMin || undefined,
      preferredAgeMax: profile.preferredAgeMax || undefined,
      preferredHeightMin: profile.preferredHeightMin || undefined,
      preferredHeightMax: profile.preferredHeightMax || undefined,
      preferredReligiousLevels: profile.preferredReligiousLevels || undefined,
      preferredLocations: profile.preferredLocations || undefined,
    },
    questionnaire: questionnaire
      ? {
          personality: parseJson(questionnaire.personalityAnswers),
          values: parseJson(questionnaire.valuesAnswers),
          relationship: parseJson(questionnaire.relationshipAnswers),
          partner: parseJson(questionnaire.partnerAnswers),
          religion: parseJson(questionnaire.religionAnswers),
        }
      : undefined,
    aiProfileSummary: profile.aiProfileSummary
      ? parseJson(profile.aiProfileSummary)
      : undefined,
    metrics: metrics[0] || undefined,
    matchmakerNotes: profile.internalMatchmakerNotes || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
// SELF VECTOR TEXT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * בונה את הטקסט שמייצג "מי אני"
 * כולל: אישיות, ערכים, רקע, סגנון חיים
 */
function buildSelfText(data: ProfileDataForVectors): string {
  const parts: string[] = [];
  const p = data.profile;

  // --- כותרת ---
  parts.push(`Profile Self-Description:`);

  // --- דמוגרפיה בסיסית ---
  parts.push(`Demographics: ${p.gender}, age ${p.age}, living in ${p.city || 'Israel'}`);

  // --- זהות דתית ---
  if (p.religiousLevel) {
    parts.push(`Religious Identity: ${formatReligiousLevel(p.religiousLevel)}`);
  }
  if (p.shomerNegiah !== undefined) {
    parts.push(`Shomer Negiah: ${p.shomerNegiah ? 'Yes' : 'No'}`);
  }
  if (p.headCovering) {
    parts.push(`Head Covering: ${p.headCovering}`);
  }
  if (p.kippahType) {
    parts.push(`Kippah: ${p.kippahType}`);
  }

  // --- רקע מקצועי ---
  if (p.occupation) {
    parts.push(`Occupation: ${p.occupation}`);
  }
  if (p.education) {
    parts.push(`Education: ${p.education}`);
  }

  // --- רקע תרבותי ---
  if (p.origin) {
    parts.push(`Origin/Background: ${p.origin}`);
  }
  if (p.nativeLanguage) {
    parts.push(`Native Language: ${p.nativeLanguage}`);
  }
  if (p.additionalLanguages?.length) {
    parts.push(`Additional Languages: ${p.additionalLanguages.join(', ')}`);
  }

  // --- תיאור עצמי (הכי חשוב!) ---
  if (p.about) {
    parts.push(`\nPersonal Description:\n${p.about}`);
  }

  // --- תחביבים ---
  if (p.hobbies?.length) {
    parts.push(`Hobbies & Interests: ${p.hobbies.join(', ')}`);
  }

  // --- סיכום AI של האישיות ---
  if (data.aiProfileSummary?.personalitySummary) {
    parts.push(`\nPersonality Summary:\n${data.aiProfileSummary.personalitySummary}`);
  }
  if (data.metrics?.aiPersonalitySummary) {
    parts.push(`\nAI Personality Analysis:\n${data.metrics.aiPersonalitySummary}`);
  }

  // --- מהשאלון: אישיות ---
  if (data.questionnaire?.personality) {
    const personalityText = extractQuestionnaireText(data.questionnaire.personality, 'personality');
    if (personalityText) {
      parts.push(`\nPersonality Traits (from questionnaire):\n${personalityText}`);
    }
  }

  // --- מהשאלון: ערכים ---
  if (data.questionnaire?.values) {
    const valuesText = extractQuestionnaireText(data.questionnaire.values, 'values');
    if (valuesText) {
      parts.push(`\nCore Values (from questionnaire):\n${valuesText}`);
    }
  }

  // --- מהשאלון: זוגיות (הצד של "איך אני בזוגיות") ---
  if (data.questionnaire?.relationship) {
    const relationshipText = extractQuestionnaireText(data.questionnaire.relationship, 'relationship_self');
    if (relationshipText) {
      parts.push(`\nRelationship Style (from questionnaire):\n${relationshipText}`);
    }
  }

  // --- מהשאלון: דת (הצד של "מה אני מקיים") ---
  if (data.questionnaire?.religion) {
    const religionText = extractQuestionnaireText(data.questionnaire.religion, 'religion_practice');
    if (religionText) {
      parts.push(`\nReligious Practice (from questionnaire):\n${religionText}`);
    }
  }

  // --- הערות שדכן (אם יש) ---
  if (data.matchmakerNotes) {
    parts.push(`\nMatchmaker Notes:\n${data.matchmakerNotes}`);
  }

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// SEEKING VECTOR TEXT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * בונה את הטקסט שמייצג "מה אני מחפש"
 * כולל: העדפות, דרישות, Deal Breakers
 */
function buildSeekingText(data: ProfileDataForVectors): string {
  const parts: string[] = [];
  const p = data.profile;

  // --- כותרת ---
  parts.push(`What I'm Looking For in a Partner:`);

  // --- העדפות מפורשות ---
  if (p.preferredAgeMin || p.preferredAgeMax) {
    parts.push(`Preferred Age Range: ${p.preferredAgeMin || '?'} - ${p.preferredAgeMax || '?'}`);
  }
  if (p.preferredHeightMin || p.preferredHeightMax) {
    parts.push(`Preferred Height Range: ${p.preferredHeightMin || '?'} - ${p.preferredHeightMax || '?'} cm`);
  }
  if (p.preferredReligiousLevels?.length) {
    parts.push(`Preferred Religious Levels: ${p.preferredReligiousLevels.map(formatReligiousLevel).join(', ')}`);
  }
  if (p.preferredLocations?.length) {
    parts.push(`Preferred Locations: ${p.preferredLocations.join(', ')}`);
  }

  // --- הערות התאמה ---
  if (p.matchingNotes) {
    parts.push(`\nMatching Notes:\n${p.matchingNotes}`);
  }

  // --- סיכום AI של מה מחפש ---
  if (data.aiProfileSummary?.lookingForSummary) {
    parts.push(`\nLooking For Summary:\n${data.aiProfileSummary.lookingForSummary}`);
  }
  if (data.metrics?.aiSeekingSummary) {
    parts.push(`\nAI Analysis - Seeking:\n${data.metrics.aiSeekingSummary}`);
  }

  // --- מהשאלון: בן/בת זוג ---
  if (data.questionnaire?.partner) {
    const partnerText = extractQuestionnaireText(data.questionnaire.partner, 'partner');
    if (partnerText) {
      parts.push(`\nPartner Preferences (from questionnaire):\n${partnerText}`);
    }
  }

  // --- מהשאלון: דת (הצד של "מה אני מחפש בבן/ת זוג") ---
  if (data.questionnaire?.religion) {
    const religionSeekingText = extractQuestionnaireText(data.questionnaire.religion, 'religion_seeking');
    if (religionSeekingText) {
      parts.push(`\nReligious Preferences for Partner:\n${religionSeekingText}`);
    }
  }

  // --- מהשאלון: זוגיות (הצד של "מה אני מחפש") ---
  if (data.questionnaire?.relationship) {
    const relationshipSeekingText = extractQuestionnaireText(data.questionnaire.relationship, 'relationship_seeking');
    if (relationshipSeekingText) {
      parts.push(`\nRelationship Expectations:\n${relationshipSeekingText}`);
    }
  }

  // --- Deal Breakers (אם זמינים) ---
  // נוסיף פה Deal Breakers מהמדדים אם יש

  // --- שפה נדרשת ---
  if (p.nativeLanguage?.toLowerCase() === 'english') {
    parts.push(`\nLanguage Requirement: Must speak English fluently`);
  }

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE TEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * מחלץ טקסט רלוונטי מתשובות השאלון לפי סוג
 */
function extractQuestionnaireText(
  answers: Record<string, any>,
  type: 'personality' | 'values' | 'relationship_self' | 'relationship_seeking' | 'partner' | 'religion_practice' | 'religion_seeking'
): string {
  if (!answers) return '';

  const relevantAnswers: string[] = [];

  // אם זה מערך של תשובות
  if (Array.isArray(answers)) {
    const filtered = answers.filter((a) => isRelevantQuestion(a.questionId, type));
    filtered.forEach((a) => {
      const text = formatAnswerValue(a.value);
      if (text) {
        relevantAnswers.push(text);
      }
    });
  } else {
    // אם זה אובייקט עם מפתחות
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (isRelevantQuestion(questionId, type)) {
        const value = typeof answer === 'object' && answer?.value ? answer.value : answer;
        const text = formatAnswerValue(value);
        if (text) {
          relevantAnswers.push(text);
        }
      }
    });
  }

  return relevantAnswers.join('. ');
}

/**
 * בודק אם שאלה רלוונטית לסוג מסוים
 */
function isRelevantQuestion(questionId: string, type: string): boolean {
  const selfQuestions = {
    personality: [
      'personality_self_portrayal',
      'personality_trait_allocation',
      'personality_social_battery',
      'personality_biological_clock',
      'personality_daily_structure',
      'personality_stress_management',
      'personality_friendship_style',
      'personality_communication_style',
      'personality_humor_type',
      'personality_handling_criticism',
      'personality_motivation',
    ],
    values: [
      'values_core_identification',
      'values_childhood_atmosphere',
      'values_moral_dilemmas',
      'values_giving_importance',
      'values_education_pursuit',
      'values_social_political',
      'values_non_negotiables',
    ],
    relationship_self: [
      'relationship_communication_ideal',
      'relationship_handling_disappointment',
      'relationship_repair_mechanisms',
      'relationship_expressing_needs',
      'relationship_argument_style',
      'relationship_partner_bad_day',
      'relationship_household_philosophy',
    ],
    religion_practice: [
      'religion_kashrut_observance',
      'religion_modesty_approach',
      'religion_shabbat_experience',
      'religion_culture_consumption',
      'religion_community_role',
      'religion_daily_connection',
    ],
  };

  const seekingQuestions = {
    partner: [
      'partner_first_impression',
      'partner_appearance_importance',
      'partner_intelligence_types',
      'partner_character_traits',
      'partner_completion_trait',
      'partner_emotional_expression',
      'partner_lifestyle_pace',
      'partner_financial_habits',
      'partner_career_ambition',
      'partner_deal_breakers',
    ],
    relationship_seeking: [
      'relationship_core_meaning',
      'relationship_key_feelings',
      'relationship_love_languages',
      'relationship_togetherness_autonomy',
      'relationship_growth_role',
      'relationship_family_vision',
      'relationship_deal_breakers',
    ],
    religion_seeking: [
      'religion_partner_learning',
      'religion_partner_ideal_profile',
      'religion_flexibility_differences',
      'religion_gender_roles',
      'religion_children_education',
    ],
  };

  const allQuestions = { ...selfQuestions, ...seekingQuestions };
  const relevantIds = (allQuestions as any)[type] || [];

  // בדיקה גם חלקית (אם questionId מכיל אחד מהמפתחות)
  return relevantIds.some((id: string) => questionId.includes(id));
}

/**
 * מפרמט ערך תשובה לטקסט
 */
function formatAnswerValue(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.map(formatAnswerValue).filter(Boolean).join(', ');
  }

  if (typeof value === 'object') {
    // עבור allocation objects (100% על קטגוריות)
    const entries = Object.entries(value)
      .filter(([_, v]) => v && Number(v) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3);  // רק 3 הכי גבוהים

    if (entries.length > 0) {
      return entries.map(([k, v]) => `${k}: ${v}%`).join(', ');
    }
  }

  return '';
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function parseJson(value: any): any {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function formatReligiousLevel(level: string): string {
  const mapping: Record<string, string> = {
    charedi_hasidic: 'Charedi Hasidic',
    charedi_litvish: 'Charedi Litvish',
    charedi_sephardi: 'Charedi Sephardi',
    chardal: 'Chardal (Religious-Zionist Charedi)',
    dati_leumi_torani: 'Dati Leumi Torani',
    dati_leumi: 'Dati Leumi (Religious-Zionist)',
    dati_leumi_liberal: 'Dati Leumi Liberal',
    dati_lite: 'Dati Lite',
    masorti_dati: 'Masorti-Religious',
    masorti: 'Masorti (Traditional)',
    masorti_hiloni: 'Masorti-Secular',
    hiloni_traditional: 'Secular with Tradition',
    hiloni: 'Secular',
    secular: 'Secular',
  };

  return mapping[level] || level;
}

// ═══════════════════════════════════════════════════════════════
// SAVE TO DATABASE
// ═══════════════════════════════════════════════════════════════

export async function saveDualVectors(
  profileId: string,
  vectors: DualVectorResult
): Promise<void> {
  const selfVectorSql = `[${vectors.selfVector.join(',')}]`;
  const seekingVectorSql = `[${vectors.seekingVector.join(',')}]`;

  await prisma.$executeRaw`
    UPDATE "profile_vectors"
    SET 
      "selfVector" = ${selfVectorSql}::vector,
      "seekingVector" = ${seekingVectorSql}::vector,
      "selfVectorUpdatedAt" = NOW(),
      "seekingVectorUpdatedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "profileId" = ${profileId}
  `;

  // אם אין רשומה, יוצרים חדשה
  const result = await prisma.$executeRaw`
    INSERT INTO "profile_vectors" ("id", "profileId", "selfVector", "seekingVector", "selfVectorUpdatedAt", "seekingVectorUpdatedAt", "updatedAt")
    SELECT 
      ${'pv_' + Math.random().toString(36).substring(2, 15)},
      ${profileId},
      ${selfVectorSql}::vector,
      ${seekingVectorSql}::vector,
      NOW(),
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM "profile_vectors" WHERE "profileId" = ${profileId}
    )
  `;

  console.log(`[DualVector] Saved vectors for profile: ${profileId}`);
}

// ═══════════════════════════════════════════════════════════════
// FULL UPDATE FLOW
// ═══════════════════════════════════════════════════════════════

/**
 * מעדכן את כל הנתונים של פרופיל:
 * 1. מחשב מדדים
 * 2. יוצר וקטורים כפולים
 * 3. שומר הכל ל-DB
 */
export async function updateProfileVectorsAndMetrics(profileId: string): Promise<{
  metricsUpdated: boolean;
  vectorsUpdated: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let metricsUpdated = false;
  let vectorsUpdated = false;

  try {
    // 1. חישוב מדדים
    console.log(`[UpdateProfile] Starting metrics extraction for: ${profileId}`);
    const { extractMetricsFromProfile, saveProfileMetrics } = await import('./metricsExtractionService');
    const metricsOutput = await extractMetricsFromProfile(profileId);
    await saveProfileMetrics(profileId, metricsOutput);
    metricsUpdated = true;
    console.log(`[UpdateProfile] Metrics saved. Confidence: ${metricsOutput.overallConfidence}%`);
  } catch (error) {
    console.error(`[UpdateProfile] Metrics extraction failed:`, error);
    errors.push(`Metrics extraction failed: ${error}`);
  }

  try {
    // 2. יצירת וקטורים
    console.log(`[UpdateProfile] Starting dual vector generation for: ${profileId}`);
    const vectors = await generateDualVectors(profileId);
    await saveDualVectors(profileId, vectors);
    vectorsUpdated = true;
    console.log(`[UpdateProfile] Vectors saved.`);
  } catch (error) {
    console.error(`[UpdateProfile] Vector generation failed:`, error);
    errors.push(`Vector generation failed: ${error}`);
  }

  return { metricsUpdated, vectorsUpdated, errors };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const dualVectorService = {
  generateDualVectors,
  saveDualVectors,
  updateProfileVectorsAndMetrics,
};

export default dualVectorService;