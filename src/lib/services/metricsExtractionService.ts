// ============================================================
// NeshamaTech - Metrics Extraction Service
// src/lib/services/metricsExtractionService.ts
// ============================================================

import prisma from "@/lib/prisma";
import aiService from "./aiService";
import {
  ProfileMetrics,
  MetricsExtractionInput,
  MetricsExtractionOutput,
  MetricExplanation,
  CalculatedBy,
  BackgroundCategory,
  EthnicBackground,
  HumorStyle,
  CommunicationStyle,
  ConflictStyle,
  SupportStyle,
  PetsAttitude,
  PersonalityType,
  AttachmentStyle,
  LoveLanguage,
  HardDealBreaker,
  SoftDealBreaker,
  calculateBackgroundCategory,
  calculateEnglishFluency,
  calculateUrbanScore,
  religiousLevelToScore,
} from "@/types/profileMetrics";

// ═══════════════════════════════════════════════════════════════
// MAIN EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * מחלץ מדדים מפרופיל קיים
 * משלב נתונים מהשאלון + ניתוח AI + חישובים
 */
export async function extractMetricsFromProfile(
  profileId: string
): Promise<MetricsExtractionOutput> {
  console.log(`[MetricsExtraction] Starting extraction for profile: ${profileId}`);
  const startTime = Date.now();

  // 1. שליפת כל המידע על הפרופיל
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      user: true,
      testimonials: true,
    },
  });

  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }

  // 2. שליפת תשובות השאלון
  const questionnaire = await prisma.questionnaireResponse.findFirst({
    where: { userId: profile.userId },
    orderBy: { createdAt: 'desc' },
  });

  // 3. חישוב גיל
  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : undefined;

  // 4. הכנת קלט לחילוץ
  const input: MetricsExtractionInput = {
    profile: {
      id: profile.id,
      gender: profile.gender,
      age: age || 0,
      city: profile.city || undefined,
      religiousLevel: profile.religiousLevel || undefined,
      religiousJourney: profile.religiousJourney || undefined,
      occupation: profile.occupation || undefined,
      education: profile.education || undefined,
      about: profile.about || undefined,
      origin: profile.origin || undefined,
      nativeLanguage: profile.nativeLanguage || undefined,
      additionalLanguages: profile.additionalLanguages || undefined,
      aliyaYear: profile.aliyaYear || undefined,
      aliyaCountry: profile.aliyaCountry || undefined,
      shomerNegiah: profile.shomerNegiah || undefined,
      headCovering: profile.headCovering || undefined,
      kippahType: profile.kippahType || undefined,
    },
    questionnaireAnswers: questionnaire
      ? {
          personality: parseJsonField(questionnaire.personalityAnswers),
          values: parseJsonField(questionnaire.valuesAnswers),
          relationship: parseJsonField(questionnaire.relationshipAnswers),
          partner: parseJsonField(questionnaire.partnerAnswers),
          religion: parseJsonField(questionnaire.religionAnswers),
        }
      : undefined,
    aiProfileSummary: profile.aiProfileSummary
      ? parseJsonField(profile.aiProfileSummary)
      : undefined,
    matchmakerNotes: profile.internalMatchmakerNotes || undefined,
  };

  // 5. חישוב מדדים שניתן לחשב ישירות (ללא AI)
  const directMetrics = calculateDirectMetrics(input);

  // 6. חילוץ מדדים עם AI
  const aiMetrics = await extractMetricsWithAI(input);

  // 7. מיזוג המדדים (עדיפות לנתונים ישירים)
  const mergedMetrics = mergeMetrics(directMetrics, aiMetrics);

  // 8. חילוץ Deal Breakers
  const dealBreakers = extractDealBreakers(input);

  // 9. חישוב שלמות הנתונים
  const dataCompleteness = calculateDataCompleteness(mergedMetrics);

  // 10. בניית התוצאה הסופית
  const result: MetricsExtractionOutput = {
    metrics: {
      ...mergedMetrics.metrics,
      dealBreakersHard: dealBreakers.hard,
      dealBreakersSoft: dealBreakers.soft,
      dataCompleteness,
      confidenceScore: Math.round((directMetrics.confidence + aiMetrics.confidence) / 2),
      calculatedBy: CalculatedBy.AI_AUTO,
      lastAiAnalysisAt: new Date(),
    },
    explanations: {
      ...directMetrics.explanations,
      ...aiMetrics.explanations,
    },
    overallConfidence: Math.round((directMetrics.confidence + aiMetrics.confidence) / 2),
    warnings: [...directMetrics.warnings, ...aiMetrics.warnings],
  };

  const duration = Date.now() - startTime;
  console.log(`[MetricsExtraction] Completed in ${duration}ms. Confidence: ${result.overallConfidence}%`);

  return result;
}

// ═══════════════════════════════════════════════════════════════
// DIRECT CALCULATION (NO AI)
// ═══════════════════════════════════════════════════════════════

interface DirectMetricsResult {
  metrics: Partial<ProfileMetrics>;
  explanations: Record<string, MetricExplanation>;
  confidence: number;
  warnings: string[];
}

function calculateDirectMetrics(input: MetricsExtractionInput): DirectMetricsResult {
  const metrics: Partial<ProfileMetrics> = {};
  const explanations: Record<string, MetricExplanation> = {};
  const warnings: string[] = [];

  // --- רקע תרבותי ---
  metrics.backgroundCategory = calculateBackgroundCategory(
    input.profile.aliyaYear,
    input.profile.nativeLanguage,
    input.profile.aliyaCountry
  );
  explanations.backgroundCategory = {
    value: 0,
    confidence: 95,
    source: 'questionnaire',
    reasoning: `Calculated from aliyaYear: ${input.profile.aliyaYear}, nativeLanguage: ${input.profile.nativeLanguage}`,
  };

  // --- אנגלית ---
  metrics.englishFluency = calculateEnglishFluency(
    input.profile.nativeLanguage,
    input.profile.additionalLanguages,
    input.profile.aliyaCountry
  );
  explanations.englishFluency = {
    value: metrics.englishFluency,
    confidence: 80,
    source: 'questionnaire',
    reasoning: `Based on nativeLanguage: ${input.profile.nativeLanguage}, aliyaCountry: ${input.profile.aliyaCountry}`,
  };

  // --- עירוניות ---
  metrics.urbanScore = calculateUrbanScore(input.profile.city);
  explanations.urbanScore = {
    value: metrics.urbanScore,
    confidence: 90,
    source: 'questionnaire',
    reasoning: `Based on city: ${input.profile.city}`,
  };

  // --- רמה דתית ---
  const religiousScore = religiousLevelToScore(input.profile.religiousLevel);
  if (religiousScore !== undefined) {
    metrics.religiousStrictness = religiousScore;
    explanations.religiousStrictness = {
      value: religiousScore,
      confidence: 95,
      source: 'questionnaire',
      reasoning: `Direct mapping from religiousLevel: ${input.profile.religiousLevel}`,
    };
  }

  // --- עדה/מוצא ---
  if (input.profile.origin) {
    metrics.ethnicBackground = mapOriginToEthnicity(input.profile.origin);
    explanations.ethnicBackground = {
      value: 0,
      confidence: 85,
      source: 'questionnaire',
      reasoning: `Mapped from origin: ${input.profile.origin}`,
    };
  }

  // --- התאמה לאמריקאים ---
  metrics.americanCompatibility = calculateAmericanCompatibility(input);
  explanations.americanCompatibility = {
    value: metrics.americanCompatibility,
    confidence: 75,
    source: 'inferred',
    reasoning: 'Calculated from englishFluency + backgroundCategory + aliyaCountry',
  };

  // --- מתשובות השאלון הישירות ---
  if (input.questionnaireAnswers) {
    const questionnaireMetrics = extractFromQuestionnaire(input.questionnaireAnswers);
    Object.assign(metrics, questionnaireMetrics.metrics);
    Object.assign(explanations, questionnaireMetrics.explanations);
  }

  // חישוב confidence כולל
  const filledMetrics = Object.values(metrics).filter(v => v !== undefined && v !== null).length;
  const confidence = Math.min(95, Math.round((filledMetrics / 20) * 100));

  return { metrics, explanations, confidence, warnings };
}

// ═══════════════════════════════════════════════════════════════
// AI EXTRACTION
// ═══════════════════════════════════════════════════════════════

interface AIMetricsResult {
  metrics: Partial<ProfileMetrics>;
  explanations: Record<string, MetricExplanation>;
  confidence: number;
  warnings: string[];
}

async function extractMetricsWithAI(input: MetricsExtractionInput): Promise<AIMetricsResult> {
  const prompt = buildAIExtractionPrompt(input);

  try {
    const response = await aiService.generateText(prompt, {
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 4000,
    });

    const parsed = parseAIResponse(response);
    return parsed;
  } catch (error) {
    console.error('[MetricsExtraction] AI extraction failed:', error);
    return {
      metrics: {},
      explanations: {},
      confidence: 0,
      warnings: ['AI extraction failed, using direct calculations only'],
    };
  }
}

function buildAIExtractionPrompt(input: MetricsExtractionInput): string {
  return `אתה מנתח פרופילים עבור מערכת שידוכים. נתח את הפרופיל הבא והחזר מדדים מספריים.

## פרטי הפרופיל:
- מגדר: ${input.profile.gender}
- גיל: ${input.profile.age}
- עיר: ${input.profile.city || 'לא צוין'}
- רמה דתית: ${input.profile.religiousLevel || 'לא צוין'}
- מקצוע: ${input.profile.occupation || 'לא צוין'}
- השכלה: ${input.profile.education || 'לא צוין'}

## תיאור עצמי:
${input.profile.about || 'לא זמין'}

## סיכום AI קיים:
${input.aiProfileSummary?.personalitySummary || 'לא זמין'}

## מה מחפש/ת:
${input.aiProfileSummary?.lookingForSummary || 'לא זמין'}

## הערות שדכן:
${input.matchmakerNotes || 'אין'}

## תשובות שאלון (אם קיימות):
${input.questionnaireAnswers ? JSON.stringify(input.questionnaireAnswers, null, 2).slice(0, 3000) : 'לא זמין'}

---

החזר JSON בפורמט הבא בלבד (ללא טקסט נוסף):

{
  "metrics": {
    "socialEnergy": <0-100 | null>,
    "emotionalExpression": <0-100 | null>,
    "stabilityVsSpontaneity": <0-100 | null>,
    "independenceLevel": <0-100 | null>,
    "optimismLevel": <0-100 | null>,
    "careerOrientation": <0-100 | null>,
    "intellectualOrientation": <0-100 | null>,
    "financialApproach": <0-100 | null>,
    "ambitionLevel": <0-100 | null>,
    "spiritualDepth": <0-100 | null>,
    "cultureConsumption": <0-100 | null>,
    "togetherVsAutonomy": <0-100 | null>,
    "familyInvolvement": <0-100 | null>,
    "parenthoodPriority": <0-100 | null>,
    "growthVsAcceptance": <0-100 | null>,
    "nightOwlScore": <0-100 | null>,
    "adventureScore": <0-100 | null>,
    "appearancePickiness": <0-100 | null>,
    "humorStyle": <"CYNICAL"|"LIGHT"|"WORDPLAY"|"SELF_DEPRECATING"|"DRY" | null>,
    "communicationStyle": <"DIRECT"|"EMPATHETIC"|"ANALYTICAL"|"HUMOROUS"|"EMOTIONAL" | null>,
    "conflictStyle": <"CONFRONTING"|"AVOIDING"|"COMPROMISING"|"NEEDS_TIME"|"COLLABORATIVE" | null>,
    "supportStyle": <"LISTENING"|"SOLVING"|"DISTRACTING"|"SPACE" | null>,
    "petsAttitude": <"LOVE"|"NEUTRAL"|"DISLIKE"|"ALLERGIC" | null>,
    "inferredPersonalityType": <"LEADER"|"SUPPORTER"|"ANALYTICAL"|"CREATIVE"|"CAREGIVER"|"ADVENTURER"|"HARMONIZER" | null>,
    "inferredAttachmentStyle": <"SECURE"|"ANXIOUS"|"AVOIDANT"|"DISORGANIZED" | null>,
    "inferredLoveLanguages": [<array of "QUALITY_TIME"|"WORDS_OF_AFFIRMATION"|"PHYSICAL_TOUCH"|"ACTS_OF_SERVICE"|"GIFTS">],
    "difficultyFlags": [<array of strings describing potential matching challenges>]
  },
  "explanations": {
    "<metric_name>": {
      "value": <number>,
      "confidence": <0-100>,
      "reasoning": "<short explanation in Hebrew>"
    }
  },
  "aiPersonalitySummary": "<2-3 sentences summarizing personality in Hebrew>",
  "aiSeekingSummary": "<2-3 sentences summarizing what they're looking for in Hebrew>",
  "warnings": [<array of concerns or missing data notes>]
}

## הנחיות חשובות:
1. אם אין מספיק מידע למדד, החזר null
2. confidence צריך לשקף כמה בטוח אתה בערך (0=ניחוש, 100=ברור מהנתונים)
3. השתמש ב-null רק אם באמת אין רמז - נסה להסיק מהטקסט החופשי
4. עבור appearancePickiness: 0=לא מקפיד בכלל, 100=מאוד מקפיד על מראה (חשוב לזיהוי!)
5. עבור difficultyFlags: רשום אתגרים פוטנציאליים בשידוך (מקפיד על מראה, טווח צר, וכו')
6. הסברים צריכים להיות קצרים וברורים בעברית`;
}

function parseAIResponse(response: string): AIMetricsResult {
  try {
    // ניקוי התגובה מ-markdown אם יש
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const metrics: Partial<ProfileMetrics> = {};
    const explanations: Record<string, MetricExplanation> = {};

    // מיפוי המדדים
    if (parsed.metrics) {
      Object.entries(parsed.metrics).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          (metrics as any)[key] = value;
        }
      });
    }

    // מיפוי ההסברים
    if (parsed.explanations) {
      Object.entries(parsed.explanations).forEach(([key, exp]: [string, any]) => {
        explanations[key] = {
          value: exp.value || 0,
          confidence: exp.confidence || 50,
          source: 'inferred',
          reasoning: exp.reasoning || '',
        };
      });
    }

    // הוספת סיכומים
    if (parsed.aiPersonalitySummary) {
      metrics.aiPersonalitySummary = parsed.aiPersonalitySummary;
    }
    if (parsed.aiSeekingSummary) {
      metrics.aiSeekingSummary = parsed.aiSeekingSummary;
    }

    // חישוב confidence ממוצע
    const confidenceValues = Object.values(explanations)
      .map((e) => e.confidence)
      .filter((c) => c > 0);
    const avgConfidence =
      confidenceValues.length > 0
        ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
        : 50;

    return {
      metrics,
      explanations,
      confidence: avgConfidence,
      warnings: parsed.warnings || [],
    };
  } catch (error) {
    console.error('[MetricsExtraction] Failed to parse AI response:', error);
    return {
      metrics: {},
      explanations: {},
      confidence: 0,
      warnings: ['Failed to parse AI response'],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// DEAL BREAKERS EXTRACTION
// ═══════════════════════════════════════════════════════════════

interface DealBreakersResult {
  hard: HardDealBreaker[];
  soft: SoftDealBreaker[];
}

function extractDealBreakers(input: MetricsExtractionInput): DealBreakersResult {
  const hard: HardDealBreaker[] = [];
  const soft: SoftDealBreaker[] = [];

  // --- Deal Breakers קשיחים מרמה דתית ---
  if (input.profile.religiousLevel) {
    const level = input.profile.religiousLevel;
    
    // דתי-תורני לא יוצא עם מסורתי/חילוני
    if (['dati_leumi_torani', 'chardal', 'charedi_litvish', 'charedi_hasidic', 'charedi_sephardi'].includes(level)) {
      hard.push({
        type: 'RELIGIOUS_LEVEL',
        operator: 'NOT_IN',
        values: ['masorti', 'masorti_hiloni', 'hiloni', 'hiloni_traditional', 'secular'],
        description: 'רמה דתית גבוהה - לא מתאים למסורתיים/חילוניים',
      });
    }
    
    // מסורתי לא יוצא עם חרדי
    if (['masorti', 'masorti_dati'].includes(level)) {
      hard.push({
        type: 'RELIGIOUS_LEVEL',
        operator: 'NOT_IN',
        values: ['charedi_litvish', 'charedi_hasidic', 'charedi_sephardi'],
        description: 'מסורתי - לא מתאים לחרדים',
      });
    }
  }

  // --- שפה כ-Deal Breaker ---
  // אם דובר רק אנגלית, חייב בן/בת זוג שדובר אנגלית
  if (
    input.profile.nativeLanguage?.toLowerCase() === 'english' &&
    (!input.profile.additionalLanguages || !input.profile.additionalLanguages.includes('hebrew'))
  ) {
    hard.push({
      type: 'LANGUAGE',
      operator: 'MUST_INCLUDE',
      value: 'english',
      description: 'דובר/ת אנגלית בלבד - חייב בן/ת זוג שדובר/ת אנגלית',
    });
  }

  // --- Deal Breakers מהשאלון ---
  if (input.questionnaireAnswers?.partner) {
    // חיפוש תשובות על Deal Breakers בשאלון
    const partnerAnswers = input.questionnaireAnswers.partner;
    
    // דוגמה: אם ענה שלא מוכן לצאת עם מי שיש לו ילדים
    // (צריך להתאים ל-ID של השאלה בשאלון האמיתי)
  }

  // --- Deal Breakers רכים ---
  
  // פער עדתי
  soft.push({
    type: 'ETHNIC_MISMATCH',
    preferred: ['SAME', 'MIXED'],
    penalty: 10,
    description: 'העדפה לרקע עדתי דומה',
  });

  return { hard, soft };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function parseJsonField(field: any): any {
  if (!field) return undefined;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
}

function mapOriginToEthnicity(origin: string): EthnicBackground {
  const originLower = origin.toLowerCase();
  
  if (['אשכנזי', 'ashkenazi', 'russia', 'poland', 'germany', 'usa', 'uk', 'france'].some(o => originLower.includes(o))) {
    return EthnicBackground.ASHKENAZI;
  }
  if (['ספרדי', 'מזרחי', 'sephardi', 'morocco', 'iraq', 'iran', 'yemen', 'tunisia', 'libya'].some(o => originLower.includes(o))) {
    return EthnicBackground.SEPHARDI;
  }
  if (['אתיופי', 'ethiopian', 'ethiopia'].some(o => originLower.includes(o))) {
    return EthnicBackground.ETHIOPIAN;
  }
  if (['תימני', 'yemenite', 'yemen'].some(o => originLower.includes(o))) {
    return EthnicBackground.YEMENITE;
  }
  if (['מעורב', 'mixed'].some(o => originLower.includes(o))) {
    return EthnicBackground.MIXED;
  }
  
  return EthnicBackground.OTHER;
}

function calculateAmericanCompatibility(input: MetricsExtractionInput): number {
  let score = 0;
  
  // אנגלית
  const englishFluency = calculateEnglishFluency(
    input.profile.nativeLanguage,
    input.profile.additionalLanguages,
    input.profile.aliyaCountry
  );
  score += englishFluency * 0.5;  // 50% מהציון
  
  // רקע אמריקאי
  const englishCountries = ['usa', 'united states', 'canada', 'uk', 'australia'];
  if (input.profile.aliyaCountry && englishCountries.some(c => input.profile.aliyaCountry!.toLowerCase().includes(c))) {
    score += 30;
  }
  
  // צבר בינלאומי
  const bgCategory = calculateBackgroundCategory(
    input.profile.aliyaYear,
    input.profile.nativeLanguage,
    input.profile.aliyaCountry
  );
  if (bgCategory === BackgroundCategory.SABRA_INTERNATIONAL) {
    score += 20;
  }
  
  return Math.min(100, Math.round(score));
}

function extractFromQuestionnaire(answers: MetricsExtractionInput['questionnaireAnswers']): DirectMetricsResult {
  const metrics: Partial<ProfileMetrics> = {};
  const explanations: Record<string, MetricExplanation> = {};
  
  if (!answers) {
    return { metrics, explanations, confidence: 0, warnings: [] };
  }

  // --- מעולם האישיות ---
  if (answers.personality) {
    // חברותיות (social_battery)
    const socialBattery = findAnswer(answers.personality, 'personality_social_battery_recharge');
    if (socialBattery) {
      // המרה מהתשובה לציון 0-100
      metrics.socialEnergy = mapSocialBatteryToScore(socialBattery);
      explanations.socialEnergy = {
        value: metrics.socialEnergy!,
        confidence: 90,
        source: 'questionnaire',
        reasoning: 'מבוסס על שאלת "מה מטעין אותך"',
        sourceQuestions: ['personality_social_battery_recharge'],
      };
    }

    // שעון ביולוגי
    const biologicalClock = findAnswer(answers.personality, 'personality_biological_clock');
    if (biologicalClock && typeof biologicalClock === 'number') {
      metrics.nightOwlScore = biologicalClock * 10;  // 1-10 → 10-100
      explanations.nightOwlScore = {
        value: metrics.nightOwlScore,
        confidence: 95,
        source: 'questionnaire',
        reasoning: 'מבוסס על שאלת שעון ביולוגי',
        sourceQuestions: ['personality_biological_clock'],
      };
    }

    // סדר וארגון
    const dailyStructure = findAnswer(answers.personality, 'personality_daily_structure');
    if (dailyStructure) {
      metrics.stabilityVsSpontaneity = mapStructureToScore(dailyStructure);
      explanations.stabilityVsSpontaneity = {
        value: metrics.stabilityVsSpontaneity!,
        confidence: 85,
        source: 'questionnaire',
        reasoning: 'מבוסס על שאלת מבנה יום',
        sourceQuestions: ['personality_daily_structure'],
      };
    }
  }

  // --- מעולם הערכים ---
  if (answers.values) {
    // הקצאת ערכים (100% על קטגוריות)
    const coreValues = findAnswer(answers.values, 'values_core_identification');
    if (coreValues && typeof coreValues === 'object') {
      // קריירה
      if (coreValues.career !== undefined) {
        metrics.careerOrientation = coreValues.career;
        explanations.careerOrientation = {
          value: coreValues.career,
          confidence: 95,
          source: 'questionnaire',
          reasoning: 'הקצאת ערכים - קריירה',
        };
      }
      // משפחה
      if (coreValues.family !== undefined) {
        metrics.familyInvolvement = coreValues.family;
        explanations.familyInvolvement = {
          value: coreValues.family,
          confidence: 90,
          source: 'questionnaire',
          reasoning: 'הקצאת ערכים - משפחה',
        };
      }
      // רוחניות
      if (coreValues.spirituality !== undefined) {
        metrics.spiritualDepth = coreValues.spirituality;
        explanations.spiritualDepth = {
          value: coreValues.spirituality,
          confidence: 90,
          source: 'questionnaire',
          reasoning: 'הקצאת ערכים - רוחניות',
        };
      }
      // ביטחון כלכלי
      if (coreValues.financial !== undefined) {
        metrics.financialApproach = 100 - coreValues.financial;  // הפוך - חסכן = גבוה
        explanations.financialApproach = {
          value: metrics.financialApproach,
          confidence: 85,
          source: 'questionnaire',
          reasoning: 'הקצאת ערכים - ביטחון כלכלי',
        };
      }
    }
  }

  // --- מעולם הזוגיות ---
  if (answers.relationship) {
    // יחד vs עצמאות
    const togetherness = findAnswer(answers.relationship, 'relationship_daily_togetherness_vs_autonomy');
    if (togetherness && typeof togetherness === 'number') {
      metrics.togetherVsAutonomy = togetherness * 10;
      explanations.togetherVsAutonomy = {
        value: metrics.togetherVsAutonomy,
        confidence: 90,
        source: 'questionnaire',
        reasoning: 'מבוסס על שאלת יחד vs עצמאות',
      };
    }

    // צמיחה vs קבלה
    const growth = findAnswer(answers.relationship, 'relationship_role_in_growth');
    if (growth) {
      metrics.growthVsAcceptance = mapGrowthToScore(growth);
      explanations.growthVsAcceptance = {
        value: metrics.growthVsAcceptance!,
        confidence: 85,
        source: 'questionnaire',
        reasoning: 'מבוסס על שאלת תפקיד בצמיחה',
      };
    }
  }

  // --- מעולם הדת ---
  if (answers.religion) {
    // צריכת תרבות
    const culture = findAnswer(answers.religion, 'religion_general_culture_consumption');
    if (culture) {
      metrics.cultureConsumption = mapCultureToScore(culture);
      explanations.cultureConsumption = {
        value: metrics.cultureConsumption!,
        confidence: 85,
        source: 'questionnaire',
        reasoning: 'מבוסס על שאלת צריכת תרבות',
      };
    }
  }

  const filledCount = Object.values(metrics).filter(v => v !== undefined).length;
  
  return {
    metrics,
    explanations,
    confidence: Math.min(95, filledCount * 10),
    warnings: [],
  };
}

function findAnswer(answers: any, questionId: string): any {
  if (!answers) return undefined;
  
  // אם זה מערך של תשובות
  if (Array.isArray(answers)) {
    const found = answers.find((a: any) => a.questionId === questionId);
    return found?.value;
  }
  
  // אם זה אובייקט עם מפתחות
  if (answers[questionId]) {
    return answers[questionId].value || answers[questionId];
  }
  
  return undefined;
}

function mapSocialBatteryToScore(value: any): number {
  // מיפוי תשובות אפשריות לציון
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower.includes('alone') || lower.includes('לבד')) return 20;
    if (lower.includes('small') || lower.includes('קטנה')) return 40;
    if (lower.includes('mix') || lower.includes('שילוב')) return 60;
    if (lower.includes('people') || lower.includes('אנשים')) return 80;
  }
  return 50;
}

function mapStructureToScore(value: any): number {
  if (typeof value === 'number') return 100 - value;  // 0=מאורגן, 100=ספונטני
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower.includes('strict') || lower.includes('קפדני')) return 10;
    if (lower.includes('organized') || lower.includes('מסודר')) return 30;
    if (lower.includes('flexible') || lower.includes('גמיש')) return 70;
    if (lower.includes('spontaneous') || lower.includes('ספונטני')) return 90;
  }
  return 50;
}

function mapGrowthToScore(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower.includes('accept') || lower.includes('קבלה')) return 20;
    if (lower.includes('support') || lower.includes('תמיכה')) return 40;
    if (lower.includes('encourage') || lower.includes('עידוד')) return 70;
    if (lower.includes('challenge') || lower.includes('אתגר')) return 90;
  }
  return 50;
}

function mapCultureToScore(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower.includes('avoid') || lower.includes('נמנע')) return 10;
    if (lower.includes('selective') || lower.includes('בררני')) return 40;
    if (lower.includes('moderate') || lower.includes('מתון')) return 60;
    if (lower.includes('open') || lower.includes('פתוח')) return 90;
  }
  return 50;
}

function mergeMetrics(
  direct: DirectMetricsResult,
  ai: AIMetricsResult
): { metrics: Partial<ProfileMetrics>; explanations: Record<string, MetricExplanation> } {
  const metrics: Partial<ProfileMetrics> = { ...ai.metrics };
  const explanations: Record<string, MetricExplanation> = { ...ai.explanations };

  // עדיפות לנתונים ישירים (מהשאלון)
  Object.entries(direct.metrics).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      (metrics as any)[key] = value;
      if (direct.explanations[key]) {
        explanations[key] = direct.explanations[key];
      }
    }
  });

  return { metrics, explanations };
}

function calculateDataCompleteness(result: { metrics: Partial<ProfileMetrics> }): number {
  const importantFields = [
    'socialEnergy',
    'emotionalExpression',
    'religiousStrictness',
    'careerOrientation',
    'urbanScore',
    'englishFluency',
    'backgroundCategory',
    'togetherVsAutonomy',
    'familyInvolvement',
    'adventureScore',
  ];

  const filled = importantFields.filter(
    (f) => (result.metrics as any)[f] !== undefined && (result.metrics as any)[f] !== null
  ).length;

  return Math.round((filled / importantFields.length) * 100);
}

// ═══════════════════════════════════════════════════════════════
// SAVE TO DATABASE
// ═══════════════════════════════════════════════════════════════

export async function saveProfileMetrics(
  profileId: string,
  output: MetricsExtractionOutput
): Promise<void> {
  const { metrics, explanations } = output;

  // פונקציית עזר לטיפול בערכי Enum
  // אם יש ערך - מחזירים אותו. אם אין - מחזירים null (שיעבור המרה ב-SQL)
  const val = (v: any) => v ?? null;

  await prisma.$executeRaw`
    INSERT INTO "profile_metrics" (
      "id", "profileId", "updatedAt", "calculatedBy", "confidenceScore", "dataCompleteness", "lastAiAnalysisAt",
      "socialEnergy", "emotionalExpression", "stabilityVsSpontaneity", "independenceLevel", "optimismLevel",
      "humorStyle", "careerOrientation", "intellectualOrientation", "financialApproach", "ambitionLevel",
      "religiousStrictness", "spiritualDepth", "cultureConsumption", "urbanScore", "englishFluency",
      "americanCompatibility", "ethnicBackground", "backgroundCategory", "togetherVsAutonomy",
      "familyInvolvement", "parenthoodPriority", "growthVsAcceptance", "nightOwlScore", "adventureScore",
      "petsAttitude", "communicationStyle", "conflictStyle", "supportStyle", "appearancePickiness",
      "difficultyFlags", "dealBreakersHard", "dealBreakersSoft",
      "inferredPersonalityType", "inferredAttachmentStyle", "inferredLoveLanguages", "inferredRelationshipGoals",
      "metricsExplanations", "aiPersonalitySummary", "aiSeekingSummary"
    )
    VALUES (
      ${generateCuid()},
      ${profileId},
      NOW(),
      ${val(metrics.calculatedBy || 'AI_AUTO')}::"CalculatedBy",
      ${val(metrics.confidenceScore || 50)},
      ${val(metrics.dataCompleteness || 0)},
      NOW(),

      ${val(metrics.socialEnergy)},
      ${val(metrics.emotionalExpression)},
      ${val(metrics.stabilityVsSpontaneity)},
      ${val(metrics.independenceLevel)},
      ${val(metrics.optimismLevel)},
      ${val(metrics.humorStyle)}::"HumorStyle",
      ${val(metrics.careerOrientation)},
      ${val(metrics.intellectualOrientation)},
      ${val(metrics.financialApproach)},
      ${val(metrics.ambitionLevel)},
      ${val(metrics.religiousStrictness)},
      ${val(metrics.spiritualDepth)},
      ${val(metrics.cultureConsumption)},
      ${val(metrics.urbanScore)},
      ${val(metrics.englishFluency)},
      ${val(metrics.americanCompatibility)},
      ${val(metrics.ethnicBackground)}::"EthnicBackground",
      ${val(metrics.backgroundCategory)}::"BackgroundCategory",
      ${val(metrics.togetherVsAutonomy)},
      ${val(metrics.familyInvolvement)},
      ${val(metrics.parenthoodPriority)},
      ${val(metrics.growthVsAcceptance)},
      ${val(metrics.nightOwlScore)},
      ${val(metrics.adventureScore)},
      ${val(metrics.petsAttitude)}::"PetsAttitude",
      ${val(metrics.communicationStyle)}::"CommunicationStyle",
      ${val(metrics.conflictStyle)}::"ConflictStyle",
      ${val(metrics.supportStyle)}::"SupportStyle",
      ${val(metrics.appearancePickiness)},
      ${JSON.stringify(metrics.difficultyFlags || [])}::jsonb,

      ${JSON.stringify(metrics.dealBreakersHard || [])}::jsonb,
      ${JSON.stringify(metrics.dealBreakersSoft || [])}::jsonb,

      ${val(metrics.inferredPersonalityType)}::"PersonalityType",
      ${val(metrics.inferredAttachmentStyle)}::"AttachmentStyle",
      ${JSON.stringify(metrics.inferredLoveLanguages || [])}::jsonb,
      ${JSON.stringify(metrics.inferredRelationshipGoals || {})}::jsonb,

      ${JSON.stringify(explanations)}::jsonb,
      ${val(metrics.aiPersonalitySummary)},
      ${val(metrics.aiSeekingSummary)}
    )
    ON CONFLICT ("profileId") DO UPDATE SET
      "updatedAt" = NOW(),
      "calculatedBy" = EXCLUDED."calculatedBy",
      "confidenceScore" = EXCLUDED."confidenceScore",
      "dataCompleteness" = EXCLUDED."dataCompleteness",
      "lastAiAnalysisAt" = NOW(),
      "socialEnergy" = COALESCE(EXCLUDED."socialEnergy", "profile_metrics"."socialEnergy"),
      "emotionalExpression" = COALESCE(EXCLUDED."emotionalExpression", "profile_metrics"."emotionalExpression"),
      "religiousStrictness" = COALESCE(EXCLUDED."religiousStrictness", "profile_metrics"."religiousStrictness"),
      "humorStyle" = COALESCE(EXCLUDED."humorStyle", "profile_metrics"."humorStyle"),
      "backgroundCategory" = COALESCE(EXCLUDED."backgroundCategory", "profile_metrics"."backgroundCategory"),
      "metricsExplanations" = EXCLUDED."metricsExplanations";
  `;

  console.log(`[MetricsExtraction] Saved metrics for profile: ${profileId}`);
}

function generateCuid(): string {
  // פשוט UUID - בפרודקשן להשתמש ב-cuid או nanoid
  return 'pm_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const metricsExtractionService = {
  extractMetricsFromProfile,
  saveProfileMetrics,
};

export default metricsExtractionService;